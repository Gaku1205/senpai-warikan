"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadWarikan, sameMembers, saveWarikan } from "@/lib/storage";
import { LEVELS, MAX_MEMBERS, canAdjust, clearNames, countByLevel, displayName, newMemberId, placeholderName, setHeadcount } from "@/lib/headcount";
import { Mark } from "./Mark";
import { SlopeChart } from "./SlopeChart";
import { MemberEditor } from "./MemberEditor";
import { LineMessage } from "./LineMessage";
import { Presets } from "./Presets";
import { SlopeGlyph } from "./SlopeGlyph";
import { buildLineMessage, type MessageTarget } from "@/lib/message";
import {
  computeSplit,
  type Level,
  type Member,
  type RemainderHolder,
  type RoundUnit,
  type Slope,
  LEVEL_NAMES,
  SLOPE_NAMES,
  SLOPES,
  yen,
} from "@/lib/split";
import { INITIAL_EVENT, INITIAL_MEMBERS } from "@/lib/sample";

const UNITS: RoundUnit[] = [100, 500, 1000];

type Setting = "name" | "unit" | "remainder" | "due";

export function Warikan() {
  const [eventName, setEventName] = useState(INITIAL_EVENT.eventName);
  const [totalText, setTotalText] = useState(String(INITIAL_EVENT.total));
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [slope, setSlope] = useState<Slope>("normal");
  const [unit, setUnit] = useState<RoundUnit>(100);
  const [organizerId, setOrganizerId] = useState(INITIAL_EVENT.organizerId);
  const [remainderTo, setRemainderTo] = useState<RemainderHolder>("organizer");
  const [deadline, setDeadline] = useState(INITIAL_EVENT.deadline);
  const [selectedId, setSelectedId] = useState(INITIAL_MEMBERS[0].id);
  const [editing, setEditing] = useState<Setting | null>(null);
  const [target, setTarget] = useState<MessageTarget>("all");

  const [loaded, setLoaded] = useState(false);

  const total = Number(totalText.replace(/[^\d]/g, "")) || 0;

  // 最初の描画のあとに、残した中身を読み込む（hydration をずらさないため）
  useEffect(() => {
    const saved = loadWarikan();
    if (saved) {
      /* eslint-disable react-hooks/set-state-in-effect -- localStorage は最初の描画のあとでしか読めない（hydration を合わせるため） */
      setEventName(saved.eventName);
      setTotalText(saved.total ? String(saved.total) : "");
      setMembers(saved.members);
      setSlope(saved.slope);
      setUnit(saved.unit);
      setOrganizerId(saved.organizerId);
      setRemainderTo(saved.remainderTo);
      setDeadline(saved.deadline);
      setSelectedId(saved.selectedId);
    }
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // 読み込みが終わったあと、入力が変わるたびに残す
  useEffect(() => {
    if (!loaded) return;
    saveWarikan({ eventName, total, members, slope, unit, organizerId, remainderTo, deadline, selectedId });
  }, [loaded, eventName, total, members, slope, unit, organizerId, remainderTo, deadline, selectedId]);

  const result = useMemo(
    () => computeSplit({ total, members, slope, unit, organizerId, remainderTo }),
    [total, members, slope, unit, organizerId, remainderTo],
  );

  const organizer = members.find((m) => m.id === organizerId);
  const message = buildLineMessage(
    { eventName, total, deadline, organizerName: organizer?.name ?? "" },
    result,
    target,
  );

  const payingRows = result.rows.filter((r) => !r.member.guest);
  const top = payingRows[0];
  const bottom = payingRows[payingRows.length - 1];

  function updateMember(id: string, patch: Partial<Member>) {
    setMembers((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  function moveLevel(id: string, delta: 1 | -1) {
    setMembers((ms) =>
      ms.map((m) => {
        if (m.id !== id) return m;
        const next = Math.min(5, Math.max(1, m.level + delta)) as Level;
        return { ...m, level: next };
      }),
    );
  }

  function setLevel(id: string, level: Level) {
    setMembers((ms) => ms.map((m) => (m.id === id && !m.guest && m.level !== level ? { ...m, level } : m)));
  }

  function addMember() {
    if (members.length >= MAX_MEMBERS) return;
    const id = newMemberId(members);
    setMembers((ms) => [...ms, { id, name: "", level: 3, guest: false, paid: false }]);
    setSelectedId(id);
  }

  function removeMember(id: string) {
    if (members.length <= 1) return;
    const rest = members.filter((m) => m.id !== id);
    setMembers(rest);
    setSelectedId(rest[0].id);
    if (organizerId === id) setOrganizerId(rest[0].id);
  }

  // 立場ごとの人数を変える。例の会のままなら、先に名前を全部空にして自分の会に切り替える
  function changeHeadcount(level: Level, delta: 1 | -1) {
    const base = isExample ? clearNames(members) : members;
    const next = setHeadcount(base, level, countByLevel(base)[level] + delta);
    setMembers(next);
    if (!next.some((m) => m.id === selectedId)) setSelectedId(next[0].id);
    if (!next.some((m) => m.id === organizerId)) setOrganizerId(next[0].id);
  }

  function applyPreset(p: { slope: Slope; guests: "newbies" | "keep" | "none" }) {
    setSlope(p.slope);
    setMembers((ms) =>
      ms.map((m) => ({
        ...m,
        guest: p.guests === "keep" ? m.guest : p.guests === "newbies" ? m.level === 1 : false,
      })),
    );
  }

  const moved = result.rows.reduce((sum, r) => sum + (r.member.guest ? 0 : Math.max(0, Math.round(r.diffFromEven))), 0);
  // 最初に入っている会のままか（書き換えるまで「例」と出す）
  const isExample = eventName === INITIAL_EVENT.eventName && total === INITIAL_EVENT.total && sameMembers(members, INITIAL_MEMBERS);

  function toggle(k: Setting) {
    setEditing((cur) => (cur === k ? null : k));
  }

  const counts = countByLevel(members);
  const names = Object.fromEntries(members.map((m) => [m.id, displayName(m, members)]));
  const selected = members.find((m) => m.id === selectedId) ?? members[0];

  return (
    <div className="app">
      <header className="bar">
        <div className="bar-in">
          <Link className="brand" href="/" aria-label="先輩割り勘 トップ">
            <Mark />
            <span className="brand-name">先輩割り勘</span>
          </Link>
          <p className="bar-event">{eventName.trim() || "飲み会"}</p>
        </div>
      </header>

      <main className="main">
        <section className="hill" aria-label="お会計と坂">
          <div className="hill-top">
            <div className="bill">
              <h1 className="bill-h">
                お会計{isExample && <span className="example">例の会。伝票の金額に書き換えてください</span>}
              </h1>
              <label className="total-row">
                <input
                  className="total-input"
                  inputMode="numeric"
                  value={total ? yen(total) : totalText}
                  onChange={(e) => setTotalText(e.target.value.replace(/[^\d]/g, "").slice(0, 8))}
                  aria-label="合計金額（円）"
                  placeholder="0"
                />
                <span className="total-unit">円</span>
              </label>
              <div className="heads" role="group" aria-label="立場ごとの人数">
                <p className="heads-h">
                  人数<span className="heads-sum">計 {members.length}人</span>
                </p>
                {LEVELS.map((lv) => {
                  const { canMinus, canPlus } = canAdjust(members, lv);
                  return (
                    <div key={lv} className="heads-row">
                      <span className="heads-name">{LEVEL_NAMES[lv]}</span>
                      <button type="button" className="ed-btn" aria-label={`${LEVEL_NAMES[lv]}を1人減らす`} disabled={!canMinus} onClick={() => changeHeadcount(lv, -1)}>
                        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
                      </button>
                      <span className={`heads-n${counts[lv] > 0 ? " is-on" : ""}`} aria-live="polite">{counts[lv]}</span>
                      <button type="button" className="ed-btn" aria-label={`${LEVEL_NAMES[lv]}を1人増やす`} disabled={!canPlus} onClick={() => changeHeadcount(lv, 1)}>
                        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M8 3v10" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <fieldset className="slopes-field">
              <legend className="bill-h">坂の急さ</legend>
              <div className="slopes" role="radiogroup" aria-label="坂の急さ">
                {SLOPES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={slope === s}
                    className={`slope-opt${slope === s ? " is-on" : ""}`}
                    onClick={() => setSlope(s)}
                  >
                    <SlopeGlyph slope={s} width={60} height={40} outline={slope !== s} />
                    <span>{SLOPE_NAMES[s]}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="moved">
              <p className="bill-h">坂で先輩が多めに出した分</p>
              <p className="moved-big">
                {yen(moved)}
                <small>円</small>
              </p>
              <p className="hill-finding">
                {top && bottom && total > 0 && payingRows.length > 1 ? (
                  <>
                    いちばん上 <b>{yen(top.amount)}円</b>・いちばん下 <b>{yen(bottom.amount)}円</b>
                    {bottom.amount > 0 && <span className="nowrap">（{(top.amount / bottom.amount).toFixed(1)}倍）</span>}
                  </>
                ) : (
                  <>合計を入れると、坂ができます</>
                )}
              </p>
            </div>
          </div>

          <h2 className="sr">坂</h2>
          <SlopeChart result={result} names={names} selectedId={selected.id} onSelect={setSelectedId} onSetLevel={setLevel} organizerId={organizerId} />
          <MemberEditor
            member={selected}
            placeholder={placeholderName(selected, members)}
            canRemove={members.length > 1}
            canAdd={members.length < MAX_MEMBERS}
            onChange={(patch) => updateMember(selected.id, patch)}
            onMove={(d) => moveLevel(selected.id, d)}
            onRemove={() => removeMember(selected.id)}
            onAdd={addMember}
          />
        </section>

        <section className="rules" aria-label="会の決まり">
          <p className="rules-line">
            <button type="button" className={`rule${editing === "name" ? " is-open" : ""}`} aria-expanded={editing === "name"} onClick={() => toggle("name")}>
              {isExample && "例："}
              {eventName.trim() || "会の名前"}
            </button>
            <span className="rules-sep">・</span>
            <button type="button" className={`rule${editing === "unit" ? " is-open" : ""}`} aria-expanded={editing === "unit"} onClick={() => toggle("unit")}>
              {yen(unit)}円で丸め
            </button>
            <span className="rules-sep">・</span>
            <button type="button" className={`rule${editing === "remainder" ? " is-open" : ""}`} aria-expanded={editing === "remainder"} onClick={() => toggle("remainder")}>
              端数は{remainderTo === "organizer" ? "幹事" : "いちばん上"}
            </button>
            <span className="rules-sep">・</span>
            <button type="button" className={`rule${editing === "due" ? " is-open" : ""}`} aria-expanded={editing === "due"} onClick={() => toggle("due")}>
              {deadline.trim() ? `${deadline.trim()}までに` : ""}
              {organizer?.name.trim() || "幹事"}へ
            </button>
          </p>
          {editing === null ? (
            <p className="rules-hint">下線の所を押すと変えられます</p>
          ) : (
            <div className="rules-edit">
              {editing === "name" && (
                <label className="field">
                  <span className="field-label">会の名前</span>
                  <input className="input" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="例：新歓、忘年会" autoFocus />
                </label>
              )}
              {editing === "unit" && (
                <div className="seg" role="radiogroup" aria-label="丸めの単位">
                  {UNITS.map((u) => (
                    <button key={u} type="button" role="radio" aria-checked={unit === u} className={`seg-opt${unit === u ? " is-on" : ""}`} onClick={() => setUnit(u)}>
                      {yen(u)}円で丸め
                    </button>
                  ))}
                </div>
              )}
              {editing === "remainder" && (
                <div className="seg" role="radiogroup" aria-label="端数を持つ人">
                  {(["organizer", "top"] as RemainderHolder[]).map((k) => (
                    <button key={k} type="button" role="radio" aria-checked={remainderTo === k} className={`seg-opt${remainderTo === k ? " is-on" : ""}`} onClick={() => setRemainderTo(k)}>
                      端数は{k === "organizer" ? "幹事" : "いちばん上"}
                    </button>
                  ))}
                </div>
              )}
              {editing === "due" && (
                <div className="field-pair">
                  <label className="field">
                    <span className="field-label">集める期限</span>
                    <input className="input" value={deadline} onChange={(e) => setDeadline(e.target.value)} placeholder="例：28日（金）" autoFocus />
                  </label>
                  <label className="field">
                    <span className="field-label">幹事</span>
                    <select className="input" value={organizerId} onChange={(e) => setOrganizerId(e.target.value)}>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {names[m.id]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
              <button type="button" className="rules-done" onClick={() => setEditing(null)}>
                決める
              </button>
            </div>
          )}
        </section>
      </main>

      <LineMessage text={message} target={target} onTarget={setTarget} />

      <Presets current={slope} onApply={applyPreset} />

      <footer className="foot">
        <div className="foot-in">
          <Mark size={20} />
          <p>丸めて出た端数は、幹事かいちばん上の人が持ちます。合計は1円もずれません。</p>
        </div>
      </footer>
    </div>
  );
}
