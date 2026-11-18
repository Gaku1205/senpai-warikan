import { describe, expect, it } from "vitest";
import { buildLineMessage } from "./message";
import { computeSplit, type Member } from "./split";

const members: Member[] = [
  { id: "a", name: "佐藤", level: 5, guest: false },
  { id: "b", name: "渡辺", level: 3, guest: false },
  { id: "c", name: "山本", level: 3, guest: true },
];

describe("buildLineMessage", () => {
  it("題・1人1行・期限が入る", () => {
    const r = computeSplit({ total: 10000, members, slope: "normal", unit: 100, organizerId: "b", remainderTo: "organizer" });
    const text = buildLineMessage({ eventName: "山本さん送別会", total: 10000, deadline: "11月28日（金）", organizerName: "渡辺" }, r);
    expect(text).toContain("【山本さん送別会】お会計のお知らせ");
    expect(text).toContain("合計 10,000円（3人）");
    expect(text).toContain("山本さん　0円（今日の主役）");
    expect(text).toContain("11月28日（金）までに、渡辺へお願いします。");
    expect(text.split("\n")[3]).toMatch(/^佐藤さん　[\d,]+円$/);
  });

  it("端数があれば一言足す", () => {
    const r = computeSplit({ total: 10000, members: members.slice(0, 2), slope: "flat", unit: 1000, organizerId: "b", remainderTo: "organizer" });
    // 5,000ずつで端数なし
    expect(buildLineMessage({ eventName: "", total: 10000, deadline: "", organizerName: "" }, r)).not.toContain("端数");
    const r2 = computeSplit({ total: 10300, members: members.slice(0, 2), slope: "flat", unit: 1000, organizerId: "b", remainderTo: "organizer" });
    const t2 = buildLineMessage({ eventName: "", total: 10300, deadline: "", organizerName: "渡辺" }, r2);
    expect(t2).toContain("【飲み会】");
    expect(t2).toMatch(/端数の[\d,]+円は、渡辺さんが(多め|少なめ)に持っています。/);
  });
});
