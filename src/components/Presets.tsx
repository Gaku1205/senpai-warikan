import { type Slope, SLOPE_NAMES } from "@/lib/split";
import { SlopeGlyph } from "./SlopeGlyph";

type Preset = {
  name: string;
  rule: string;
  slope: Slope;
  guests: "newbies" | "keep" | "none";
};

const PRESETS: Preset[] = [
  { name: "新歓", rule: "新人は0円。残りを急な坂で", slope: "steep", guests: "newbies" },
  { name: "送別会", rule: "主役は0円のまま、ふつうの坂", slope: "normal", guests: "keep" },
  { name: "部の打ち上げ", rule: "全員が払う。ゆるい坂", slope: "gentle", guests: "none" },
  { name: "同期会", rule: "全員が払う。均等に", slope: "flat", guests: "none" },
];

export function Presets({
  current,
  onApply,
}: {
  current: Slope;
  onApply: (p: { slope: Slope; guests: Preset["guests"] }) => void;
}) {
  return (
    <section className="presets" aria-labelledby="presets-h">
      <div className="presets-in">
        <h2 id="presets-h" className="presets-h">よく使う坂</h2>
        <ul className="preset-list">
          {PRESETS.map((p) => (
            <li key={p.name}>
              <button
                type="button"
                className={`preset${current === p.slope ? " is-near" : ""}`}
                onClick={() => onApply({ slope: p.slope, guests: p.guests })}
              >
                <SlopeGlyph slope={p.slope} width={64} height={40} />
                <span className="preset-text">
                  <span className="preset-name">{p.name}</span>
                  <span className="preset-rule">
                    {p.rule}（{SLOPE_NAMES[p.slope]}）
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
