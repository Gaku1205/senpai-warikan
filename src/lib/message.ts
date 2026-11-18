// LINE に貼る文面を作る。
import { displayName } from "./headcount";
import { LEVEL_NAMES, type Level, type SplitResult, yen } from "./split";

export type MessageInput = {
  eventName: string;
  total: number;
  deadline: string;
  organizerName: string;
  /** 丸めの単位（円）。端数の行で「100円単位にそろえた」と書くのに使う */
  unit?: number;
};

const ADJUST_MARK = "（端数調整）";

/** 誰への文面か。all は全員、unpaid は集金がまだの人だけ（主役と集金済みを除く） */
export type MessageTarget = "all" | "unpaid";

export const ALL_PAID_MESSAGE = "全員の集金が済みました。";

export function buildLineMessage(
  input: MessageInput,
  result: SplitResult,
  target: MessageTarget = "all",
): string {
  const title = input.eventName.trim() || "飲み会";
  const unpaid = target === "unpaid";
  const rows = unpaid ? result.rows.filter((r) => !r.member.guest && !r.member.paid) : result.rows;
  if (unpaid && rows.length === 0) return ALL_PAID_MESSAGE;

  const lines: string[] = [];
  if (unpaid) {
    const sum = rows.reduce((s, r) => s + r.amount, 0);
    lines.push(`【${title}】集金のお願い`);
    lines.push(`まだの方 ${rows.length}人・合計 ${yen(sum)}円`);
  } else {
    lines.push(`【${title}】お会計のお知らせ`);
    lines.push(`合計 ${yen(input.total)}円（${result.rows.length}人）`);
  }
  lines.push("");
  // 名前の入った人は1人1行。名前が空の人（主役以外）は、同じ立場・同じ金額でまとめて1行
  const everyone = result.rows.map((r) => r.member);
  const groups = new Map<string, { level: Level; count: number; amount: number; at: number; adjust: boolean }>();
  const entries: string[] = [];
  for (const r of rows) {
    const m = r.member;
    if (m.guest || m.name.trim() !== "") {
      const name = displayName(m, everyone);
      const adjust = !m.guest && result.remainder !== 0 && m.id === result.remainderHolderId ? ADJUST_MARK : "";
      entries.push(m.guest ? `${name}さん　0円（今日の主役）` : `${name}さん　${yen(r.amount)}円${adjust}`);
      continue;
    }
    const adjust = result.remainder !== 0 && m.id === result.remainderHolderId;
    const key = `${m.level}:${r.amount}:${adjust ? "adj" : ""}`;
    const g = groups.get(key);
    if (g) {
      g.count += 1;
    } else {
      groups.set(key, { level: m.level, count: 1, amount: r.amount, at: entries.length, adjust });
      entries.push("");
    }
  }
  for (const g of groups.values()) {
    entries[g.at] = `${LEVEL_NAMES[g.level]} ${g.count}人 各 ${yen(g.amount)}円${g.adjust ? ADJUST_MARK : ""}`;
  }
  lines.push(...entries);
  lines.push("");
  const organizerBase = input.organizerName.trim() || "幹事";
  const organizer = organizerBase.endsWith("さん") ? organizerBase : `${organizerBase}さん`;
  const deadline = input.deadline.trim();
  lines.push(
    deadline
      ? `${deadline}までに、${organizer}へお願いします。`
      : `${organizer}へお願いします。`,
  );
  if (result.remainder !== 0 && result.remainderHolderId) {
    const holder = rows.find((r) => r.member.id === result.remainderHolderId);
    // まだの人だけの文面では、端数を持つ人がまだの人に入っているときだけ書く
    if (holder || !unpaid) {
      const holderName = holder ? `${displayName(holder.member, everyone)}さん` : "";
      const unitText = input.unit ? `${yen(input.unit)}円単位にそろえた` : "";
      lines.push(`※ ${unitText}端数（${yen(Math.abs(result.remainder))}円）は、${holderName}の分で調整しています`);
    }
  }
  return lines.join("\n");
}
