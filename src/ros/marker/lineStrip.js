/**
 * LINE_STRIP Marker 建構器，負責連續線性幾何的視覺化。
 */
import { MARKER_TYPES } from '../constants.js';
import { createBaseMarker } from './createBaseMarker.js';

/**
 * 從有序線段點建立 LINE_STRIP marker。
 *
 * ROS line marker 使用 scale.x 作為線寬，y 與 z 不參與線寬計算。
 */
export function createLineStripMarker(record, index, options = {}) {
  const marker = createBaseMarker(record, index, options);
  marker.type = MARKER_TYPES.LINE_STRIP;
  marker.scale = { x: Number(options.lineWidth || 0.01), y: 0, z: 0 };
  marker.points = record.points || [];
  marker.colors = record.colors?.length === marker.points.length ? record.colors : [];
  return marker.points.length >= 2 ? marker : null;
}
