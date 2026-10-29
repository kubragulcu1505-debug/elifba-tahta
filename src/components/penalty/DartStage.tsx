"use client";
// Dart sahnesi: ortada halkalı dart tahtası. Atış sırası gelen öğrenci için tahtada bir çizgi gidip gelir;
// "DUR" denince ok çizginin olduğu yere saplanır. Kırmızı merkez 10 puan, dışa doğru 7, 5, 3, 1.
import { useEffect, useRef } from "react";
import type { DuelPlayer, Side } from "@/lib/game";
import { DART_RINGS, sweepPos, type PenaltyPhase, type ShotResult } from "@/lib/penalty";
import { SideIcon } from "@/components/PlayerAvatar";

const RING_COLORS = ["#dc2626", "#facc15", "#3b82f6", "#22c55e", "#f8fafc"];
/** Tahtanın yarıçapı, çizimin genişliğine oranla (viewBox -105…105, yarıçap 100). */
const R_PCT = (100 / 210) * 100;
const xPct = (pos: number) => 50 + pos * R_PCT;

/** Halkalı tahta (merkezden dışa: 10, 7, 5, 3, 1). */
export function DartBoard() {
  const rings = [...DART_RINGS].reverse();
  return (
    <svg viewBox="-105 -105 210 210" aria-hidden="true">
      {rings.map((r, i) => (
        <circle key={r.points} r={r.upTo * 100} fill={RING_COLORS[rings.length - 1 - i]} stroke="#1f2937" strokeWidth="2.5" />
      ))}
      {DART_RINGS.slice(1).map((r, i) => (
        <text key={r.points} x={((DART_RINGS[i].upTo + r.upTo) / 2) * 100} y="5" textAnchor="middle" fontSize="13" fontWeight="900" fill="#1f2937">
          {r.points}
        </text>
      ))}
      <text x="0" y="4.5" textAnchor="middle" fontSize="9" fontWeight="900" fill="#fff">
        10
      </text>
    </svg>
  );
}

export function dartText(shot: ShotResult): string {
  const p = shot.dart?.points ?? 0;
  if (p === 10) return "🎯 Tam isabet! 10 puan";
  if (p === 0) return "Tahtayı ıskaladı";
  return `🎯 ${p} puan`;
}

/** Gidip gelen çizgi: her karede konumu günceller (render sırasında zaman okunmaz). */
function SweepLine({ aimStart, frozenAt, side }: { aimStart: number; frozenAt: number | null; side: Side }) {
  const el = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const place = () => {
      const t = (frozenAt ?? performance.now()) - aimStart;
      if (el.current) el.current.style.left = `${xPct(sweepPos(t))}%`;
    };
    const tick = () => {
      place();
      raf = requestAnimationFrame(tick);
    };
    place();
    if (frozenAt === null) raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [aimStart, frozenAt]);
  return <span ref={el} className={`dart-line ${side}`} data-testid="dart-line" />;
}

export function DartStage({
  names,
  players,
  scores,
  target,
  phase,
  shooter,
  shot,
  aimStart,
  pausedAt,
  winner,
}: {
  names: Record<Side, string>;
  players?: Record<Side, DuelPlayer>;
  scores: Record<Side, number>;
  target: number;
  phase: PenaltyPhase;
  shooter: Side | null;
  shot: ShotResult | null;
  aimStart: number;
  /** Duraklatılmışsa çizgi bu anda donar. */
  pausedAt: number | null;
  winner: Side | null;
}) {
  const showShot = shot?.dart && (phase === "flying" || phase === "result" || phase === "finished");
  return (
    <div
      className="tug-stage pen-stage dart-stage"
      role="img"
      aria-label={winner ? `${names[winner]} kazandı.` : `Dart: ${names.left} ${scores.left}, ${names.right} ${scores.right} puan. Kazanmak için ${target} puan.`}
      data-testid="dart-stage"
    >
      <div className="tug-title">DART · çizgi kırmızıdayken DUR!</div>
      {(["left", "right"] as Side[]).map((side) => (
        <div key={side} className="tug-label" style={side === "left" ? { left: 8 } : { right: 8, flexDirection: "row-reverse" }}>
          <span className={side === "left" ? "text-left" : "text-right"}>
            <SideIcon side={side} size={24} player={players?.[side]} />
          </span>
          <span>{names[side]}</span>
          <span className="siege-hp dart-bar" title="Puan" aria-hidden="true">
            <span style={{ width: `${Math.min(100, (scores[side] / target) * 100)}%` }} />
          </span>
          <span className={`chip ${side === "left" ? "bg-left-soft text-left" : "bg-right-soft text-right"}`} data-testid={`dart-score-${side}`}>
            🎯 {scores[side]}/{target}
          </span>
        </div>
      ))}

      <div className="dart-board">
        <DartBoard />
        {phase === "kick" && shooter && <SweepLine aimStart={aimStart} frozenAt={pausedAt} side={shooter} />}
        {showShot && (
          <span key={`${shot.shooter}${scores.left}${scores.right}${phase}`} className={`dart-arrow ${shot.shooter}`} style={{ left: `${xPct(shot.dart!.pos)}%` }} data-testid="dart-arrow">
            <svg viewBox="0 0 20 60" aria-hidden="true">
              <line x1="10" y1="2" x2="10" y2="46" stroke="#1f2937" strokeWidth="3" />
              <path d="M10 0 L6 9 L14 9 Z" fill="#1f2937" />
              <path d="M10 44 L2 58 L10 52 L18 58 Z" fill={shot.shooter === "left" ? "var(--left)" : "var(--right)"} />
            </svg>
          </span>
        )}
      </div>
      {shooter && phase === "kick" && (
        <div className={`pen-kicker ${shooter}`}>
          <SideIcon side={shooter} size={20} player={players?.[shooter]} /> {names[shooter]} atıyor
        </div>
      )}
      {showShot && phase !== "flying" && (
        <div key={`r${scores.left}${scores.right}`} className={`pen-banner ${shot.dart!.points > 0 ? "goal" : "miss"}`} data-testid="pen-banner">
          {dartText(shot)}
        </div>
      )}
      {!shot && phase === "result" && (
        <div className="pen-banner miss" data-testid="pen-banner">
          ⏰ Süre doldu!
        </div>
      )}
    </div>
  );
}
