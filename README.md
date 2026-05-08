# speckle_ros

Speckle 幾何到 ROS 標準 message 的轉譯工具 API。

本專案目前只作為本地開發與測試使用，先不準備發布 npm package。

## 目標

`speckle_ros` 只負責一件事：

```text
Speckle geometry -> ROS standard message plain object
```

呼叫端再使用 `roslibjs` 或其他 transport 發布到 ROS Topic。

## 目前準備開發的內容

第一目標是 `visualization_msgs/MarkerArray`：

| Speckle 幾何 | Marker type | 用途 |
| --- | --- | --- |
| mesh | `TRIANGLE_LIST` | mesh 視覺化 |
| line / polyline / curve | `LINE_STRIP` | 線性幾何視覺化 |
| point | `POINTS` | 少量點、控制點、標記點 |

第二目標是 `moveit_msgs/PlanningScene`：

| Speckle 幾何 | ROS message | 用途 |
| --- | --- | --- |
| mesh | `CollisionObject` + `shape_msgs/Mesh` | MoveIt collision world |

## 公開 API

```js
speckleToMarkerArrayMessage(input, options);
speckleToPlanningSceneMessage(input, options);
```

API 輸出是 ROS message plain object，不建立 `ROSLIB.Topic`，也不包裝 `ROSLIB.Message`。

## roslibjs 相容性

輸出必須可以直接交給 `ROSLIB.Topic.publish()`：

```js
const topic = new ROSLIB.Topic({
  ros,
  name: '/speckle/markers',
  messageType: 'visualization_msgs/MarkerArray'
});

const message = speckleToMarkerArrayMessage(speckleGeometry, {
  frameId: 'world',
  namespace: 'speckle_geometry'
});

topic.publish(message);
```

Topic 名稱、`messageType`、advertise、queue、reconnect 與 publish 時機都由呼叫端管理。

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
```

## 暫不處理

- ROS connection lifecycle
- ROS publish / subscribe lifecycle
- `roslibjs` adapter
- viewer / rendering
- 產品 UI 或場景樹
- 自訂 ROS message
- `sensor_msgs/PointCloud2`
- `tf2_msgs/TFMessage`

## 開發文件

- [docs/project-plan.md](docs/project-plan.md)
- [docs/development-standards.md](docs/development-standards.md)
