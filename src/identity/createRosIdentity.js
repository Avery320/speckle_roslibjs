/**
 * ROS 識別值工具，從設定與 Speckle 來源欄位解析穩定識別值。
 */
export function createRosIdentity(input = {}, options = {}) {
  // 呼叫端提供的 id 優先度最高，其次使用常見 Speckle 來源 id。
  const id = options.id
    ?? input.id
    ?? input.guid
    ?? input.renderData?.id
    ?? input.sourceId
    ?? options.fallbackId;

  if (id === undefined || id === null || id === '') {
    throw new Error('createRosIdentity 需要穩定 id，請提供 options.id、Speckle id 或 fallbackId。');
  }

  return String(id);
}

/**
 * 將字串識別值轉換為 ROS Marker 使用的整數 id。
 *
 * ROS Marker 在每個 namespace 內需要 int32 id。rolling hash 可以保留
 * 跨執行階段的可重現 id，同時允許來源 id 維持字串格式。
 */
export function createRosMarkerId(identity) {
  const text = String(identity || '');
  let hash = 0;

  // 使用 DJB2 風格 rolling hash，將任意字串識別值映射成穩定的 ROS Marker int32 id。
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }

  return Math.abs(hash) % 2147483647;
}

/**
 * 清理類 ROS namespace 的名稱片段，同時保留 ROS name 可使用的斜線分隔符。
 */
export function sanitizeRosNameSegment(value, fallback = 'speckle_geometry') {
  const text = String(value || '').trim().replace(/[^a-zA-Z0-9_/]/g, '_');
  return text || fallback;
}
