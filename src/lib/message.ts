// LINE に貼る文面を作る。
import { type SplitResult, yen } from "./split";

export type MessageInput = {
  eventName: string;
  total: number;
  deadline: string;
  organizerName: string;
};

export function buildLineMessage(input: MessageInput, result: SplitResult): string {
  const title = input.eventName.trim() || "飲み会";
  const lines: string[] = [];
  lines.push(`【${title}】お会計のお知らせ`);
  lines.push(`合計 ${yen(input.total)}円（${result.rows.length}人）`);
  lines.push("");
  for (const r of result.rows) {
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
    const holder = result.rows.find((r) => r.member.id === result.remainderHolderId);
    const holderName = holder ? `${holder.member.name.trim() || "名前なし"}さん` : "";
    const sign = result.remainder > 0 ? "多め" : "少なめ";
    lines.push(`端数の${yen(Math.abs(result.remainder))}円は、${holderName}が${sign}に持っています。`);
  }
  return lines.join("\n");
}
