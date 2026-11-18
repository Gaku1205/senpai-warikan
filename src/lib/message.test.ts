import { describe, expect, it } from "vitest";
import { buildLineMessage } from "./message";
import { computeSplit, type Member } from "./split";

const members: Member[] = [
  { id: "a", name: "佐藤", level: 5, guest: false, paid: false },
  { id: "b", name: "渡辺", level: 3, guest: false, paid: false },
  { id: "c", name: "山本", level: 3, guest: true, paid: false },
];

describe("buildLineMessage", () => {
  it("題・1人1行・期限が入る", () => {
    const r = computeSplit({ total: 10000, members, slope: "normal", unit: 100, organizerId: "b", remainderTo: "organizer" });
    const text = buildLineMessage({ eventName: "山本さん送別会", total: 10000, deadline: "11月28日（金）", organizerName: "渡辺" }, r);
    expect(text).toContain("【山本さん送別会】お会計のお知らせ");
    expect(text).toContain("合計 10,000円（3人）");
    expect(text).toContain("山本さん　0円（今日の主役）");
    expect(text).toContain("11月28日（金）までに、渡辺さんへお願いします。");
    expect(text.split("\n")[3]).toMatch(/^佐藤さん　[\d,]+円$/);
  });

  it("端数があれば一言足す", () => {
    const r = computeSplit({ total: 10000, members: members.slice(0, 2), slope: "flat", unit: 1000, organizerId: "b", remainderTo: "organizer" });
    // 5,000ずつで端数なし
    expect(buildLineMessage({ eventName: "", total: 10000, deadline: "", organizerName: "" }, r)).not.toContain("端数");
    const r2 = computeSplit({ total: 10300, members: members.slice(0, 2), slope: "flat", unit: 1000, organizerId: "b", remainderTo: "organizer" });
    const t2 = buildLineMessage({ eventName: "", total: 10300, deadline: "", organizerName: "渡辺" }, r2);
    expect(t2).toContain("【飲み会】");
    expect(t2).toContain("※ 端数（300円）は、渡辺さんの分で調整しています");
  });

  it("端数の行：丸めの単位と、何円をだれの分で調整したかが、多め・少なめどちらでも同じ形で読める", () => {
    const base = { eventName: "", deadline: "", organizerName: "渡辺", unit: 100 };
    const two = members.slice(0, 2);
    for (const total of [10050, 9950]) {
      const r = computeSplit({ total, members: two, slope: "flat", unit: 100, organizerId: "b", remainderTo: "organizer" });
      const text = buildLineMessage({ ...base, total }, r);
      expect(text).toContain("※ 100円単位にそろえた端数（50円）は、渡辺さんの分で調整しています");
      expect(text).toMatch(/渡辺さん　[\d,]+円（端数調整）/);
      expect(text).not.toMatch(/佐藤さん　[\d,]+円（端数調整）/);
    }
  });

  it("文面の中の名前は全部「〇〇さん」。幹事も同じ", () => {
    const r = computeSplit({ total: 10050, members: members.slice(0, 2), slope: "flat", unit: 100, organizerId: "b", remainderTo: "organizer" });
    const text = buildLineMessage({ eventName: "", total: 10050, deadline: "", organizerName: "渡辺", unit: 100 }, r);
    expect(text).not.toMatch(/渡辺(?!さん)/);
    expect(text).not.toMatch(/佐藤(?!さん)/);
    expect(text).toContain("渡辺さんへお願いします。");
    const none = buildLineMessage({ eventName: "", total: 10000, deadline: "", organizerName: "" }, r);
    expect(none).toContain("幹事さんへお願いします。");
  });

  it("全員の文面は、集金の印があっても変わらない", () => {
    const base = { eventName: "送別会", total: 10000, deadline: "11月28日（金）", organizerName: "渡辺" };
    const split = (ms: Member[]) => computeSplit({ total: 10000, members: ms, slope: "normal", unit: 100, organizerId: "b", remainderTo: "organizer" });
    const marked = members.map((m) => (m.id === "a" ? { ...m, paid: true } : m));
    expect(buildLineMessage(base, split(marked), "all")).toBe(buildLineMessage(base, split(members)));
    expect(buildLineMessage(base, split(members), "all")).toBe(buildLineMessage(base, split(members)));
  });

  it("まだの人だけの文面：主役と集金済みを除き、合計が金額の合計と一致する", () => {
    const base = { eventName: "山本さん送別会", total: 10000, deadline: "11月28日（金）", organizerName: "渡辺" };
    const ms = members.map((m) => (m.id === "a" ? { ...m, paid: true } : m));
    const r = computeSplit({ total: 10000, members: ms, slope: "flat", unit: 100, organizerId: "b", remainderTo: "organizer" });
    const lines = buildLineMessage(base, r, "unpaid").split("\n");
    expect(lines[0]).toBe("【山本さん送別会】集金のお願い");
    expect(lines[1]).toBe("まだの方 1人・合計 5,000円");
    expect(lines[3]).toBe("渡辺さん　5,000円");
    expect(lines).not.toContain("佐藤さん　5,000円");
    expect(lines.join("\n")).not.toContain("今日の主役");
    expect(lines[5]).toBe("11月28日（金）までに、渡辺さんへお願いします。");
  });

  it("まだの人が複数のとき、人数と合計は金額の合計", () => {
    const r = computeSplit({ total: 10000, members, slope: "normal", unit: 100, organizerId: "b", remainderTo: "organizer" });
    const text = buildLineMessage({ eventName: "", total: 10000, deadline: "", organizerName: "" }, r, "unpaid");
    expect(text.split("\n")[1]).toBe("まだの方 2人・合計 10,000円");
  });

  it("端数を持つ人が集金済みなら、まだの人だけの文面に端数の行は出ない", () => {
    const ms = members.slice(0, 2).map((m) => (m.id === "b" ? { ...m, paid: true } : m));
    const r = computeSplit({ total: 10300, members: ms, slope: "flat", unit: 1000, organizerId: "b", remainderTo: "organizer" });
    const text = buildLineMessage({ eventName: "", total: 10300, deadline: "", organizerName: "渡辺" }, r, "unpaid");
    expect(text).not.toContain("端数");
  });

  it("まだの人が0人なら1行だけ", () => {
    const ms = members.map((m) => ({ ...m, paid: true }));
    const r = computeSplit({ total: 10000, members: ms, slope: "normal", unit: 100, organizerId: "b", remainderTo: "organizer" });
    expect(buildLineMessage({ eventName: "", total: 10000, deadline: "", organizerName: "" }, r, "unpaid")).toBe("全員の集金が済みました。");
  });
});
