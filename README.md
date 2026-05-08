# speckle_roslibjs

Speckle 幾何到 ROS 標準 message 的轉譯工具 API。

本專案目前作為本地開發與測試使用，暫時不發布 npm package。

## 專案邊界

`speckle_roslibjs` 只負責建立 ROS message payload：

```text
Speckle geometry -> ROS standard message plain object
```

ROS connection、Topic 建立、publish / subscribe lifecycle、RViz 顯示設定都由呼叫端或範例檔處理。

## 目前狀態

| 狀態 | 項目 | 內容 | 主要檔案 |
| --- | --- | --- | --- |
| [x] | Public API | 匯出 `speckleToMarkerArrayMessage()`、`speckleToPlanningSceneMessage()` | `src/index.js` |
| [x] | Speckle adapter | 讀取 Speckle object / displayValue，正規化 mesh、line、point | `src/speckle/` |
| [x] | Mesh 視覺化 | mesh -> `visualization_msgs/Marker` `TRIANGLE_LIST` | `src/ros/marker/triangleList.js` |
| [x] | Polyline / Curve 視覺化 | line / polyline / curve -> `LINE_STRIP` | `src/ros/marker/lineStrip.js` |
| [x] | Point 視覺化 | point / point set -> `POINTS` | `src/ros/marker/points.js` |
| [x] | MarkerArray 組裝 | 輸出 `{ markers: [] }`，可交給 `ROSLIB.Topic.publish()` | `src/ros/markerArray.js` |
| [x] | Marker 分類 | 預設 `ns`：`speckle_mesh`、`speckle_polyline`、`speckle_point` | `src/ros/marker/createBaseMarker.js` |
| [x] | PlanningScene 基礎 | mesh -> `moveit_msgs/PlanningScene` collision object | `src/ros/planningScene.js` |
| [x] | roslibjs 手動範例 | cube、circle、random points、sphere PlanningScene 發布到 rosbridge | `examples/` |
| [x] | PlanningScene 手動範例 | 發布 mesh sphere collision object 到 ROS / MoveIt | `examples/publish-sphere-planning-scene-roslib.js` |
| [ ] | Marker 刪除 helper | 建立 `DELETE` / `DELETEALL` payload helper，不負責 publish | 待討論 |
| [ ] | 正式單元測試 | 不依賴 ROS，只驗證 message shape | 待開發 |

## ROS Topic 與 Message

目前手動發布範例依幾何類型使用不同 Topic。

Message type：

```text
visualization_msgs/MarkerArray
```

Topic 是發布策略，核心 API 不處理 topic。範例預設如下：

| Speckle 幾何 | 預設 Topic | Marker `ns` | Marker `type` |
| --- | --- | --- | --- |
| mesh | `/speckle/mesh_markers` | `speckle_mesh` | `TRIANGLE_LIST` |
| line / polyline / curve | `/speckle/line_markers` | `speckle_polyline` | `LINE_STRIP` |
| point | `/speckle/point_markers` | `speckle_point` | `POINTS` |

PlanningScene 範例：

| Speckle 幾何 | 預設 Topic | Message type | 用途 |
| --- | --- | --- | --- |
| mesh | `/planning_scene` | `moveit_msgs/PlanningScene` | collision object |

## roslibjs 相容性

API 輸出是 plain JavaScript object，可以直接交給 `ROSLIB.Topic.publish()`：

```js
const topic = new ROSLIB.Topic({
  ros,
  name: '/speckle/mesh_markers',
  messageType: 'visualization_msgs/MarkerArray'
});

const message = speckleToMarkerArrayMessage(speckleGeometry, {
  frameId: 'world'
});

topic.publish(message);
```

PlanningScene 使用相同模式，只是 message type 與 topic 不同：

```js
const topic = new ROSLIB.Topic({
  ros,
  name: '/planning_scene',
  messageType: 'moveit_msgs/PlanningScene'
});

const message = speckleToPlanningSceneMessage(speckleMesh, {
  frameId: 'world',
  isDiff: true
});

topic.publish(message);
```

核心 API 不建立 `ROSLIB.Ros`、`ROSLIB.Topic` 或 `ROSLIB.Message`。

## 目前架構

```text
src/
  index.js

  speckle/
    fromSpeckleObject.js
    fromDisplayValue.js
    geometryTypes.js

  ros/
    markerArray.js
    planningScene.js
    constants.js
    marker/
      createBaseMarker.js
      triangleList.js
      lineStrip.js
      points.js

  identity/
    createRosIdentity.js

  utils/
    color.js
    matrix.js
    rosTime.js
    validation.js

examples/
  helpers/
    publishMarkerArray.js
  README.md
  marker-array-message.js
  publish-circle-polyline-roslib.js
  publish-cube-marker-roslib.js
  publish-random-points-roslib.js
  publish-sphere-planning-scene-roslib.js
```

## 範例

範例與手動 ROS 整合測試請見 [examples/README.md](examples/README.md)。

## 開發文件

- [docs/project-plan.md](docs/project-plan.md)
- [docs/development-standards.md](docs/development-standards.md)
