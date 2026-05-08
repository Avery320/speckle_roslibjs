/**
 * POINTS Marker 建構器，負責少量點、控制點與標記點的視覺化。
 */
import { MARKER_TYPES } from '../constants.js';
import { createBaseMarker } from './createBaseMarker.js';

/**
 * 從一個或多個點記錄建立 POINTS marker。
 *
 * ROS POINTS marker 使用 scale.x 與 scale.y 作為點尺寸。
 */
export function createPointsMarker(record, index, options = {}) {
  const marker = createBaseMarker(record, index, options);
  marker.type = MARKER_TYPES.POINTS;
  marker.scale = {
    x: Number(options.pointSize || 0.03),
    y: Number(options.pointSize || 0.03),
    z: 0
  };
  marker.points = record.points || [];
  return marker.points.length ? marker : null;
}
