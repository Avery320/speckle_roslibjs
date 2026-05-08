/**
 * 色彩正規化工具，將 Speckle 常見色彩格式轉成 ROS RGBA 物件。
 */

export const DEFAULT_COLOR = Object.freeze({
  r: 0.2,
  g: 0.6,
  b: 1,
  a: 1
});

/**
 * 將單一數值、陣列或物件色彩正規化成 0..1 RGBA。
 */
export function normalizeColor(color = DEFAULT_COLOR) {
  // 數值色彩會被視為許多 Speckle 顯示載荷使用的打包 RGB。
  if (typeof color === 'number') {
    return normalizeColorNumber(color);
  }

  // 陣列色彩可為 [r, g, b] 或 [r, g, b, a]。
  if (Array.isArray(color)) {
    return {
      r: normalizeChannel(color[0], DEFAULT_COLOR.r),
      g: normalizeChannel(color[1], DEFAULT_COLOR.g),
      b: normalizeChannel(color[2], DEFAULT_COLOR.b),
      a: normalizeChannel(color[3], DEFAULT_COLOR.a)
    };
  }

  return {
    r: normalizeChannel(color?.r, DEFAULT_COLOR.r),
    g: normalizeChannel(color?.g, DEFAULT_COLOR.g),
    b: normalizeChannel(color?.b, DEFAULT_COLOR.b),
    a: normalizeChannel(color?.a, DEFAULT_COLOR.a)
  };
}

/**
 * 正規化逐頂點顏色列表。
 *
 * 演算法接受打包數值色彩或扁平 channel 陣列。扁平陣列會依照
 * 是否可被 4 整除，拆成 RGB 或 RGBA 群組。
 */
export function normalizeColorList(colors = []) {
  if (!Array.isArray(colors) && !ArrayBuffer.isView(colors)) {
    return [];
  }

  const values = Array.from(colors);
  if (!values.length) return [];

  if (typeof values[0] === 'number' && values.every((value) => Number.isInteger(value) && value > 1)) {
    return values.map(normalizeColorNumber);
  }

  if (typeof values[0] === 'number') {
    // channel 數量可支援 RGBA 時優先使用 RGBA 分組，否則使用 RGB 分組。
    const itemSize = values.length % 4 === 0 ? 4 : 3;
    const result = [];
    for (let index = 0; index + 2 < values.length; index += itemSize) {
      result.push(normalizeColor(values.slice(index, index + itemSize)));
    }
    return result;
  }

  return values.map(normalizeColor);
}

/**
 * 將打包的 0xRRGGBB 數值轉成 ROS 風格的 0..1 RGB channel。
 */
function normalizeColorNumber(color) {
  const value = Math.max(0, Number(color) || 0);
  return {
    // 數值 Speckle color 以 0xRRGGBB value 處理。
    r: ((value >> 16) & 255) / 255,
    g: ((value >> 8) & 255) / 255,
    b: (value & 255) / 255,
    a: 1
  };
}

/**
 * 將 0..1 或 0..255 channel value 轉成裁切後的 0..1 channel。
 */
function normalizeChannel(value, fallback) {
  if (!Number.isFinite(Number(value))) {
    return fallback;
  }

  const number = Number(value);
  return clamp01(number > 1 ? number / 255 : number);
}

/**
 * 將數值 channel 限制在 0..1 範圍。
 */
function clamp01(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}
