/**
 * TRIANGLE_LIST Marker 建構器，負責 Speckle mesh 到 visualization_msgs/Marker 的三角面展開。
 */
import { MARKER_TYPES } from '../constants.js';
import { createBaseMarker } from './createBaseMarker.js';

/**
 * 從帶索引的 mesh 幾何建立 TRIANGLE_LIST marker。
 */
export function createTriangleListMarker(record, index, options = {}) {
  const marker = createBaseMarker(record, index, options);
  marker.type = MARKER_TYPES.TRIANGLE_LIST;
  const triangles = createTriangleListGeometry(record);
  marker.points = triangles.points;
  marker.colors = triangles.colors;
  return marker.points.length ? marker : null;
}

/**
 * 將帶索引 mesh 面展開成 TRIANGLE_LIST 需要的明確點順序。
 *
 * ROS TRIANGLE_LIST 每三個 points 代表一個三角形。若某個 face 缺少頂點，
 * 該 face 會被跳過，避免輸出不是三的倍數的非法 marker。
 */
function createTriangleListGeometry(record) {
  const points = [];
  const colors = [];
  let hasCompleteColors = true;

  for (const face of record.faces || []) {
    const facePoints = face.map((vertexIndex) => record.vertices?.[vertexIndex]).filter(Boolean);
    if (facePoints.length !== 3) continue;

    points.push(...facePoints);

    const faceColors = face.map((vertexIndex) => record.colors?.[vertexIndex]).filter(Boolean);
    if (faceColors.length === 3 && hasCompleteColors) {
      colors.push(...faceColors);
    } else {
      hasCompleteColors = false;
    }
  }

  return {
    points,
    // Marker.colors 必須為空陣列，或與 points 長度一致。
    colors: hasCompleteColors && colors.length === points.length ? colors : []
  };
}
