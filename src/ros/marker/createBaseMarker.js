/**
 * Marker 共用欄位建構器，集中建立 visualization_msgs/Marker 的基礎結構。
 */
import { createRosIdentity, createRosMarkerId, sanitizeRosNameSegment } from '../../identity/createRosIdentity.js';
import { createIdentityPose } from '../../utils/matrix.js';
import { createRosTime } from '../../utils/rosTime.js';
import { normalizeColor } from '../../utils/color.js';
import { SPECKLE_GEOMETRY_TYPES } from '../../speckle/geometryTypes.js';
import { MARKER_ACTIONS } from '../constants.js';

/**
 * 建立 mesh、line、point marker 共用的 Marker 欄位。
 *
 * ROS Marker 識別值由 namespace 與整數 id 組成。來源識別值會先解析為字串，
 * 再 hash 成 ROS 需要的整數 id。
 */
export function createBaseMarker(record, index, options = {}) {
  const namespace = sanitizeRosNameSegment(options.namespace || createDefaultNamespace(record));
  const identity = createRosIdentity(record, {
    ...options,
    fallbackId: `marker_${index}`
  });

  return {
    header: createHeader(record, options),
    ns: namespace,
    id: createRosMarkerId(`${namespace}:${identity}`),
    action: MARKER_ACTIONS.ADD,
    pose: createIdentityPose(),
    scale: { x: 1, y: 1, z: 1 },
    color: normalizeColor(record.color || options.color),
    lifetime: { secs: 0, nsecs: 0 },
    frame_locked: false,
    points: [],
    colors: []
  };
}

/**
 * 建立所有產生出的 marker 共用的 ROS Header。
 */
function createHeader(record, options) {
  return {
    stamp: createRosTime(options.stamp),
    frame_id: options.frameId || record.frameId || 'world'
  };
}

/**
 * 依目前支援的幾何類型建立預設 Marker namespace。
 */
function createDefaultNamespace(record) {
  if (record?.type === SPECKLE_GEOMETRY_TYPES.MESH) return 'speckle_mesh';
  if (record?.type === SPECKLE_GEOMETRY_TYPES.LINE) return 'speckle_polyline';
  if (record?.type === SPECKLE_GEOMETRY_TYPES.POINT) return 'speckle_point';
  return 'speckle_geometry';
}
