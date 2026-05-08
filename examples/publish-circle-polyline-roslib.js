/**
 * 手動 ROS 整合範例：發布一條圓形 curve。
 */
import { speckleToMarkerArrayMessage } from '../src/index.js';
import { DEFAULT_LINE_MARKER_TOPIC, publishMarkerArray, readFrameId } from './helpers/publishMarkerArray.js';

const frameId = readFrameId();
const radius = Number(process.env.CIRCLE_RADIUS || 1);
const segments = Number(process.env.CIRCLE_SEGMENTS || 64);

const circleCurve = createCircleCurve({
  id: 'speckle_circle_curve',
  center: { x: 0, y: 0, z: 1 },
  radius,
  segments,
  color: 0xff8844
});

const message = speckleToMarkerArrayMessage(circleCurve, {
  frameId,
  lineWidth: Number(process.env.LINE_WIDTH || 0.03)
});

await publishMarkerArray(message, {
  frameId,
  topicName: DEFAULT_LINE_MARKER_TOPIC,
  label: 'circle polyline MarkerArray'
});

/**
 * 建立以 LINE_STRIP 顯示的圓形 curve sample points。
 *
 * points 最後會補回第一點，讓 LINE_STRIP 在 RViz 中閉合。
 */
function createCircleCurve({ id, center, radius, segments, color }) {
  const points = [];
  const safeSegments = Math.max(8, Math.floor(segments));

  for (let index = 0; index <= safeSegments; index += 1) {
    const angle = (Math.PI * 2 * index) / safeSegments;
    points.push(
      center.x + Math.cos(angle) * radius,
      center.y + Math.sin(angle) * radius,
      center.z
    );
  }

  return {
    id,
    speckle_type: 'Objects.Geometry.Curve',
    points,
    color
  };
}
