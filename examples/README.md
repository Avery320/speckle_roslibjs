# examples

本資料夾放 `speckle_roslibjs` 的使用範例與手動 ROS 整合測試。

核心 API 位於 `src/`，不會 import `roslib`。本資料夾中的 publish 範例可以 import `roslib`，用來驗證產生出的 ROS message payload 能透過 rosbridge 發到 ROS。

## 前置需求

安裝相依：

```bash
npm install
```

若要執行發布範例，需要先啟動 rosbridge websocket。預設範例會連：

```text
ws://localhost:9090
```

## 範例檔案

| 檔案 | 內容 | 是否連 ROS |
| --- | --- | --- |
| `marker-array-message.js` | 建立一組 mesh、curve、point，輸出 MarkerArray JSON | 否 |
| `publish-cube-marker-roslib.js` | 發布中心在 `(1, 1, 1)` 的 cube mesh | 是 |
| `publish-circle-polyline-roslib.js` | 發布一條圓形 polyline / curve | 是 |
| `publish-random-points-roslib.js` | 在方形範圍內發布 20 個隨機點 | 是 |
| `helpers/publishMarkerArray.js` | examples 專用 roslib 發布 helper | 是 |

## 建立 Message，不發布

```bash
npm run example:marker-array
```

這個指令只會把 Speckle-like geometry 轉成 `visualization_msgs/MarkerArray` JSON，適合用來檢查 message shape。

預期會產生三個 Marker：

| 幾何 | Marker `ns` | Marker `type` |
| --- | --- | --- |
| mesh | `speckle_mesh` | `TRIANGLE_LIST` |
| curve | `speckle_polyline` | `LINE_STRIP` |
| point | `speckle_point` | `POINTS` |

## 發布 Cube Mesh

```bash
npm run example:publish-cube
```

內容：

- 建立中心在 `(1, 1, 1)` 的 cube mesh。
- 使用 Speckle mesh 的 `vertices` / `faces` 結構。
- 轉成 `TRIANGLE_LIST` Marker。
- 發布到 `/speckle/mesh_markers`。

可調參數：

- `CUBE_SIZE`：cube 邊長，預設 `1`。

## 發布 Circle Polyline

```bash
npm run example:publish-circle
```

內容：

- 建立位於 `z = 1` 的圓形 curve sample points。
- 最後一點會回到第一點，讓 `LINE_STRIP` 閉合。
- 發布到 `/speckle/line_markers`。

可調參數：

- `CIRCLE_RADIUS`：圓半徑，預設 `1`。
- `CIRCLE_SEGMENTS`：圓形 sample 數，預設 `64`。
- `LINE_WIDTH`：RViz 線寬，預設 `0.03`。

## 發布 Random Points

```bash
npm run example:publish-points
```

內容：

- 在以原點為中心的方形範圍內建立隨機點。
- 預設建立 20 個點。
- 轉成 `POINTS` Marker。
- 發布到 `/speckle/point_markers`。

可調參數：

- `POINT_COUNT`：隨機點數量，預設 `20`。
- `POINT_RANGE`：方形範圍邊長，預設 `2`。
- `POINT_SIZE`：RViz 點尺寸，預設 `0.08`。

## ROS 連線設定

三個 publish 範例共用以下環境變數：

- `ROSBRIDGE_URL`：rosbridge websocket，預設 `ws://localhost:9090`。
- `ROS_TOPIC`：覆蓋發布用 Topic。未設定時，cube 使用 `/speckle/mesh_markers`，circle 使用 `/speckle/line_markers`，points 使用 `/speckle/point_markers`。
- `ROS_FRAME_ID`：Marker header frame，預設 `world`。

範例：

```bash
ROS_TOPIC=/custom/speckle/markers npm run example:publish-cube
```

## RViz 驗證

RViz 建議設定：

```text
Fixed Frame: world
Display Type: MarkerArray
Topic:
  cube   -> /speckle/mesh_markers
  circle -> /speckle/line_markers
  points -> /speckle/point_markers
```

如果有改 `ROS_FRAME_ID` 或 `ROS_TOPIC`，RViz 也要同步改。

## 語法檢查

```bash
find src examples -name '*.js' -print0 | xargs -0 -n1 node --check
```

## 邊界

- `examples/` 可以建立 ROS connection 與 publish message。
- `src/` 核心 API 不建立 ROS connection，也不管理 publish lifecycle。
- 這些範例是手動整合測試，不是正式 unit test。
