import { type Slope, weightOf, type Level } from "@/lib/split";

const LEVELS: Level[] = [5, 4, 3, 2, 1];

/** 坂の急さを、5段の柱の形で描く（計算と同じ倍率から）。outline は線だけで描く（選ばれていない坂） */
export function SlopeGlyph({
  slope,
  width = 40,
  height = 24,
  outline = false,
}: {
  slope: Slope;
  width?: number;
  height?: number;
  outline?: boolean;
}) {
  const ws = LEVELS.map((l) => weightOf(l, slope));
  const max = weightOf(5, "steep");
  const bw = width / LEVELS.length;
  const sw = outline ? 1.5 : 0;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="glyph">
      {ws.map((w, i) => {
        const h = Math.max(2, (w / max) * height) - sw;
        return (
          <rect
            key={i}
            x={i * bw + 0.5 + sw / 2}
            y={height - h - sw / 2}
            width={bw - 2 - sw}
            height={h}
            fill={outline ? "none" : "currentColor"}
            stroke={outline ? "currentColor" : "none"}
            strokeWidth={sw}
          />
        );
      })}
    </svg>
  );
}
