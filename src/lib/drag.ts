import type { Level } from "./split";

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 5;

/** 動かしたとみなす最小の距離（px）。これ未満は「押しただけ」 */
export const DRAG_THRESHOLD = 6;

/** 1段ぶんの距離（px）。柱（スマホは棒）の長さを段の数で割る。短すぎると扱いにくいので下限を付ける */
export function stepSize(trackLength: number): number {
  return Math.max(24, trackLength / MAX_LEVEL);
}

/**
 * つかんだ位置からの動き（px）で、立場の段がどうなるか。
 * distance は「段が上がる向き」を正とする（PC は上、スマホは右）。
 * 1段ぶん動くごとに1段変わり、1〜5 で止まる。
 */
export function levelFromDrag(startLevel: Level, distance: number, stepPx: number): Level {
  if (!Number.isFinite(distance) || !Number.isFinite(stepPx) || stepPx <= 0) return startLevel;
  const steps = Math.trunc(distance / stepPx);
  const next = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, startLevel + steps));
  return next as Level;
}
