/**
 * examples 專用的 roslib MarkerArray 發布工具。
 *
 * 這個檔案只服務手動整合範例，不屬於核心 API。
 */
import { Ros, Topic } from 'roslib';

export const DEFAULT_ROSBRIDGE_URL = 'ws://localhost:9090';
export const DEFAULT_MARKER_TOPIC = '/speckle/markers';
export const DEFAULT_MESH_MARKER_TOPIC = '/speckle/mesh_markers';
export const DEFAULT_LINE_MARKER_TOPIC = '/speckle/line_markers';
export const DEFAULT_POINT_MARKER_TOPIC = '/speckle/point_markers';
export const DEFAULT_FRAME_ID = 'world';

/**
 * 將 MarkerArray message 發布到 rosbridge。
 */
export async function publishMarkerArray(message, options = {}) {
  const rosbridgeUrl = options.rosbridgeUrl || process.env.ROSBRIDGE_URL || DEFAULT_ROSBRIDGE_URL;
  const topicName = process.env.ROS_TOPIC || options.topicName || DEFAULT_MARKER_TOPIC;
  const frameId = options.frameId || process.env.ROS_FRAME_ID || DEFAULT_FRAME_ID;

  const ros = new Ros({ url: rosbridgeUrl });
  await waitForConnection(ros, rosbridgeUrl);

  const topic = new Topic({
    ros,
    name: topicName,
    messageType: 'visualization_msgs/MarkerArray',
    latch: true,
    queue_size: 1
  });

  topic.publish(message);

  console.log(`Published ${options.label || 'MarkerArray'} to ${topicName}`);
  console.log(`rosbridge: ${rosbridgeUrl}`);
  console.log(`frame_id: ${frameId}`);
  console.log(`markers: ${message.markers.length}`);

  await delay(500);
  topic.unadvertise();
  ros.close();
}

/**
 * 讀取手動範例共用的 frameId 設定。
 */
export function readFrameId() {
  return process.env.ROS_FRAME_ID || DEFAULT_FRAME_ID;
}

function waitForConnection(ros, rosbridgeUrl) {
  return new Promise((resolve, reject) => {
    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`無法連線到 rosbridge：${rosbridgeUrl}`));
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
