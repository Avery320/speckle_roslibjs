/**
 * ROS Header.stamp 時間工具，產生 secs / nsecs 格式的時間物件。
 */

export function createRosTime(date = null) {
  if (!date) {
    return { secs: 0, nsecs: 0 };
  }

  // 接受呼叫端已經正規化的 ROS time 物件。
  if (Number.isFinite(Number(date.secs)) || Number.isFinite(Number(date.sec))) {
    return {
      secs: Math.floor(Number(date.secs ?? date.sec)),
      nsecs: Math.floor(Number(date.nsecs ?? date.nanosec ?? 0))
    };
  }

  const milliseconds = date.getTime();
  const secs = Math.floor(milliseconds / 1000);
  // ROS nsecs 以奈秒保存秒以下的剩餘時間。
  const nsecs = Math.floor((milliseconds - secs * 1000) * 1000000);

  return { secs, nsecs };
}
