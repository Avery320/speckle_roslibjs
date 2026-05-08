/**
 * Speckle displayValue 轉接層，將 Speckle 幾何資料正規化為 ROS 訊息建構器可使用的內部記錄。
 */
import {
  SPECKLE_GEOMETRY_TYPES,
  inferGeometryType,
  isGeometryRecord,
  isSupportedGeometryType
} from './geometryTypes.js';
import { normalizeColor, normalizeColorList } from '../utils/color.js';
import { isPlainObject, toArray } from '../utils/validation.js';

/**
 * 將 Speckle displayValue 幾何轉成正規化幾何記錄。
 *
 * @param {object|object[]} displayValue Speckle displayValue 幾何或 displayValue 幾何陣列。
 * @param {object} options 轉換設定，例如 id、units、color、fallbackId、diagnostics。
 * @returns {object[]} ROS 訊息建構器使用的正規化幾何記錄。
 */

export function fromDisplayValue(displayValue, options = {}) {
  const diagnostics = options.diagnostics || [];

  // 單一輸入與陣列輸入使用同一條處理流程正規化。
  // 每個項目會取得帶索引的備用 id，讓產生的 ROS 識別值維持穩定。
  return toArray(displayValue)
    .flatMap((item, index) => normalizeDisplayItem(item, {
      ...options,
      diagnostics,
      fallbackId: createFallbackId(options, index)
    }))
    .filter(Boolean);
}

/**
 * 將單一 displayValue 項目導向對應的幾何記錄工廠函式。
 *
 * 轉接層將此判斷集中在同一位置，讓下游 ROS 訊息建構器無論原始 Speckle 物件
 * 格式為何，都能接收一致的正規化記錄結構。
 */
function normalizeDisplayItem(item, options) {
  // 已正規化的記錄直接通過，讓呼叫端可以把此轉接層當成共用入口。
  if (isGeometryRecord(item)) {
    return item;
  }

  if (!isPlainObject(item)) {
    addDiagnostic(options, 'invalid_display_value', 'displayValue 必須是物件。', item);
    return null;
  }

  const type = inferGeometryType(item);
  if (!isSupportedGeometryType(type)) {
    addDiagnostic(options, 'unsupported_geometry', '無法判斷可發布的 Speckle 幾何類型。', item);
    return null;
  }

  // 完成中繼資料與結構推斷後，依正規化幾何類型分派。
  if (type === SPECKLE_GEOMETRY_TYPES.MESH) return createMeshRecord(item, options);
  if (type === SPECKLE_GEOMETRY_TYPES.LINE) return createLineRecord(item, options);
  if (type === SPECKLE_GEOMETRY_TYPES.POINT) return createPointRecord(item, options);

  return null;
}

/**
 * 建立 MarkerArray 與 PlanningScene 訊息建構器共用的內部 mesh 記錄。
 *
 * Speckle mesh 資料可能以直接的 vertices/faces 陣列或抽出的幾何屬性進入。
 * 演算法會讀取 POSITION 作為 vertices，讀取 INDEX/faces 作為 triangles，
 * 並將 mesh 保存為帶索引三角面，讓視覺與碰撞訊息建構器共用。
 */
function createMeshRecord(item, options) {
  // mesh 記錄保留帶索引的 vertices 與三角面，讓 MarkerArray 與 PlanningScene 共用同一份來源。
  const vertices = readPoints(readAttribute(item, 'POSITION') || item.vertices || item.points);
  const faces = readFaces(readAttribute(item, 'INDEX') || item.faces, vertices.length);

  if (vertices.length < 3 || !faces.length) {
    addDiagnostic(options, 'invalid_mesh', 'Mesh 需要至少三個 vertices 與一組 triangle faces。', item);
    return null;
  }

  return {
    type: SPECKLE_GEOMETRY_TYPES.MESH,
    id: readStableId(item, options),
    vertices,
    faces,
    colors: readColors(item, vertices.length),
    color: readMaterialColor(item, options),
    units: readUnits(item, options),
    source: item
  };
}

/**
 * 從 start/end pair 或有序點陣列建立內部 line 記錄。
 *
 * 輸出的 points 會保留順序，因為 ROS LINE_STRIP 使用點順序作為繪製路徑。
 * 這裡不進行 segment expansion。
 */
