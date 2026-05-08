# AGENTS.md

這個 repository 是 Speckle 幾何到 ROS 標準 message plain object 的轉譯工具 API。

## 目前範圍

核心流程：

```text
Speckle geometry -> ROS message payload -> ROSLIB.Topic.publish(message)
```

目前只準備開發：

- mesh -> `visualization_msgs/Marker` `TRIANGLE_LIST`
- line / polyline / curve -> `visualization_msgs/Marker` `LINE_STRIP`
- point -> `visualization_msgs/Marker` `POINTS`
- mesh -> `moveit_msgs/PlanningScene` collision object

## 開發規則

- 不 import `roslib`。
- 不建立 `ROSLIB.Ros`、`ROSLIB.Topic` 或 `ROSLIB.Message`。
- 不管理 ROS connection、publish / subscribe lifecycle、UI、viewer 或產品場景樹。
- 不建立自訂 ROS message。
- 不使用顯示名稱作為穩定 id。
- line / polyline / curve 目前全部使用 `LINE_STRIP`，不保留 `LINE_LIST` 分支。
- 新增功能前先確認它屬於目前開發範圍。

## 公開 API

```js
speckleToMarkerArrayMessage(input, options);
speckleToPlanningSceneMessage(input, options);
```

## 文件

- `README.md`：專案定位與目前範圍。
- `docs/project-plan.md`：目前準備開發的內容。
- `docs/development-standards.md`：開發規則。
