"use client";

import { useRef, useState } from "react";
import { DRAG_THRESHOLD, levelFromDrag, stepSize } from "@/lib/drag";
import { LEVEL_NAMES, type Level, type SplitResult, yen } from "@/lib/split";

type Grab = { id: string; pointerId: number; x: number; y: number; level: Level; horizontal: boolean; step: number; moved: boolean };

/** 目盛りの上限：いちばん高い柱を少し超える、きりのよい数 */
function scaleMax(max: number): number {
  if (max <= 0) return 10000;
  const step = max > 50000 ? 10000 : max > 20000 ? 5000 : 2000;
  return Math.ceil((max * 1.05) / step) * step;
}

function signed(d: number): string {
  if (d === 0) return "±0";
  return d > 0 ? `+${yen(d)}` : `−${yen(-d)}`;
}

export function SlopeChart({
  result,
  names,
  selectedId,
  onSelect,
  onSetLevel,
  organizerId,
}: {
  result: SplitResult;
  /** 柱の名前（名前が空の人は仮の名前） */
  names: Record<string, string>;
  selectedId: string;
  onSelect: (id: string) => void;
  onSetLevel: (id: string, level: Level) => void;
  organizerId: string;
}) {
  const grab = useRef<Grab | null>(null);
  const suppressClick = useRef(false);
  const [grabbingId, setGrabbingId] = useState<string | null>(null);

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>, id: string, level: Level, guest: boolean) {
    if (guest || (e.pointerType === "mouse" && e.button !== 0)) return;
    const horizontal = window.matchMedia("(max-width: 720px)").matches;
    const track = e.currentTarget.querySelector(".step-track");
    const len = track ? (horizontal ? track.clientWidth : track.clientHeight) : 0;
    grab.current = { id, pointerId: e.pointerId, x: e.clientX, y: e.clientY, level, horizontal, step: stepSize(len), moved: false };
    suppressClick.current = false;
  }

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const g = grab.current;
    if (!g || g.pointerId !== e.pointerId) return;
    // 段が上がる向き：PC は上、スマホは右
    const dist = g.horizontal ? e.clientX - g.x : g.y - e.clientY;
    if (!g.moved) {
      if (Math.abs(dist) < DRAG_THRESHOLD) return;
      g.moved = true;
      suppressClick.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      onSelect(g.id);
      setGrabbingId(g.id);
    }
    onSetLevel(g.id, levelFromDrag(g.level, dist, g.step));
  }

  function endGrab(e: React.PointerEvent<HTMLButtonElement>) {
    if (grab.current?.pointerId !== e.pointerId) return;
    grab.current = null;
    setGrabbingId(null);
  }

  const max = Math.max(0, ...result.rows.map((r) => r.amount), result.even);
  const top = scaleMax(max);
  const showEven = result.even > 0 && result.payers > 1;

  return (
    <div className="chart">
      <div className="chart-ticks" aria-hidden="true">
        <span className="tick" style={{ bottom: "100%" }}>
          <span className="tick-label">{yen(top)}円</span>
        </span>
        {showEven && (
          <span className="tick tick-even" style={{ bottom: `${(result.even / top) * 100}%` }}>
            <span className="tick-label">
              均等
              <br />
              {yen(result.even)}
            </span>
          </span>
        )}
      </div>
      <ol className="steps" style={{ ["--n" as string]: result.rows.length }}>
        {result.rows.map((r) => {
          const h = r.amount / top;
          const e = showEven ? result.even / top : h;
          const hm = max > 0 ? r.amount / max : 0;
          const em = showEven && max > 0 ? result.even / max : hm;
          const isSel = r.member.id === selectedId;
          const name = names[r.member.id] ?? "名前なし";
          const isPlaceholder = r.member.name.trim() === "";
          const d = Math.round(r.diffFromEven);
          const short = !r.member.guest && showEven && d < 0;
          return (
            <li
              key={r.member.id}
              className={`step${r.member.guest ? " is-guest" : ""}${!r.member.guest && r.amount === 0 ? " is-zero" : ""}${isSel ? " is-sel" : ""}${grabbingId === r.member.id ? " is-grab" : ""}`}
            >
              <button
                type="button"
                className="step-btn"
                aria-pressed={isSel}
                aria-label={`${name}さん、${r.member.guest ? "主役" : LEVEL_NAMES[r.member.level]}、${yen(r.amount)}円${!r.member.guest && r.member.paid ? "、集金済み" : ""}${showEven && !r.member.guest ? `、均等より${signed(d)}円` : ""}。選んで編集`}
                onPointerDown={(e) => onPointerDown(e, r.member.id, r.member.level, r.member.guest)}
                onPointerMove={onPointerMove}
                onPointerUp={endGrab}
                onPointerCancel={endGrab}
                onClick={() => {
                  if (suppressClick.current) {
                    suppressClick.current = false;
                    return;
                  }
                  onSelect(r.member.id);
                }}
              >
                <span className="step-who">
                  <span className={`step-name${isPlaceholder ? " is-ph" : ""}`}>{name}</span>
                  <span className="step-level">
                    {r.member.guest ? "主役" : LEVEL_NAMES[r.member.level]}
                    {r.member.id === organizerId && "・幹事"}
                    {!r.member.guest && r.member.paid && "・済"}
                  </span>
                  {showEven && !r.member.guest && (
                    <span className={`step-diff${d > 0 ? " is-plus" : ""}`}>{signed(d)}</span>
                  )}
                </span>
                <span
                  className="step-track"
                  style={{ ["--h" as string]: h, ["--e" as string]: e, ["--hm" as string]: hm, ["--em" as string]: em }}
                >
                  {short && <span className="step-gap" aria-hidden="true" />}
                  <span className="step-bar">
                    <span className="step-amount">
                      {yen(r.amount)}
                      <small>円</small>
                    </span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
