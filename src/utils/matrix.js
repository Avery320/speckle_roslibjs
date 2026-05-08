/**
 * ROS pose 與 transform 預設物件工廠，提供訊息建構器共用的單位變換。
 */

export function createIdentityPose() {
  return {
    position: { x: 0, y: 0, z: 0 },
    orientation: { x: 0, y: 0, z: 0, w: 1 }
  };
}

export function createIdentityTransform() {
  return {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 }
  };
}
