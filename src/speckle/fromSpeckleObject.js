/**
 * Speckle 物件轉接層，從 Speckle 物件取出 displayValue 並轉為內部幾何記錄。
 */
import { fromDisplayValue } from './fromDisplayValue.js';
import { toArray, isPlainObject } from '../utils/validation.js';

/**
 * 從 Speckle 物件取出 displayValue 幾何，並回傳正規化幾何記錄。
 *
 * @param {object|object[]} speckleObject Speckle 物件、displayValue 幾何或輸入陣列。
 * @param {object} options 轉交給 displayValue 正規化流程的轉換設定。
 * @returns {object[]} ROS 訊息建構器使用的正規化幾何記錄。
 */

export function fromSpeckleObject(speckleObject, options = {}) {
  // 物件陣列與單一物件會走同一條轉接流程。
  return toArray(speckleObject)
    .flatMap((item, index) => normalizeSpeckleObject(item, {
      ...options,
      fallbackId: options.fallbackId || `speckle_object_${index}`
    }))
    .filter(Boolean);
}

/**
 * 從 Speckle 物件取出 displayValue，並保留父層中繼資料。
 */
function normalizeSpeckleObject(item, options) {
  if (!isPlainObject(item)) {
    return fromDisplayValue(item, options);
  }

  // Speckle 序列化資料可能以 displayValue 或 dynamic-member @ 前綴暴露 displayValue。
  const displayValue = item.displayValue ?? item['@displayValue'];
  if (displayValue) {
    // 單一 displayValue 可繼承父物件 id；多個 displayValue 使用帶索引的備用 id。
    const displayItems = toArray(displayValue);
    const baseId = options.id ?? item.id ?? item.applicationId ?? options.fallbackId;

    return fromDisplayValue(displayValue, {
      ...options,
      id: displayItems.length === 1 ? baseId : undefined,
      fallbackId: baseId,
      units: options.units ?? item.units
    });
  }

  return fromDisplayValue(item, options);
}
