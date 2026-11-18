import { describe, expect, it } from "vitest";
import { levelFromDrag, stepSize } from "./drag";

describe("levelFromDrag", () => {
  it("1段ぶん動くまでは変わらない", () => {
    expect(levelFromDrag(3, 0, 50)).toBe(3);
    expect(levelFromDrag(3, 49, 50)).toBe(3);
    expect(levelFromDrag(3, -49, 50)).toBe(3);
  });
  it("1段ぶん動くと次の段になる", () => {
    expect(levelFromDrag(3, 50, 50)).toBe(4);
    expect(levelFromDrag(3, -50, 50)).toBe(2);
    expect(levelFromDrag(3, 120, 50)).toBe(5);
    expect(levelFromDrag(3, -120, 50)).toBe(1);
  });
  it("1〜5を超えない", () => {
    expect(levelFromDrag(5, 500, 50)).toBe(5);
    expect(levelFromDrag(1, -500, 50)).toBe(1);
    expect(levelFromDrag(2, 10000, 50)).toBe(5);
  });
  it("おかしな値では元の段のまま", () => {
    expect(levelFromDrag(3, NaN, 50)).toBe(3);
    expect(levelFromDrag(3, 100, 0)).toBe(3);
  });
});

describe("stepSize", () => {
  it("長さを5で割り、下限は24px", () => {
    expect(stepSize(500)).toBe(100);
    expect(stepSize(50)).toBe(24);
  });
});
