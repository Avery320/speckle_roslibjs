/**
 * 手動 ROS 整合範例：發布一個中心在 (-1, -1, 1) 的 Speckle sphere mesh 到 PlanningScene。
 */
import { Ros, Topic } from 'roslib';
import { speckleToPlanningSceneMessage } from '../src/index.js';

const DEFAULT_ROSBRIDGE_URL = 'ws://localhost:9090';
const DEFAULT_PLANNING_SCENE_TOPIC = '/planning_scene';
const DEFAULT_FRAME_ID = 'world';

const frameId = process.env.ROS_FRAME_ID || DEFAULT_FRAME_ID;
const rosbridgeUrl = process.env.ROSBRIDGE_URL || DEFAULT_ROSBRIDGE_URL;
const topicName = process.env.ROS_TOPIC || DEFAULT_PLANNING_SCENE_TOPIC;
const radius = Number(process.env.SPHERE_RADIUS || 0.5);
const widthSegments = Number(process.env.SPHERE_SEGMENTS || 24);
const heightSegments = Number(process.env.SPHERE_RINGS || 12);

const sphere = createSphereMesh({
  id: 'speckle_sphere_planning_scene_minus_1_minus_1_1',
  center: { x: -1, y: -1, z: 1 },
  radius,
  widthSegments,
  heightSegments,
  color: 0x3399ff
});

const message = speckleToPlanningSceneMessage(sphere, {
  frameId,
  isDiff: true
});

const ros = new Ros({ url: rosbridgeUrl });
await waitForConnection(ros, rosbridgeUrl);

const topic = new Topic({
  ros,
  name: topicName,
  messageType: 'moveit_msgs/PlanningScene',
  latch: true,
  queue_size: 1
});

topic.publish(message);

const collisionObject = message.world.collision_objects[0];
console.log(`Published sphere PlanningScene to ${topicName}`);
console.log(`rosbridge: ${rosbridgeUrl}`);
console.log(`frame_id: ${frameId}`);
console.log(`collision_objects: ${message.world.collision_objects.length}`);
console.log(`vertices: ${collisionObject?.meshes?.[0]?.vertices?.length || 0}`);
console.log(`triangles: ${collisionObject?.meshes?.[0]?.triangles?.length || 0}`);

await delay(500);
topic.unadvertise();
ros.close();

/**
 * 建立 Speckle mesh 結構的 UV sphere。
 *
 * vertices 使用扁平 xyz 陣列；faces 使用 Speckle mesh 的三角面編碼。
 */
function createSphereMesh({ id, center, radius, widthSegments, heightSegments, color }) {
  const safeWidthSegments = Math.max(3, Math.trunc(widthSegments));
  const safeHeightSegments = Math.max(2, Math.trunc(heightSegments));
  const vertices = [];
  const faces = [];

  for (let ring = 0; ring <= safeHeightSegments; ring += 1) {
    const v = ring / safeHeightSegments;
    const theta = v * Math.PI;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let segment = 0; segment <= safeWidthSegments; segment += 1) {
      const u = segment / safeWidthSegments;
      const phi = u * Math.PI * 2;

      vertices.push(
        center.x + radius * sinTheta * Math.cos(phi),
        center.y + radius * sinTheta * Math.sin(phi),
        center.z + radius * cosTheta
      );
    }
  }

  for (let ring = 0; ring < safeHeightSegments; ring += 1) {
    for (let segment = 0; segment < safeWidthSegments; segment += 1) {
      const a = ring * (safeWidthSegments + 1) + segment;
      const b = a + safeWidthSegments + 1;
      const c = b + 1;
      const d = a + 1;

      if (ring !== 0) faces.push(3, a, b, d);
      if (ring !== safeHeightSegments - 1) faces.push(3, b, c, d);
    }
  }

  return {
    id,
    speckle_type: 'Objects.Geometry.Mesh',
    vertices,
    faces,
    color
  };
}

function waitForConnection(ros, url) {
  return new Promise((resolve, reject) => {
    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`無法連線到 rosbridge：${url}`));
    }, 5000);

    ros.on('connection', () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve();
    });

    ros.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(error);
    });
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
