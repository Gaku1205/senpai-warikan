import { describe, expect, it } from "vitest";
import { computeSplit, type Member, sortBySlope, weightOf } from "./split";

const team: Member[] = [
  { id: "a", name: "伊藤", level: 3, guest: false },
  { id: "b", name: "佐藤", level: 5, guest: false },
  { id: "c", name: "高橋", level: 4, guest: false },
  { id: "d", name: "鈴木", level: 4, guest: false },
  { id: "e", name: "渡辺", level: 3, guest: false },
  { id: "f", name: "中村", level: 2, guest: false },
  { id: "g", name: "小林", level: 1, guest: false },
  { id: "h", name: "山本", level: 3, guest: true },
];

describe("weightOf", () => {
  it("同期が1、1段ごとに坂の倍率がかかる", () => {
    expect(weightOf(3, "normal")).toBe(1);
    expect(weightOf(4, "normal")).toBeCloseTo(1.3);
    expect(weightOf(1, "steep")).toBeCloseTo(1 / 2.25);
    expect(weightOf(5, "flat")).toBe(1);
  });
});

describe("sortBySlope", () => {
  it("段の高い順で、同じ段は入力の順", () => {
    expect(sortBySlope(team).map((m) => m.id)).toEqual(["b", "c", "d", "a", "e", "h", "f", "g"]);
  });
});

describe("computeSplit", () => {
  it("ふつうの坂・100円丸めで、合計がぴったり集まる", () => {
    const r = computeSplit({ total: 46800, members: team, slope: "normal", unit: 100, organizerId: "e", remainderTo: "organizer" });
    const byId = Object.fromEntries(r.rows.map((x) => [x.member.id, x.amount]));
    expect(byId).toEqual({ b: 10300, c: 8000, d: 8000, a: 6100, e: 6100, h: 0, f: 4700, g: 3600 });
    expect(r.collected).toBe(46800);
    expect(r.remainder).toBe(0);
    expect(r.payers).toBe(7);
  });

  it("均等なら、払う人で同じ額。主役は0円", () => {
    const r = computeSplit({ total: 7000, members: team, slope: "flat", unit: 100, organizerId: "e", remainderTo: "organizer" });
    for (const row of r.rows) expect(row.amount).toBe(row.member.guest ? 0 : 1000);
  });

  it("端数は幹事が持つ", () => {
    const r = computeSplit({ total: 10000, members: team.slice(0, 3), slope: "flat", unit: 1000, organizerId: "a", remainderTo: "organizer" });
    // 3,333→3,000 ×3 = 9,000。端数1,000は伊藤（幹事）
    expect(r.remainder).toBe(1000);
    expect(r.remainderHolderId).toBe("a");
    expect(r.rows.find((x) => x.member.id === "a")?.amount).toBe(4000);
    expect(r.collected).toBe(10000);
  });

  it("端数をいちばん上が持つ", () => {
    const r = computeSplit({ total: 10000, members: team.slice(0, 3), slope: "flat", unit: 1000, organizerId: "a", remainderTo: "top" });
    expect(r.remainderHolderId).toBe("b");
    expect(r.collected).toBe(10000);
  });

  it("幹事が主役なら、端数はいちばん上へ", () => {
    const r = computeSplit({ total: 10000, members: team.slice(0, 3), slope: "flat", unit: 1000, organizerId: "h", remainderTo: "organizer" });
    expect(r.remainderHolderId).toBe("b");
  });

  it("合計0円・全員が主役でも壊れない", () => {
    expect(computeSplit({ total: 0, members: team, slope: "normal", unit: 100, organizerId: "e", remainderTo: "organizer" }).collected).toBe(0);
    const allGuests = team.map((m) => ({ ...m, guest: true }));
    const r = computeSplit({ total: 5000, members: allGuests, slope: "normal", unit: 100, organizerId: "e", remainderTo: "organizer" });
    expect(r.payers).toBe(0);
    expect(r.collected).toBe(0);
  });

  it("均等割りとの差を足すと0になる", () => {
    const r = computeSplit({ total: 46800, members: team, slope: "steep", unit: 500, organizerId: "e", remainderTo: "organizer" });
    const sum = r.rows.reduce((s, x) => s + x.diffFromEven, 0);
    expect(Math.abs(sum)).toBeLessThan(1e-6);
    expect(r.collected).toBe(46800);
  });
});