function createLineRecord(item, options) {
  const points = item.start && item.end
    ? [readPoint(item.start), readPoint(item.end)].filter(Boolean)
    : readPoints(readAttribute(item, 'POSITION') || item.points || item.vertices || item.value);

  if (points.length < 2) {
    addDiagnostic(options, 'invalid_line', 'Line 需要至少兩個 points。', item);
    return null;
  }

  return {
    type: SPECKLE_GEOMETRY_TYPES.LINE,
    id: readStableId(item, options),
    points,
    colors: readColors(item, points.length),
    color: readMaterialColor(item, options),
    units: readUnits(item, options),
    source: item
  };
}

/**
 * 建立單點記錄。
 *
 * 有些 Speckle 類點輸入會把單一 point 放在 points/vertices 陣列中，
 * 有些則直接在物件上暴露 x/y/z。本函式同時支援這兩種結構。
 */
function createPointRecord(item, options) {
  const points = readPoints(item.points || item.vertices || item.value);
  const point = points[0] || readPoint(item);

  if (!point) {
    addDiagnostic(options, 'invalid_point', 'Point 需要 x/y/z。', item);
    return null;
  }

  return {
    type: SPECKLE_GEOMETRY_TYPES.POINT,
    id: readStableId(item, options),
    points: [point],
    color: readMaterialColor(item, options),
    units: readUnits(item, options),
    source: item
  };
}

/**
 * 解析所有記錄工廠函式共用的穩定來源 id。
 */
function readStableId(item, options) {
  return String(options.id ?? item.id ?? item.guid ?? item.applicationId ?? item.renderData?.id ?? options.fallbackId);
}

/**
 * 為陣列輸入建立可重現的備用 id。
 */
function createFallbackId(options, index) {
  const prefix = options.fallbackId || 'speckle_geometry';
  return `${prefix}_${index}`;
}

/**
 * 優先從呼叫端設定讀取幾何單位，再從 Speckle 來源欄位讀取。
 */
function readUnits(item, options) {
  return options.units || item.units || item.displayUnits || null;
}

/**
 * 讀取優先使用的材質顏色，並轉成正規化 RGBA。
 *
 * 查找順序依照常見 Speckle 顯示資料設計：
 * explicit color、colorMaterial、renderMaterial、displayStyle，最後使用呼叫端提供的備用顏色。
 */
function readMaterialColor(item, options) {
  return normalizeColor(
    item.color
      ?? item.renderData?.colorMaterial?.color
      ?? item.renderData?.renderMaterial?.diffuse
      ?? item.renderData?.displayStyle?.color
      ?? options.color
  );
}

/**
 * 讀取可選的逐頂點顏色，並裁切到預期頂點數量。
 */
function readColors(item, expectedCount) {
  const colors = normalizeColorList(readAttribute(item, 'COLOR') || item.colors || []);
  return colors.length >= expectedCount ? colors.slice(0, expectedCount) : [];
}

/**
 * 將 Speckle 面資料轉成三角面索引陣列。
 *
 * 支援輸入：
 * - Speckle 編碼面：[3, a, b, c, 4, a, b, c, d, ...]
 * - 一般三角面索引緩衝：[a, b, c, a, c, d, ...]
 * - 已展開的三角面頂點，使用連續三點為一組
 */
function readFaces(value, vertexCount) {
  const values = toNumberArray(value);
  if (!values.length && vertexCount >= 3) {
    // 連續三角面備用路徑支援已展開的三角面頂點列表。
    return createSequentialFaces(vertexCount);
  }

  const speckleFaces = readSpeckleEncodedFaces(values);
  if (speckleFaces.length) return speckleFaces;

  // 一般索引緩衝會以三個索引為一組解讀：[a, b, c, a, c, d, ...]。
  const faces = [];
  for (let index = 0; index + 2 < values.length; index += 3) {
    faces.push([values[index], values[index + 1], values[index + 2]]);
  }
  return faces;
}

/**
 * 解碼 Speckle 面編碼。
 *
 * 每個面以頂點數量開頭。三角面會直接複製。
 * 四邊面會沿 [0, 2] 對角線拆成兩個三角面，並保持可重現的繞序。
 */
