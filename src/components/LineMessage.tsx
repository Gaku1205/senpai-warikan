"use client";

import { useEffect, useRef, useState } from "react";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
}

export function LineMessage({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  // スマホの下の「コピー」の帯は、文面の欄に着くまでだけ出す（着いたら欄の中のボタンを使う）
  const [reached, setReached] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setReached(entry.isIntersecting || entry.boundingClientRect.top < 0);
      },
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  async function onCopy() {
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  const lineUrl = `https://line.me/R/share?text=${encodeURIComponent(text)}`;

  // 文面は「題と合計」「1人1行」「期限と端数」の3つの塊。1人1行の金額だけを金色の太字にする
  const [head = "", body = "", tail = ""] = text.split("\n\n");
  const rows = body.split("\n").filter(Boolean).map((line) => {
    const m = line.match(/^(.*?さん)\u3000([\d,]+円)(.*)$/);
    return m
      ? { who: m[1], amount: m[2], note: m[3], value: Number(m[2].replace(/[^\d]/g, "")) }
      : { who: line, amount: "", note: "", value: 0 };
  });
  const maxValue = Math.max(1, ...rows.map((r) => r.value));

  return (
    <section ref={ref} className="msg" aria-labelledby="msg-h">
      <div className="msg-in">
        <div className="msg-side">
          <h2 id="msg-h" className="msg-h">LINEに貼る文面</h2>
          <p className="msg-note">坂の上から順に1人1行。坂を動かすと、ここも変わります。</p>
          <div className="msg-actions">
            <button type="button" className="btn-gold" onClick={onCopy} aria-live="polite">
              {copied ? "コピーしました" : "文面をコピー"}
            </button>
            <a className="btn-line" href={lineUrl} target="_blank" rel="noopener noreferrer">
              LINEを開いて送る
            </a>
          </div>
        </div>
        <div className="msg-text" aria-label="文面">
          <p className="msg-head">
            {head.split("\n").map((l, i) => (
              <span key={i} className={i === 0 ? "msg-title" : "msg-sub"}>
                {l}
              </span>
            ))}
          </p>
          <ol className="msg-rows">
            {rows.map((r, i) => (
              <li key={i} className="msg-row">
                <span className="msg-who">{r.who}</span>
                <span className="msg-amount">{r.amount}</span>
                {r.value > 0 ? (
                  <span className="msg-bar" aria-hidden="true" style={{ width: `${(r.value / maxValue) * 100}%` }} />
                ) : (
                  <span className="msg-rownote">{r.note}</span>
                )}
              </li>
            ))}
          </ol>
          <p className="msg-tail">
            {tail.split("\n").map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </p>
        </div>
      </div>
      <div className={`dock${reached ? " is-away" : ""}`}>
        <button type="button" className="btn-gold dock-btn" onClick={onCopy}>
          {copied ? "コピーしました" : "LINEに貼る文面をコピー"}
        </button>
      </div>
    </section>
  );
}
