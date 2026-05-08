/**
 * MarkerArray 最小範例。
 *
 * 本範例只建立 ROS message payload，不建立 ROS connection，也不執行 publish。
 * 呼叫端可以把輸出交給 ROSLIB.Topic.publish(message)。
 */
import { speckleToMarkerArrayMessage } from '../src/index.js';

const mesh = {
  id: 'example_mesh',
  speckle_type: 'Objects.Geometry.Mesh',
  vertices: [
    0, 0, 0,
    1, 0, 0,
    0, 1, 0
  ],
  faces: [3, 0, 1, 2],
  color: 0x3399ff
};

const curve = {
  id: 'example_curve',
  speckle_type: 'Objects.Geometry.Curve',
  points: [
    0, 0, 0,
    0.5, 0.25, 0,
    1, 0, 0
  ],
  color: 0xff8844
};

const point = {
  id: 'example_point',
  speckle_type: 'Objects.Geometry.Point',
  x: 0.5,
  y: 0.5,
  z: 0,
  color: 0x44cc66
};

const message = speckleToMarkerArrayMessage([mesh, curve, point], {
  frameId: 'world',
  lineWidth: 0.02,
  pointSize: 0.06
});

console.log(JSON.stringify(message, null, 2));

/**
 * 呼叫端發布範例：
 *
 * const topic = new ROSLIB.Topic({
 *   ros,
 *   name: '/speckle/mesh_markers',
 *   messageType: 'visualization_msgs/MarkerArray'
 * });
 *
 * topic.publish(message);
 */
