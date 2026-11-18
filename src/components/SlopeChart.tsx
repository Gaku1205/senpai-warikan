import { LEVEL_NAMES, type SplitResult, yen } from "@/lib/split";

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
  selectedId,
  onSelect,
  organizerId,
}: {
  result: SplitResult;
  selectedId: string;
  onSelect: (id: string) => void;
  organizerId: string;
}) {
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
          const name = r.member.name.trim() || "名前なし";
          const d = Math.round(r.diffFromEven);
          const short = !r.member.guest && showEven && d < 0;
          return (
            <li
              key={r.member.id}
              className={`step${r.member.guest ? " is-guest" : ""}${!r.member.guest && r.amount === 0 ? " is-zero" : ""}${isSel ? " is-sel" : ""}`}
            >
              <button
                type="button"
                className="step-btn"
                aria-pressed={isSel}
                aria-label={`${name}さん、${r.member.guest ? "主役" : LEVEL_NAMES[r.member.level]}、${yen(r.amount)}円${showEven && !r.member.guest ? `、均等より${signed(d)}円` : ""}。選んで編集`}
                onClick={() => onSelect(r.member.id)}
              >
                <span className="step-who">
                  <span className="step-name">{name}</span>
                  <span className="step-level">
                    {r.member.guest ? "主役" : LEVEL_NAMES[r.member.level]}
                    {r.member.id === organizerId && "・幹事"}
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
