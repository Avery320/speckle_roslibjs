# 開發標準

本文件只放目前開發時必須遵守的規則。

## API 邊界

- 核心 API 只輸出 ROS message plain object。
- 輸出必須可直接交給 `ROSLIB.Topic.publish(message)`。
- 核心模組不可 import `roslib`。
- 核心模組不可建立 `ROSLIB.Ros`、`ROSLIB.Topic`、`ROSLIB.Message`。
- 不輸出 rosbridge envelope，例如 `{ op, topic, msg }`。

## 公開 API

目前只公開：

```js
speckleToMarkerArrayMessage(input, options);
speckleToPlanningSceneMessage(input, options);
```

內部 helper 不隨意 export。

## 目前 message 對應

| Speckle 幾何 | ROS message | 實作 |
| --- | --- | --- |
| mesh | `visualization_msgs/Marker` `TRIANGLE_LIST` | `triangleList.js` |
| line / polyline / curve | `visualization_msgs/Marker` `LINE_STRIP` | `lineStrip.js` |
| point | `visualization_msgs/Marker` `POINTS` | `points.js` |
| mesh | `moveit_msgs/PlanningScene` | `planningScene.js` |

目前不保留 `LINE_LIST` 分支。

## 檔案責任

- `src/speckle/`：讀取並正規化 Speckle 幾何。
- `src/ros/markerArray.js`：組裝 `MarkerArray`，不放具體幾何演算法。
- `src/ros/marker/`：依 Marker type 放轉譯演算法。
- `src/ros/planningScene.js`：建立 PlanningScene collision object。
- `src/identity/`：建立 ROS identity。
- `src/utils/`：放無產品依賴的低階工具。

## Identity 與座標

- 不使用顯示名稱作為穩定 id。
- 優先使用 `options.id`，再使用 Speckle 來源 id，最後才使用 fallback id。
- Marker identity 使用 `ns + id`。
- 預設 Marker namespace：mesh 使用 `speckle_mesh`，line / polyline / curve 使用 `speckle_polyline`，point 使用 `speckle_point`。
- CollisionObject identity 使用 `collision_object.id`。
- 預設輸入已經在目標 ROS frame 中。
- 座標轉換若未來需要，必須集中處理，不可散落在各 builder。

## options

目前優先維護：

```js
{
  frameId,
  namespace,
  id,
  color,
  lineWidth,
  pointSize,
  stamp
}
```

新增 options 前要先確認是否真的被目前 message builder 使用。

## 驗證

目前尚未建立正式 test 目錄。提交前至少做：

```bash
find src examples -name '*.js' -print0 | xargs -0 -n1 node --check
```

並用最小 smoke script 確認：

- mesh 產生 `TRIANGLE_LIST`
- line / polyline / curve 產生 `LINE_STRIP`
- point 產生 `POINTS`
- mesh 可產生 PlanningScene collision object
- `examples/marker-array-message.js` 可以執行並輸出 MarkerArray JSON

手動 ROS 整合確認：

```bash
npm run example:publish-cube
npm run example:publish-circle
npm run example:publish-points
```

這個指令需要外部 rosbridge，不納入自動測試。