function readSpeckleEncodedFaces(values) {
  const faces = [];
  let cursor = 0;

  while (cursor < values.length) {
    // Speckle mesh 面編碼為 [vertexCount, ...indices]；此迴圈依每個面的寬度前進。
    const count = values[cursor];
    if (count !== 3 && count !== 4) return [];
    if (cursor + count >= values.length) return [];

    const indices = values.slice(cursor + 1, cursor + 1 + count);
    if (count === 3) {
      faces.push(indices);
    } else {
      // 將四邊面三角化成兩個三角面，以符合 mesh-based ROS messages。
      faces.push([indices[0], indices[1], indices[2]], [indices[0], indices[2], indices[3]]);
    }
    cursor += count + 1;
  }

  return faces;
}

/**
 * 從已展開的三角面頂點緩衝建立三角面。
 */
function createSequentialFaces(vertexCount) {
  const faces = [];
  for (let index = 0; index + 2 < vertexCount; index += 3) {
    faces.push([index, index + 1, index + 2]);
  }
  return faces;
}

/**
 * 將類點資料轉成 ROS point 物件。
 *
 * 支援結構：
 * - [{ x, y, z }, ...]
 * - [[x, y, z], ...]
 * - [x, y, z, x, y, z, ...]
 * - 以 xyz 三元組表示的型別陣列
 */
function readPoints(value) {
  if (!value) return [];

  if (Array.isArray(value) && value.length && isPlainObject(value[0])) {
    return value.map(readPoint).filter(Boolean);
  }

  if (Array.isArray(value) && value.length && Array.isArray(value[0])) {
    return value.map(readPoint).filter(Boolean);
  }

  const values = toNumberArray(value);
  const points = [];
  for (let index = 0; index + 2 < values.length; index += 3) {
    // 扁平座標陣列會以 x/y/z 三元組讀取。
    points.push({
      x: values[index],
      y: values[index + 1],
      z: values[index + 2]
    });
  }
  return points;
}

/**
 * 從物件或 tuple 讀取單一 xyz point。
 */
function readPoint(value) {
  if (!value) return null;

  const x = value.x ?? value[0];
  const y = value.y ?? value[1];
  const z = value.z ?? value[2];
  if (![x, y, z].every((component) => Number.isFinite(Number(component)))) {
    return null;
  }

  return {
    x: Number(x),
    y: Number(y),
    z: Number(z)
  };
}

/**
 * 從一般物件、類 Map 屬性或已抽出的幾何資料讀取幾何屬性。
 */
function readAttribute(item, key) {
  const attributes = item?.attributes || item?.geometry?.attributes || item?.renderData?.geometry?.attributes;
  const value = attributes?.[key] || attributes?.get?.(key);
  return value?.array || value;
}

/**
 * 將支援的類陣列 Speckle 與已抽出的幾何容器轉成數字陣列。
 */
function toNumberArray(value) {
  if (!value) return [];

  if (ArrayBuffer.isView(value)) {
    // 型別陣列是幾何抽取後最常見的資料形式。
    return Array.from(value).map(Number);
  }

  if (Array.isArray(value)) {
    return value.map(Number).filter(Number.isFinite);
  }

  if (typeof value.getFloat32Array === 'function') {
    // Speckle viewer chunk 會暴露型別陣列 getter；這裡不引入 viewer package 也能讀取。
    return Array.from(value.getFloat32Array()).map(Number);
  }

  if (typeof value.getUint32Array === 'function') {
    // index chunk 常見 unsigned integer getter。
    return Array.from(value.getUint32Array()).map(Number);
  }

  if (typeof value.length === 'number' && typeof value.get === 'function') {
    // 一般 accessor-based chunk 逐一讀取每個值。
    const result = [];
    for (let index = 0; index < value.length; index += 1) {
      result.push(Number(value.get(index)));
    }
    return result.filter(Number.isFinite);
  }

  return [];
}

/**
 * 新增結構化 diagnostic entry，並保留來源幾何類型提示。
 */
function addDiagnostic(options, code, message, source) {
  options.diagnostics?.push({
    code,
    message,
    sourceType: source?.speckle_type || source?.speckleType || source?.type || 'unknown'
  });
}
