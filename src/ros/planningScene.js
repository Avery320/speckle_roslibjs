/**
 * PlanningScene 訊息建構器，將 Speckle mesh 轉成 MoveIt collision world 使用的 PlanningScene diff。
 */
import { createRosIdentity } from '../identity/createRosIdentity.js';
import { SPECKLE_GEOMETRY_TYPES } from '../speckle/geometryTypes.js';
import { fromSpeckleObject } from '../speckle/fromSpeckleObject.js';
import { createIdentityPose } from '../utils/matrix.js';
import { createRosTime } from '../utils/rosTime.js';
import { COLLISION_OBJECT_OPERATIONS } from './constants.js';

/**
 * 從 Speckle mesh 幾何建立 moveit_msgs/PlanningScene diff 訊息。
 *
 * @param {object|object[]} input Speckle 物件、displayValue 幾何或正規化 mesh 記錄。
 * @param {object} options PlanningScene 轉換設定，例如 frameId、stamp、isDiff。
 * @returns {object} ROS PlanningScene 訊息物件，包含 collision objects。
 */

export function speckleToPlanningSceneMessage(input, options = {}) {
  // PlanningScene 只接收 mesh 幾何，因為 CollisionObject mesh 需要三角面資料。
  const collisionObjects = fromSpeckleObject(input, options)
    .filter((record) => record.type === SPECKLE_GEOMETRY_TYPES.MESH)
    .map((record, index) => createCollisionObject(record, index, options))
    .filter(Boolean);

  return {
    is_diff: options.isDiff ?? true,
    world: {
      collision_objects: collisionObjects
    }
  };
}

/**
 * 將單一正規化 mesh 記錄轉成 MoveIt CollisionObject。
 *
 * mesh vertices 會複製到 shape_msgs/Mesh.vertices。
 * 面索引會映射到 shape_msgs/MeshTriangle，讓 MoveIt 重建碰撞表面。
 */
function createCollisionObject(record, index, options) {
  if (!record.vertices?.length || !record.faces?.length) return null;

  return {
    id: createRosIdentity(record, {
      ...options,
      fallbackId: `collision_${index}`
    }),
    header: {
      stamp: createRosTime(options.stamp),
      frame_id: options.frameId || record.frameId || 'world'
    },
    meshes: [
      {
        vertices: record.vertices,
        // shape_msgs/MeshTriangle 只保存頂點索引；vertices 保留在共用 mesh vertex array。
        triangles: record.faces.map((face) => ({ vertex_indices: face }))
      }
    ],
    mesh_poses: [createIdentityPose()],
    operation: COLLISION_OBJECT_OPERATIONS.ADD
  };
}
