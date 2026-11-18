// 傾斜つき割り勘の計算。入力（顔ぶれ・合計・丸め・坂の急さ）から、1人ずつの金額が決まる。

/** 立場の段。5 がいちばん上（上司）、1 がいちばん下（新人） */
export type Level = 1 | 2 | 3 | 4 | 5;

export const LEVEL_NAMES: Record<Level, string> = {
  5: "上司",
  4: "先輩",
  3: "同期",
  2: "後輩",
  1: "新人",
};

export type Slope = "flat" | "gentle" | "normal" | "steep";

/** 1段上がるごとに、払う額が何倍になるか */
export const SLOPE_RATIO: Record<Slope, number> = {
  flat: 1,
  gentle: 1.15,
  normal: 1.3,
  steep: 1.5,
};

export const SLOPE_NAMES: Record<Slope, string> = {
  flat: "均等",
  gentle: "ゆるい坂",
  normal: "ふつうの坂",
  steep: "急な坂",
};

export const SLOPES: Slope[] = ["flat", "gentle", "normal", "steep"];

export type RoundUnit = 100 | 500 | 1000;

export type Member = {
  id: string;
  name: string;
  level: Level;
  /** 主役（送られる人・迎えられる人）。0円 */
  guest: boolean;
  /** 集金済み（端末には残さない） */
  paid: boolean;
};

/** 端数を誰が持つか */
export type RemainderHolder = "organizer" | "top";

export type SplitInput = {
  total: number;
  members: Member[];
  slope: Slope;
  unit: RoundUnit;
  organizerId: string;
  remainderTo: RemainderHolder;
};

export type SplitRow = {
  member: Member;
  /** 丸める前の額 */
  raw: number;
  /** 払う額（端数の調整を含む） */
  amount: number;
  /** 均等に割った額との差（プラスは多めに払う） */
  diffFromEven: number;
};

export type SplitResult = {
  /** 坂の上から順（段の高い順、同じ段は入力の順） */
  rows: SplitRow[];
  payers: number;
  /** 払う人で均等に割ったときの1人の額（丸めない） */
  even: number;
  /** 端数を持つ人の id（端数が0なら null） */
  remainderHolderId: string | null;
  /** 丸めで出た端数。プラスなら持つ人が多めに払い、マイナスなら少なく払う */
  remainder: number;
  /** 集まる額の合計（必ず total と同じ） */
  collected: number;
};

export function weightOf(level: Level, slope: Slope): number {
  return Math.pow(SLOPE_RATIO[slope], level - 3);
}

/** 段の高い順。同じ段は入力の順のまま */
export function sortBySlope(members: Member[]): Member[] {
  return members
    .map((m, i) => ({ m, i }))
    .sort((a, b) => b.m.level - a.m.level || a.i - b.i)
    .map(({ m }) => m);
}

export function computeSplit(input: SplitInput): SplitResult {
  const total = Math.max(0, Math.floor(input.total));
  const ordered = sortBySlope(input.members);
  const payers = ordered.filter((m) => !m.guest);
  const weightSum = payers.reduce((s, m) => s + weightOf(m.level, input.slope), 0);
  const even = payers.length > 0 ? total / payers.length : 0;

  const rows: SplitRow[] = ordered.map((member) => {
    if (member.guest || weightSum === 0) {
      return { member, raw: 0, amount: 0, diffFromEven: member.guest ? 0 : 0 };
    }
    const raw = (total * weightOf(member.level, input.slope)) / weightSum;
    const amount = Math.round(raw / input.unit) * input.unit;
    return { member, raw, amount, diffFromEven: 0 };
  });

  const rounded = rows.reduce((s, r) => s + r.amount, 0);
  const remainder = payers.length > 0 ? total - rounded : 0;

  let remainderHolderId: string | null = null;
  if (remainder !== 0) {
    const organizer = payers.find((m) => m.id === input.organizerId);
    const holder = input.remainderTo === "organizer" && organizer ? organizer : payers[0];
    remainderHolderId = holder.id;
    const row = rows.find((r) => r.member.id === holder.id);
    if (row) row.amount += remainder;
  }

  for (const r of rows) {
    r.diffFromEven = r.member.guest ? 0 : r.amount - even;
  }

  return {
    rows,
    payers: payers.length,
    even,
    remainderHolderId,
    remainder,
    collected: rows.reduce((s, r) => s + r.amount, 0),
  };
}

export function yen(n: number): string {
  return Math.round(n).toLocaleString("ja-JP");
}
