// 入れた会の中身を、この端末のブラウザ（localStorage）に残す・読む。サーバーには送らない。
import { SLOPES, type Level, type Member, type RemainderHolder, type RoundUnit, type Slope } from "./split";

export const STORAGE_KEY = "senpai-warikan:v1";

export const MAX_STORED_MEMBERS = 20;

export type SavedWarikan = {
  eventName: string;
  total: number;
  members: Member[];
  slope: Slope;
  unit: RoundUnit;
  organizerId: string;
  remainderTo: RemainderHolder;
  deadline: string;
  selectedId: string;
};

const UNITS: number[] = [100, 500, 1000];
const MAX_TOTAL = 99_999_999;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseMember(v: unknown): Member | null {
  if (!isRecord(v)) return null;
  const { id, name, level, guest } = v;
  if (typeof id !== "string" || id === "") return null;
  if (typeof name !== "string") return null;
  if (typeof level !== "number" || !Number.isInteger(level) || level < 1 || level > 5) return null;
  if (typeof guest !== "boolean") return null;
  return { id, name, level: level as Level, guest, paid: false };
}

/** 保存用の値を検べて返す。形が違う・範囲外なら null（例外は投げない） */
export function parseSaved(value: unknown): SavedWarikan | null {
  if (!isRecord(value)) return null;
  const { eventName, total, members, slope, unit, organizerId, remainderTo, deadline, selectedId } = value;

  if (typeof eventName !== "string" || typeof deadline !== "string") return null;
  if (typeof total !== "number" || !Number.isInteger(total) || total < 0 || total > MAX_TOTAL) return null;
  if (typeof slope !== "string" || !(SLOPES as string[]).includes(slope)) return null;
  if (typeof unit !== "number" || !UNITS.includes(unit)) return null;
  if (remainderTo !== "organizer" && remainderTo !== "top") return null;
  if (typeof organizerId !== "string" || typeof selectedId !== "string") return null;
  if (!Array.isArray(members) || members.length < 1 || members.length > MAX_STORED_MEMBERS) return null;

  const parsed: Member[] = [];
  for (const m of members) {
    const pm = parseMember(m);
    if (!pm) return null;
    parsed.push(pm);
  }
  const ids = new Set(parsed.map((m) => m.id));
  if (ids.size !== parsed.length) return null;
  if (!ids.has(organizerId) || !ids.has(selectedId)) return null;

  return {
    eventName,
    total,
    members: parsed,
    slope: slope as Slope,
    unit: unit as RoundUnit,
    organizerId,
    remainderTo,
    deadline,
    selectedId,
  };
}

/** 端末に残す。使えない・いっぱいのときは何もしない */
export function saveWarikan(data: SavedWarikan): void {
  try {
    // 集金済み（paid）は残さない
    const members = data.members.map(({ id, name, level, guest }) => ({ id, name, level, guest }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, members }));
  } catch {
    // localStorage が使えない（プライベートモードなど）。残せないだけで、画面は動かす
  }
}

/** 残した中身を読む。無い・壊れている・範囲外なら null */
export function loadWarikan(): SavedWarikan | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    return parseSaved(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** 読み込んだメンバーの id（new-N）と重ならない、次の N */
export function nextNewId(members: Member[]): number {
  let max = 0;
  for (const m of members) {
    const hit = /^new-(\d+)$/.exec(m.id);
    if (hit) max = Math.max(max, Number(hit[1]));
  }
  return max + 1;
}

/** メンバーの中身（順番も）が同じか */
export function sameMembers(a: Member[], b: Member[]): boolean {
  return (
    a.length === b.length &&
    a.every((m, i) => m.id === b[i].id && m.name === b[i].name && m.level === b[i].level && m.guest === b[i].guest)
  );
}
