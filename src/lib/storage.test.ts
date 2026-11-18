// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INITIAL_EVENT, INITIAL_MEMBERS } from "./sample";
import { loadWarikan, nextNewId, parseSaved, sameMembers, saveWarikan, STORAGE_KEY, type SavedWarikan } from "./storage";

const sample: SavedWarikan = {
  eventName: "新歓",
  total: 30000,
  members: [
    { id: "m1", name: "佐藤", level: 5, guest: false, paid: false },
    { id: "new-2", name: "", level: 1, guest: true, paid: false },
  ],
  slope: "steep",
  unit: 500,
  organizerId: "m1",
  remainderTo: "top",
  deadline: "来週",
  selectedId: "new-2",
};

function fakeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

describe("storage", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", fakeStorage());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("保存して読むと同じ中身に戻る", () => {
    saveWarikan(sample);
    expect(loadWarikan()).toEqual(sample);
  });

  it("バージョン付きのキーに保存する", () => {
    expect(STORAGE_KEY).toBe("senpai-warikan:v1");
  });

  it("保存が無ければ null", () => {
    expect(loadWarikan()).toBeNull();
  });

  it("壊れたJSONは null", () => {
    localStorage.setItem(STORAGE_KEY, "{oops");
    expect(loadWarikan()).toBeNull();
  });

  it("空の文字列は null", () => {
    localStorage.setItem(STORAGE_KEY, "");
    expect(loadWarikan()).toBeNull();
  });

  it("形違いは null", () => {
    expect(parseSaved(null)).toBeNull();
    expect(parseSaved([])).toBeNull();
    expect(parseSaved("x")).toBeNull();
    expect(parseSaved({})).toBeNull();
    expect(parseSaved({ ...sample, total: "30000" })).toBeNull();
    expect(parseSaved({ ...sample, members: "x" })).toBeNull();
  });

  it("範囲外の値は null", () => {
    const m = sample.members;
    expect(parseSaved({ ...sample, members: [{ ...m[0], level: 6 }] })).toBeNull();
    expect(parseSaved({ ...sample, members: [{ ...m[0], level: 0 }] })).toBeNull();
    expect(parseSaved({ ...sample, unit: 200 })).toBeNull();
    expect(parseSaved({ ...sample, slope: "cliff" })).toBeNull();
    expect(parseSaved({ ...sample, remainderTo: "nobody" })).toBeNull();
    expect(parseSaved({ ...sample, total: -1 })).toBeNull();
    expect(parseSaved({ ...sample, members: [] })).toBeNull();
    const many = Array.from({ length: 21 }, (_, i) => ({ id: `m${i}`, name: "", level: 3, guest: false, paid: false }));
    expect(parseSaved({ ...sample, members: many, organizerId: "m0", selectedId: "m0" })).toBeNull();
    expect(parseSaved({ ...sample, organizerId: "zzz" })).toBeNull();
    expect(parseSaved({ ...sample, selectedId: "zzz" })).toBeNull();
  });

  it("localStorage が使えなくても落ちない", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
    });
    expect(() => saveWarikan(sample)).not.toThrow();
    expect(loadWarikan()).toBeNull();
  });

  it("nextNewId は既存の new-N とぶつからない", () => {
    expect(nextNewId(INITIAL_MEMBERS)).toBe(1);
    expect(nextNewId(sample.members)).toBe(3);
  });

  it("sameMembers は中身で比べる", () => {
    expect(sameMembers(INITIAL_MEMBERS, INITIAL_MEMBERS.map((m) => ({ ...m })))).toBe(true);
    expect(sameMembers(INITIAL_MEMBERS, INITIAL_MEMBERS.slice(1))).toBe(false);
    expect(sameMembers(INITIAL_MEMBERS, INITIAL_MEMBERS.map((m, i) => (i === 0 ? { ...m, level: 4 } : m)))).toBe(false);
    expect(INITIAL_EVENT.total).toBe(46800);
  });
});
