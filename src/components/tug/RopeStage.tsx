"use client";
import type { Side } from "@/lib/game";
import { TeamIcon } from "@/components/TeamBadge";

/** Halatı tutan çocuk figürü (sağa bakar; sağ takımda aynalanır). */
function Kid({ color, skin }: { color: string; skin: string }) {
  return (
    <svg viewBox="0 0 60 90" aria-hidden="true">
      <line x1="27" y1="58" x2="15" y2="86" stroke="#334155" strokeWidth="7" strokeLinecap="round" />
      <line x1="27" y1="58" x2="37" y2="86" stroke="#334155" strokeWidth="7" strokeLinecap="round" />
      <line x1="24" y1="27" x2="27" y2="58" stroke={color} strokeWidth="15" strokeLinecap="round" />
      <line x1="26" y1="35" x2="58" y2="50" stroke={color} strokeWidth="7" strokeLinecap="round" />
      <circle cx="58" cy="50" r="4" fill={skin} />
      <circle cx="22" cy="14" r="11" fill={skin} />
      <circle cx="26" cy="12" r="1.6" fill="#1f2430" />
    </svg>
  );
}

const SKINS = ["#f1c27d", "#e0ac69", "#c68642"];

export function RopeStage({
  rope,
  target,
  names,
  pulls,
}: {
  rope: number;
  target: number;
  names: Record<Side, string>;
  pulls: Record<Side, number>;
}) {
  const pos = Math.max(-1, Math.min(1, rope / target));
  const leftNeed = target + rope; // sol takımın kazanması için kalan çekiş
  const rightNeed = target - rope;
  return (
    <div
      className="tug-stage"
      role="img"
      aria-label={`Halat çekme: ${names.left} kazanmak için ${leftNeed}, ${names.right} kazanmak için ${rightNeed} çekiş daha yapmalı.`}
      data-testid="tug-stage"
      data-rope={rope}
    >
      <div className="tug-title">HALAT ÇEKME · bayrağı kendi çizginize çekin</div>
      <div className="tug-label" style={{ left: 8 }}>
        <span className="text-left">
          <TeamIcon side="left" size={24} />
        </span>
        <span>{names.left}</span>
        <span className="chip bg-left-soft text-left" data-testid="tug-pulls-left">{pulls.left} çekiş</span>
      </div>
      <div className="tug-label" style={{ right: 8 }}>
        <span className="chip bg-right-soft text-right" data-testid="tug-pulls-right">{pulls.right} çekiş</span>
        <span>{names.right}</span>
        <span className="text-right">
          <TeamIcon side="right" size={24} />
        </span>
      </div>
      <div className="tug-goal left" aria-hidden="true" />
      <div className="tug-goal right" aria-hidden="true" />
      <div className="tug-line" aria-hidden="true" />
      <div className="tug-group" style={{ ["--pos" as string]: pos }}>
        <div className="tug-rope" />
        <div className="tug-flag" />
        <div key={`l${pulls.left}`} className={pulls.left > 0 ? "tug-pull" : ""}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="tug-fig" style={{ left: `calc(-1 * (12vw + ${i * 5.2}vw))`, transform: "translateX(-100%)" }}>
              <Kid color="var(--left)" skin={SKINS[i]} />
            </div>
          ))}
        </div>
        <div key={`r${pulls.right}`} className={pulls.right > 0 ? "tug-pull" : ""}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="tug-fig" style={{ left: `calc(12vw + ${i * 5.2}vw)`, transform: "scaleX(-1)" }}>
              <Kid color="var(--right)" skin={SKINS[(i + 1) % 3]} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
