/**
 * 手動 ROS 整合範例：發布一個中心在 (1, 1, 1) 的 Speckle cube mesh。
 */
import { speckleToMarkerArrayMessage } from '../src/index.js';
import { DEFAULT_MESH_MARKER_TOPIC, publishMarkerArray, readFrameId } from './helpers/publishMarkerArray.js';

const frameId = readFrameId();
const cubeSize = Number(process.env.CUBE_SIZE || 1);

const cube = createCubeMesh({
  id: 'speckle_cube_1_1_1',
  center: { x: 1, y: 1, z: 1 },
  size: cubeSize,
  color: 0x3399ff
});

const message = speckleToMarkerArrayMessage(cube, {
  frameId
});

await publishMarkerArray(message, {
  frameId,
  topicName: DEFAULT_MESH_MARKER_TOPIC,
  label: 'cube MarkerArray'
});

/**
 * 建立 Speckle mesh 結構的 cube。
 *
 * vertices 使用扁平 xyz 陣列；faces 使用 Speckle mesh 編碼，
 * 每個四邊面以 [4, a, b, c, d] 表示，轉譯層會再三角化。
 */
function createCubeMesh({ id, center, size, color }) {
  const half = size / 2;
  const min = {
    x: center.x - half,
    y: center.y - half,
    z: center.z - half
  };
  const max = {
    x: center.x + half,
    y: center.y + half,
    z: center.z + half
  };

  return {
    id,
    speckle_type: 'Objects.Geometry.Mesh',
    vertices: [
      min.x, min.y, min.z,
      max.x, min.y, min.z,
      max.x, max.y, min.z,
      min.x, max.y, min.z,
      min.x, min.y, max.z,
      max.x, min.y, max.z,
      max.x, max.y, max.z,
      min.x, max.y, max.z
    ],
    faces: [
      4, 0, 1, 2, 3,
      4, 4, 7, 6, 5,
      4, 0, 4, 5, 1,
      4, 1, 5, 6, 2,
      4, 2, 6, 7, 3,
      4, 3, 7, 4, 0
    ],
    color
  };
}
