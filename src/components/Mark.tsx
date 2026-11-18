/** サービスの印：3段の坂。いちばん上の段だけ金色 */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true" className="mark">
      <rect x="1" y="17" width="8" height="10" fill="currentColor" />
      <rect x="10" y="11" width="8" height="16" fill="currentColor" />
      <rect x="19" y="3" width="8" height="24" fill="#F2B400" />
    </svg>
  );
}
