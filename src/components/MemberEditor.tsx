import { LEVEL_NAMES, type Member } from "@/lib/split";

export function MemberEditor({
  member,
  canRemove,
  canAdd,
  onChange,
  onMove,
  onRemove,
  onAdd,
}: {
  member: Member;
  canRemove: boolean;
  canAdd: boolean;
  onChange: (patch: Partial<Member>) => void;
  onMove: (delta: 1 | -1) => void;
  onRemove: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="editor" aria-label="選んだ人の編集">
      <label className="editor-name">
        <span className="sr">名前</span>
        <input
          className="editor-input"
          value={member.name}
          placeholder="名前"
          maxLength={10}
          onChange={(e) => onChange({ name: e.target.value })}
        />
        <span className="editor-san">さん</span>
      </label>
      <div className="editor-level" role="group" aria-label="立場の段">
        <button type="button" className="ed-btn" onClick={() => onMove(-1)} disabled={member.level <= 1} aria-label="段を下げる">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
        </button>
        <span className="editor-levelname">{LEVEL_NAMES[member.level]}</span>
        <button type="button" className="ed-btn" onClick={() => onMove(1)} disabled={member.level >= 5} aria-label="段を上げる">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 10l5-5 5 5" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
        </button>
      </div>
      <label className="editor-guest">
        <input type="checkbox" checked={member.guest} onChange={(e) => onChange({ guest: e.target.checked })} />
        <span>主役（0円）</span>
      </label>
      {!member.guest && (
        <label className="editor-guest">
          <input type="checkbox" checked={member.paid} onChange={(e) => onChange({ paid: e.target.checked })} />
          <span>集金済み</span>
        </label>
      )}
      <div className="editor-actions">
        <button type="button" className="ed-text" onClick={onRemove} disabled={!canRemove}>
          外す
        </button>
        <button type="button" className="ed-text ed-add" onClick={onAdd} disabled={!canAdd}>
          ＋ 1人足す
        </button>
      </div>
    </div>
  );
}
