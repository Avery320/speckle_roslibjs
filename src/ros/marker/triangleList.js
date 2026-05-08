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
  marker.points = createTriangleListPoints(record);
  marker.colors = createTriangleListColors(record);
  return marker.points.length ? marker : null;
}

/**
 * 將帶索引 mesh 面展開成 TRIANGLE_LIST 需要的明確點順序。
 */
function createTriangleListPoints(record) {
  const points = [];
  for (const face of record.faces || []) {
    for (const vertexIndex of face) {
      // Marker TRIANGLE_LIST 需要繪製順序的點，而不是帶索引幾何。
      const point = record.vertices?.[vertexIndex];
      if (point) points.push(point);
    }
  }
  return points;
}

/**
 * 將逐頂點顏色依 TRIANGLE_LIST 點順序同步展開。
 */
function createTriangleListColors(record) {
  const colors = [];
  for (const face of record.faces || []) {
    for (const vertexIndex of face) {
      // 頂點顏色使用與三角面點相同的順序展開。
      const color = record.colors?.[vertexIndex];
      if (color) colors.push(color);
    }
  }
  return colors.length ? colors : [];
}
