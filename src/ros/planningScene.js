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
  const mesh = createShapeMesh(record);
  if (!mesh) return null;

  return {
    id: createRosIdentity(record, {
      ...options,
      fallbackId: `collision_${index}`
    }),
    header: {
      stamp: createRosTime(options.stamp),
      frame_id: options.frameId || record.frameId || 'world'
    },
    pose: createIdentityPose(),
    type: { key: '', db: '' },
    primitives: [],
    primitive_poses: [],
    meshes: [mesh],
    mesh_poses: [createIdentityPose()],
    planes: [],
    plane_poses: [],
    subframe_names: [],
    subframe_poses: [],
    operation: COLLISION_OBJECT_OPERATIONS.ADD
  };
}

/**
 * 將正規化 mesh 轉成 shape_msgs/Mesh。
 *
 * shape_msgs/Mesh 保留一份 vertices 陣列，triangles 只保存三個頂點索引。
 * 這與 Marker 的 TRIANGLE_LIST 不同；PlanningScene 不需要展開重複點。
 */
function createShapeMesh(record) {
  const vertices = createMeshVertices(record.vertices);
  const triangles = createMeshTriangles(record.faces, vertices.length);

  if (vertices.length < 3 || !triangles.length) return null;

  return {
    triangles,
    vertices
  };
}

/**
 * 複製 mesh vertices 為 ROS geometry_msgs/Point 結構。
 */
function createMeshVertices(vertices = []) {
  if (!vertices.length) return [];

  const points = vertices.map(createPoint);
  return points.every(Boolean) ? points : [];
}

/**
 * 將 mesh face 索引轉成 shape_msgs/MeshTriangle。
 *
 * 每個 triangle 必須剛好有三個有效頂點索引。無效 face 會被跳過，
 * 避免輸出 MoveIt 無法建立碰撞網格的 message。
 */
function createMeshTriangles(faces = [], vertexCount = 0) {
  return faces
    .filter((face) => isValidTriangleFace(face, vertexCount))
    .map((face) => ({
      vertex_indices: face.map((vertexIndex) => Math.trunc(Number(vertexIndex)))
    }));
}

function isValidTriangleFace(face, vertexCount) {
  return Array.isArray(face)
    && face.length === 3
    && face.every((vertexIndex) => {
      const index = Number(vertexIndex);
      return Number.isInteger(index) && index >= 0 && index < vertexCount;
    });
}

function createPoint(point) {
  const x = Number(point?.x);
  const y = Number(point?.y);
  const z = Number(point?.z);

  if (![x, y, z].every(Number.isFinite)) return null;

  return { x, y, z };
}
