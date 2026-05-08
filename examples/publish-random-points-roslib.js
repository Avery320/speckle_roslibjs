/**
 * 手動 ROS 整合範例：在方形範圍內發布 20 個隨機點。
 */
import { speckleToMarkerArrayMessage } from '../src/index.js';
import { DEFAULT_POINT_MARKER_TOPIC, publishMarkerArray, readFrameId } from './helpers/publishMarkerArray.js';

const frameId = readFrameId();
const count = Number(process.env.POINT_COUNT || 20);
const range = Number(process.env.POINT_RANGE || 2);

const randomPoints = createRandomPointSet({
  id: 'speckle_random_points',
  count,
  range,
  z: 1,
  color: 0x44cc66
});

const message = speckleToMarkerArrayMessage(randomPoints, {
  frameId,
  pointSize: Number(process.env.POINT_SIZE || 0.08)
});

await publishMarkerArray(message, {
  frameId,
  topicName: DEFAULT_POINT_MARKER_TOPIC,
  label: 'random points MarkerArray'
});

/**
 * 建立可轉成 POINTS marker 的點集合。
 *
 * 方形範圍以原點為中心，range 代表邊長。
 */
function createRandomPointSet({ id, count, range, z, color }) {
  const points = [];
  const half = range / 2;

  for (let index = 0; index < count; index += 1) {
    points.push({
      x: randomBetween(-half, half),
      y: randomBetween(-half, half),
      z
    });
  }

  return {
    type: 'point',
    id,
    points,
    color
  };
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
