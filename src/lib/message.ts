// LINE に貼る文面を作る。
import { type SplitResult, yen } from "./split";

export type MessageInput = {
  eventName: string;
  total: number;
  deadline: string;
  organizerName: string;
};

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
  for (const r of rows) {
    const name = r.member.name.trim() || "名前なし";
    if (r.member.guest) {
      lines.push(`${name}さん　0円（今日の主役）`);
    } else {
      lines.push(`${name}さん　${yen(r.amount)}円`);
    }
  }
  lines.push("");
  const organizer = input.organizerName.trim() || "幹事";
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
      const holderName = holder ? `${holder.member.name.trim() || "名前なし"}さん` : "";
      const sign = result.remainder > 0 ? "多め" : "少なめ";
      lines.push(`端数の${yen(Math.abs(result.remainder))}円は、${holderName}が${sign}に持っています。`);
    }
  }
  return lines.join("\n");
}
