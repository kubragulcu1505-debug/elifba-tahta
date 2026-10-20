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

/**
 * Halat çekme sahnesi. Ortada bir çukur vardır; halat bir takıma çekildikçe diğer takım çukura yaklaşır.
 * Kazanan belli olunca kaybeden takımın çocukları sırayla çukura düşer, kazananlar sevinçle zıplar.
 */
export function RopeStage({
  rope,
  target,
  names,
  pulls,
  winner,
}: {
  rope: number;
  target: number;
  names: Record<Side, string>;
  pulls: Record<Side, number>;
  winner: Side | null;
}) {
  const pos = Math.max(-1, Math.min(1, rope / target));
  const leftNeed = target + rope;
  const rightNeed = target - rope;
  const teamClass = (side: Side, n: number) => {
    if (winner === side) return "tug-cheer";
    if (winner && winner !== side) return "tug-fall";
    return n > 0 ? "tug-pull" : "";
  };
  return (
    <div
      className="tug-stage"
      role="img"
      aria-label={
        winner
          ? `${names[winner]} kazandı; rakip takım ortadaki çukura düştü.`
          : `Halat çekme: ${names.left} kazanmak için ${leftNeed}, ${names.right} kazanmak için ${rightNeed} çekiş daha yapmalı.`
      }
      data-testid="tug-stage"
      data-rope={rope}
    >
      <div className="tug-title">HALAT ÇEKME · rakibi ortadaki çukura çekin!</div>
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
      <div className="tug-pit" aria-hidden="true">
        <div className="tug-pit-mud" />
      </div>
      <div className="tug-group" style={{ ["--pos" as string]: pos }}>
        <div className="tug-rope" />
        <div className="tug-flag" />
        <div key={`l${pulls.left}${winner ?? ""}`} className={teamClass("left", pulls.left)}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="tug-fig" style={{ left: `calc(-1 * (14vw + ${i * 5.2}vw))`, transform: "translateX(-100%)" }}>
              <div className="tug-body" style={{ ["--fallx" as string]: `${6 + i * 5.2}vw`, animationDelay: `${i * 160}ms` }}>
                <Kid color="var(--left)" skin={SKINS[i]} />
              </div>
            </div>
          ))}
        </div>
        <div key={`r${pulls.right}${winner ?? ""}`} className={teamClass("right", pulls.right)}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="tug-fig" style={{ left: `calc(14vw + ${i * 5.2}vw)`, transform: "scaleX(-1)" }}>
              <div className="tug-body" style={{ ["--fallx" as string]: `${6 + i * 5.2}vw`, animationDelay: `${i * 160}ms` }}>
                <Kid color="var(--right)" skin={SKINS[(i + 1) % 3]} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
