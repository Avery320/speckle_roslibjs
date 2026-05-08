/**
 * 定義 speckle_roslibjs 內部使用的幾何分類，供 Speckle 轉接層與 ROS 訊息建構器共用。
 */
export const SPECKLE_GEOMETRY_TYPES = Object.freeze({
  MESH: 'mesh',
  LINE: 'line',
  POINT: 'point',
  UNKNOWN: 'unknown'
});

/**
 * 檢查正規化後的幾何類型是否可被目前的訊息建構器轉換。
 */
export function isSupportedGeometryType(type) {
  return Object.values(SPECKLE_GEOMETRY_TYPES).includes(type) && type !== SPECKLE_GEOMETRY_TYPES.UNKNOWN;
}

/**
 * 判斷輸入是否已經通過 Speckle 正規化層。
 */
export function isGeometryRecord(value) {
  return Boolean(value && isSupportedGeometryType(value.type));
}

/**
 * 依照 Speckle 中繼資料與可觀察資料結構推斷正規化幾何類型。
 *
 * 演算法會先檢查明確的 type 中繼資料，因為這些欄位通常保留最強的幾何語意。
 * 若中繼資料不完整，再退回資料結構判斷，讓簡化物件、測試範例、部分抽出的
 * displayValue 資料不需要完整 Speckle 執行期物件也能被分類。
 */

export function inferGeometryType(value = {}) {
  // 收集 Speckle 物件、viewer 資料、GraphQL 回應與測試範例中常見的 type 欄位。
  const typeText = [
    value.type,
    value.speckle_type,
    value.speckleType,
    value.baseType,
    value.__typename,
    value.geometryType,
    value.renderData?.geometryType,
    value.renderData?.geometry?.geometryType,
    value.metadata?.speckle_type,
    value.metaData?.speckle_type
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // 先檢查較精確的名稱，避免 pointcloud 被誤判為 point。
  if (typeText.includes('pointcloud') || typeText.includes('point_cloud')) {
    return SPECKLE_GEOMETRY_TYPES.UNKNOWN;
  }

  if (typeText.includes('mesh') || typeText.includes('brep')) {
    return SPECKLE_GEOMETRY_TYPES.MESH;
  }

  if (typeText.includes('polyline') || typeText.includes('line') || typeText.includes('curve')) {
    return SPECKLE_GEOMETRY_TYPES.LINE;
  }

  if (typeText.includes('point')) {
    return SPECKLE_GEOMETRY_TYPES.POINT;
  }

  if (typeText.includes('frame') || typeText.includes('transform') || typeText.includes('plane')) {
    return SPECKLE_GEOMETRY_TYPES.UNKNOWN;
  }

  // 結構判斷作為備用路徑，用於缺少可靠 type 中繼資料的原始顯示資料。
  if (hasMeshShape(value)) return SPECKLE_GEOMETRY_TYPES.MESH;
  if (hasPointCloudShape(value)) return SPECKLE_GEOMETRY_TYPES.UNKNOWN;
  if (hasLineShape(value)) return SPECKLE_GEOMETRY_TYPES.LINE;
  if (hasPointShape(value)) return SPECKLE_GEOMETRY_TYPES.POINT;
  if (hasFrameShape(value)) return SPECKLE_GEOMETRY_TYPES.UNKNOWN;

  return SPECKLE_GEOMETRY_TYPES.UNKNOWN;
}

function hasMeshShape(value) {
  // mesh 以面索引搭配類 vertex 座標資料辨識。
  return Boolean(value?.faces && (value.vertices || value.points || value.renderData?.geometry?.attributes));
}

function hasPointCloudShape(value) {
  // pointCloud 通常包含點陣列，以及 color、size、count 等逐點中繼資料。
  return Boolean(value?.points && (value?.colors || value?.sizes || value?.pointCount));
}

function hasLineShape(value) {
  // line 可以用 start/end pair 或有序點列表表示。
  return Boolean((value?.start && value?.end) || (Array.isArray(value?.points) && value.points.length >= 2));
}

function hasPointShape(value) {
  // point geometry 是最小的合法 xyz 座標物件。
  return ['x', 'y', 'z'].every((key) => Number.isFinite(Number(value?.[key])));
}

function hasFrameShape(value) {
  // 類 frame 資料透過 transform、matrix、translation 或 origin 欄位辨識。
  return Boolean(value?.transform || value?.matrix || value?.translation || value?.origin);
}
