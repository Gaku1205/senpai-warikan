import { describe, expect, it } from "vitest";
import { canAdjust, clearNames, countByLevel, displayName, setHeadcount } from "./headcount";
import { buildLineMessage } from "./message";
import { INITIAL_MEMBERS } from "./sample";
import { computeSplit, type Level, type Member } from "./split";

function m(id: string, level: Level, name = "", guest = false): Member {
  return { id, name, level, guest, paid: false };
}

describe("countByLevel", () => {
  it("立場ごとに数え、主役も入る", () => {
    expect(countByLevel(INITIAL_MEMBERS)).toEqual({ 5: 1, 4: 2, 3: 3, 2: 1, 1: 1 });
  });
});

describe("setHeadcount", () => {
  it("増やすと、その立場に名前が空の人が足される", () => {
    const next = setHeadcount([m("a", 4, "高橋")], 4, 3);
    expect(next).toHaveLength(3);
    expect(next.slice(1).every((x) => x.name === "" && x.level === 4 && !x.guest)).toBe(true);
    expect(new Set(next.map((x) => x.id)).size).toBe(3);
  });

  it("減らすと、名前が空の人から後ろから消える", () => {
    const base = [m("a", 4, "高橋"), m("b", 4), m("c", 4, "鈴木"), m("d", 4), m("z", 3, "山")];
    expect(setHeadcount(base, 4, 3).map((x) => x.id)).toEqual(["a", "b", "c", "z"]);
    expect(setHeadcount(base, 4, 2).map((x) => x.id)).toEqual(["a", "c", "z"]);
    // 名前が空の人がいなくなったら、名前の入った人を後ろから
    expect(setHeadcount(base, 4, 1).map((x) => x.id)).toEqual(["a", "z"]);
  });

  it("主役は最後に消える（人数には数える）", () => {
    const base = [m("a", 3, "山本", true), m("b", 3, "伊藤"), m("c", 3), m("z", 5, "上")];
    expect(countByLevel(base)[3]).toBe(3);
    expect(setHeadcount(base, 3, 2).map((x) => x.id)).toEqual(["a", "b", "z"]);
    expect(setHeadcount(base, 3, 1).map((x) => x.id)).toEqual(["a", "z"]);
    expect(setHeadcount(base, 3, 0).map((x) => x.id)).toEqual(["z"]);
  });

  it("全体は1〜20人に収まる", () => {
    const one = [m("a", 3)];
    expect(setHeadcount(one, 3, 0)).toHaveLength(1);
    expect(setHeadcount(one, 3, 99)).toHaveLength(20);
    const full = setHeadcount(one, 3, 20);
    expect(setHeadcount(full, 4, 5)).toHaveLength(20);
    expect(canAdjust(full, 4)).toEqual({ canMinus: false, canPlus: false });
    expect(canAdjust(one, 3)).toEqual({ canMinus: false, canPlus: true });
  });

  it("人数の欄からも一覧の編集からも、同じ数になる", () => {
    const viaField = setHeadcount([m("a", 4, "高橋")], 3, 2);
    expect(countByLevel(viaField)).toEqual({ 5: 0, 4: 1, 3: 2, 2: 0, 1: 0 });
    // 一覧で立場を変えると、欄の数も変わる
    const viaEditor = viaField.map((x) => (x.id === "a" ? { ...x, level: 5 as Level } : x));
    expect(countByLevel(viaEditor)).toEqual({ 5: 1, 4: 0, 3: 2, 2: 0, 1: 0 });
    // 欄で戻すと、一覧と同じ状態
    expect(setHeadcount(viaEditor, 5, 0)).toHaveLength(2);
  });
});

describe("仮の名前", () => {
  it("立場と番号で見せる。名前が入っていればその名前", () => {
    const ms = [m("a", 4, "高橋"), m("b", 4), m("c", 4), m("d", 5)];
    expect(displayName(ms[0], ms)).toBe("高橋");
    expect(displayName(ms[1], ms)).toBe("先輩2");
    expect(displayName(ms[2], ms)).toBe("先輩3");
    expect(displayName(ms[3], ms)).toBe("上司1");
  });
});

describe("clearNames", () => {
  it("名前を全部空にする", () => {
    expect(clearNames(INITIAL_MEMBERS).every((x) => x.name === "")).toBe(true);
    expect(clearNames(INITIAL_MEMBERS)).toHaveLength(8);
  });
});

describe("名前が空の人の文面", () => {
  const base = { eventName: "", total: 0, deadline: "", organizerName: "" };

  it("同じ立場・同じ金額を1行にまとめ、合計はずれない", () => {
    const ms = [m("a", 5), m("b", 4), m("c", 4), m("d", 3, "渡辺"), m("e", 2), m("f", 2)];
    const total = 46800;
    const r = computeSplit({ total, members: ms, slope: "normal", unit: 100, organizerId: "a", remainderTo: "top" });
    const text = buildLineMessage({ ...base, total }, r);
    expect(text).toContain("先輩 2人 各 ");
    expect(text).toContain("渡辺さん　");
    expect(text).toMatch(/後輩 \d人 各 [\d,]+円/);
    expect(r.collected).toBe(total);
    // 文面の人数×各金額＋個別の金額の合計が、合計と一致する
    let sum = 0;
    for (const line of text.split("\n")) {
      const g = /^.+ (\d+)人 各 ([\d,]+)円$/.exec(line);
      if (g) sum += Number(g[1]) * Number(g[2].replace(/,/g, ""));
      const one = /^.+さん　([\d,]+)円$/.exec(line);
      if (one) sum += Number(one[1].replace(/,/g, ""));
    }
    expect(sum).toBe(total);
  });

  it("端数を持つ人は金額が違うので別の行になる", () => {
    const ms = [m("a", 3), m("b", 3), m("c", 3)];
    const r = computeSplit({ total: 10000, members: ms, slope: "flat", unit: 100, organizerId: "a", remainderTo: "top" });
    const lines = buildLineMessage({ ...base, total: 10000 }, r).split("\n");
    expect(lines).toContain("同期 1人 各 3,400円");
    expect(lines).toContain("同期 2人 各 3,300円");
  });

  it("1人だけでも同じ形で、主役は1人1行", () => {
    const ms = [m("a", 4), m("b", 3, "", true)];
    const r = computeSplit({ total: 5000, members: ms, slope: "flat", unit: 100, organizerId: "a", remainderTo: "top" });
    const text = buildLineMessage({ ...base, total: 5000 }, r);
    expect(text).toContain("先輩 1人 各 5,000円");
    expect(text).toContain("同期1さん　0円（今日の主役）");
  });
});
