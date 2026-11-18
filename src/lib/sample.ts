// 最初に開いたときに入っている会（本物らしい例。使う人がすぐ書き換える）
import type { Member } from "./split";

export const INITIAL_MEMBERS: Member[] = [
  { id: "m1", name: "佐藤", level: 5, guest: false },
  { id: "m2", name: "高橋", level: 4, guest: false },
  { id: "m3", name: "鈴木", level: 4, guest: false },
  { id: "m4", name: "伊藤", level: 3, guest: false },
  { id: "m5", name: "渡辺", level: 3, guest: false },
  { id: "m6", name: "山本", level: 3, guest: true },
  { id: "m7", name: "中村", level: 2, guest: false },
  { id: "m8", name: "小林", level: 1, guest: false },
];

export const INITIAL_EVENT = {
  eventName: "営業2課 山本さん送別会",
  total: 46800,
  organizerId: "m5",
  deadline: "11月28日（金）",
};
