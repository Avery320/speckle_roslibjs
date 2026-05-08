/**
 * ROS 訊息型別、enum 與 schema 常數，供各訊息建構器共用。
 */
export const ROS_MESSAGE_TYPES = Object.freeze({
  MARKER_ARRAY: 'visualization_msgs/MarkerArray',
  PLANNING_SCENE: 'moveit_msgs/PlanningScene'
});

export const MARKER_TYPES = Object.freeze({
  LINE_STRIP: 4,
  POINTS: 8,
  TRIANGLE_LIST: 11
});

export const MARKER_ACTIONS = Object.freeze({
  ADD: 0
});

export const COLLISION_OBJECT_OPERATIONS = Object.freeze({
  ADD: 0
});
