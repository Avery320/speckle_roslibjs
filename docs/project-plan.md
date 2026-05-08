# 開發計畫

本文件記錄目前階段的完成狀態與下一步工作。完整使用方式以 `README.md` 為主。

## 專案定位

`speckle_roslibjs` 是 Speckle 幾何到 ROS 標準 message plain object 的轉譯層。

```text
Speckle geometry
  -> speckle_roslibjs
  -> ROS message payload
  -> ROSLIB.Topic.publish(message)
```

本專案不管理 ROS 連線、不建立 Topic、不處理 UI、不渲染幾何。

## 本階段完成

| 狀態 | 項目 | 結果 |
| --- | --- | --- |
| [x] | MarkerArray payload | 可輸出 `visualization_msgs/MarkerArray` plain object |
| [x] | Mesh 視覺化 | mesh -> `TRIANGLE_LIST` |
| [x] | Polyline / Curve 視覺化 | line / polyline / curve -> `LINE_STRIP` |
| [x] | Point 視覺化 | point / point set -> `POINTS` |
| [x] | Marker 分類 | 預設 `ns`：`speckle_mesh`、`speckle_polyline`、`speckle_point` |
| [x] | PlanningScene 基礎 | mesh -> `moveit_msgs/PlanningScene` collision object |
| [x] | roslibjs 手動整合 | cube、circle、random points 可發布到各自預設 topic |
| [x] | PlanningScene 手動整合 | sphere mesh 可發布到 `/planning_scene` |

## 目前 API

```js
speckleToMarkerArrayMessage(input, options);
speckleToPlanningSceneMessage(input, options);
```

目前優先維護的 options：

```js
{
  frameId,
  namespace,
  id,
  color,
  lineWidth,
  pointSize,
  stamp,
  isDiff
}
```

## 下一步

| 狀態 | 項目 | 說明 |
| --- | --- | --- |
| [ ] | Marker delete payload helper | 建立 `DELETE` / `DELETEALL` message helper，不負責 publish |
| [ ] | 正式單元測試 | 不依賴 ROS，只驗證 message shape |
| [ ] | README 與 docs 持續同步 | README 記錄使用方式，docs 記錄開發規則與計畫 |

## 暫不開發

| 項目 | 原因 |
| --- | --- |
| `LINE_LIST` | line / polyline / curve 目前統一用 `LINE_STRIP` |
| `sensor_msgs/PointCloud2` | 非目前階段 |
| `tf2_msgs/TFMessage` | 非目前階段 |
| ROS Topic discovery | 屬於發布層 |
| ROS publisher / subscriber lifecycle | 屬於呼叫端 / examples |
| viewer adapter | 非目前階段 |
| npm 發布流程 | 目前先作為本地專案 |

## 驗收重點

- public API 只有 `speckleToMarkerArrayMessage()` 與 `speckleToPlanningSceneMessage()`。
- output 是 roslibjs-compatible plain object。
- examples 預設 topic：mesh 使用 `/speckle/mesh_markers`，line 使用 `/speckle/line_markers`，point 使用 `/speckle/point_markers`，PlanningScene 使用 `/planning_scene`。
- line / polyline / curve 全部走 `LINE_STRIP`。
- PlanningScene 只接收 mesh，並輸出 `moveit_msgs/PlanningScene` diff。
- `unknown` geometry 不自動發布。
- 核心程式不 import `roslib`。
- `examples/` 可以作為手動 ROS 整合測試，但不納入自動測試。
