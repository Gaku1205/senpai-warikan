// 立場ごとの人数：数え方・増減・仮の名前。人数の欄と一覧の編集は、同じメンバーの並びを見る。
import { LEVEL_NAMES, type Level, type Member } from "./split";

export const MAX_MEMBERS = 20;
export const MIN_MEMBERS = 1;

/** 坂の上（上司）から順の立場 */
export const LEVELS: Level[] = [5, 4, 3, 2, 1];

/** 立場ごとの人数（主役も数える） */
export function countByLevel(members: Member[]): Record<Level, number> {
  const counts: Record<Level, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const m of members) counts[m.level] += 1;
  return counts;
}

/** 名前が空の人の仮の名前（立場と、同じ立場の中での番号。例：先輩2） */
export function placeholderName(member: Member, members: Member[]): string {
  const index = members.filter((m) => m.level === member.level).findIndex((m) => m.id === member.id);
  return `${LEVEL_NAMES[member.level]}${index + 1}`;
}

/** 画面や文面で見せる名前。空なら仮の名前 */
export function displayName(member: Member, members: Member[]): string {
  return member.name.trim() || placeholderName(member, members);
}

/** その立場で、次に消す人の位置。名前が空の人 → 名前の入った人 → 主役の順に、それぞれ後ろから */
function indexToRemove(members: Member[], level: Level): number {
  const rank = (m: Member) => (m.guest ? 2 : 0) + (m.name.trim() === "" ? 0 : 1);
  let best = -1;
  members.forEach((m, i) => {
    if (m.level !== level) return;
    if (best === -1 || rank(m) <= rank(members[best])) best = i;
  });
  return best;
}

/** `new-N` の次の N */
function nextIdNumber(members: Member[]): number {
  let max = 0;
  for (const m of members) {
    const hit = /^new-(\d+)$/.exec(m.id);
    if (hit) max = Math.max(max, Number(hit[1]));
  }
  return max + 1;
}

/** 新しい人の id（`new-N`）。いまのメンバーと重ならない */
export function newMemberId(members: Member[]): string {
  return `new-${nextIdNumber(members)}`;
}

/**
 * ある立場の人数を count にする。全体が MIN_MEMBERS〜MAX_MEMBERS に収まる範囲で動く。
 * 増やすと名前が空の人を末尾に足し、減らすと名前が空の人から後ろから消す（主役は最後）。
 */
export function setHeadcount(members: Member[], level: Level, count: number): Member[] {
  const current = members.filter((m) => m.level === level).length;
  const others = members.length - current;
  const target = Math.max(0, Math.min(Math.floor(count), MAX_MEMBERS - others));
  let next = members;
  let n = current;
  // 全体が 1人を下回らないようにする
  const floor = Math.max(0, MIN_MEMBERS - others);
  const goal = Math.max(target, floor);

  while (n < goal) {
    next = [...next, { id: newMemberId(next), name: "", level, guest: false, paid: false }];
    n += 1;
  }
  while (n > goal) {
    const i = indexToRemove(next, level);
    next = next.filter((_, j) => j !== i);
    n -= 1;
  }
  return next;
}

/** 例の会から自分の会へ：名前を全部空にする */
export function clearNames(members: Member[]): Member[] {
  return members.map((m) => (m.name === "" ? m : { ...m, name: "" }));
}

/** この立場の ＋ − が押せるか */
export function canAdjust(members: Member[], level: Level): { canMinus: boolean; canPlus: boolean } {
  const n = members.filter((m) => m.level === level).length;
  return { canMinus: n > 0 && members.length > MIN_MEMBERS, canPlus: members.length < MAX_MEMBERS };
}
