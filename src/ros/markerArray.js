/**
 * MarkerArray 訊息建構器，負責正規化 Speckle 輸入、分派 Marker type builder，並組成 MarkerArray。
 */
import { SPECKLE_GEOMETRY_TYPES } from '../speckle/geometryTypes.js';
import { fromSpeckleObject } from '../speckle/fromSpeckleObject.js';
import { createTriangleListMarker } from './marker/triangleList.js';
import { createLineStripMarker } from './marker/lineStrip.js';
import { createPointsMarker } from './marker/points.js';

/**
 * 從 Speckle mesh、line、point 幾何建立 visualization_msgs/MarkerArray 訊息。
 *
 * @param {object|object[]} input Speckle 物件、displayValue 幾何或正規化幾何記錄。
 * @param {object} options Marker 轉換設定，例如 frameId、namespace、color、lineWidth、pointSize。
 * @returns {{markers: object[]}} ROS MarkerArray 訊息物件。
 */

export function speckleToMarkerArrayMessage(input, options = {}) {
  // 公開 API 接受原始 Speckle 輸入，先正規化後再建立 marker。
  const records = fromSpeckleObject(input, options);
  const markers = records
    .map((record, index) => createMarker(record, index, options))
    .filter(Boolean);

  return { markers };
}

/**
 * 將單一正規化記錄分派到對應的 marker primitive 建構器。
 */
function createMarker(record, index, options) {
  if (record.type === SPECKLE_GEOMETRY_TYPES.MESH) return createTriangleListMarker(record, index, options);
  if (record.type === SPECKLE_GEOMETRY_TYPES.LINE) return createLineStripMarker(record, index, options);
  if (record.type === SPECKLE_GEOMETRY_TYPES.POINT) return createPointsMarker(record, index, options);
  return null;
}
