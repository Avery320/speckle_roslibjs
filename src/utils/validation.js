/**
 * 共用輸入正規化工具，供轉接層與訊息建構器使用。
 */

export function toArray(input) {
  // 將 null / undefined 視為空集合，讓轉換流程可以安全使用 flatMap。
  if (input === undefined || input === null) {
    return [];
  }

  return Array.isArray(input) ? input : [input];
}

/**
 * 檢查 Speckle 幾何載荷常用的非陣列物件。
 */
export function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * 將類數值輸入轉成有限數字，無效時使用備用值。
 */
export function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
