"use client";
// Penaltı sahnesi: ortada kale ve otomatik atlayan kaleci, önde top. İki taraf da aynı kaleye vurur.
import type { DuelPlayer, Side } from "@/lib/game";
import type { Kick, PenaltyPhase, ShotResult } from "@/lib/penalty";
import { SideIcon } from "@/components/PlayerAvatar";

// Sahne içinde yüzde konumlar (sol, üst). Kale: soldan %33, genişlik %34; üstten %24, yükseklik %62.
const GOAL = { left: 33, width: 34, top: 24, height: 62 };
const SPOT = { x: 50, y: 92 };

/** Vuruşun sahnedeki hedef noktası. */
export function kickTarget(k: Kick): { x: number; y: number } {
  if (k.out === "short") return { x: 50, y: 84 };
  const x = k.out === "wide" ? 50 + k.col * (GOAL.width / 2 + 7) : GOAL.left + GOAL.width * (0.5 + k.col * 0.33);
  const y = k.out === "over" ? GOAL.top - 12 : GOAL.top + GOAL.height * (k.row === 1 ? 0.27 : 0.74);
  return { x, y };
}

export function shotText(shot: ShotResult): string {
  if (shot.goal) return "⚽ GOL!";
  if (shot.kick.out === "wide") return "Auta gitti!";
  if (shot.kick.out === "over") return "Üstten dışarı!";
  if (shot.kick.out === "short") return "Top kaleye ulaşmadı";
  return "🧤 Kaleci kurtardı!";
}

function Keeper() {
  return (
    <svg viewBox="0 0 60 80" aria-hidden="true">
      <line x1="24" y1="56" x2="16" y2="78" stroke="#111827" strokeWidth="7" strokeLinecap="round" />
      <line x1="36" y1="56" x2="44" y2="78" stroke="#111827" strokeWidth="7" strokeLinecap="round" />
      <rect x="17" y="24" width="26" height="34" rx="8" fill="#16a34a" stroke="#14532d" strokeWidth="2" />
      <line x1="19" y1="30" x2="4" y2="14" stroke="#16a34a" strokeWidth="7" strokeLinecap="round" />
      <line x1="41" y1="30" x2="56" y2="14" stroke="#16a34a" strokeWidth="7" strokeLinecap="round" />
      <circle cx="4" cy="13" r="5" fill="#facc15" stroke="#a16207" strokeWidth="1.5" />
      <circle cx="56" cy="13" r="5" fill="#facc15" stroke="#a16207" strokeWidth="1.5" />
      <circle cx="30" cy="14" r="10" fill="#f1c27d" />
      <circle cx="26" cy="13" r="1.6" fill="#1f2430" />
      <circle cx="34" cy="13" r="1.6" fill="#1f2430" />
    </svg>
  );
}

export function PenaltyStage({
  names,
  players,
  goals,
  target,
  phase,
  shooter,
  shot,
  aim,
  winner,
}: {
  names: Record<Side, string>;
  players?: Record<Side, DuelPlayer>;
  goals: Record<Side, number>;
  target: number;
  phase: PenaltyPhase;
  shooter: Side | null;
  shot: ShotResult | null;
  /** Kaydırılırken topun gideceği yer (önizleme). */
  aim: Kick | null;
  winner: Side | null;
}) {
  const showShot = shot && (phase === "flying" || phase === "result" || phase === "finished");
  const ball = showShot ? kickTarget(shot.kick) : SPOT;
  const keeperX = showShot ? GOAL.left + GOAL.width * (0.5 + shot.keeperCol * 0.3) : 50;
  const keeperRot = showShot ? shot.keeperCol * 62 : 0;
  const aimAt = aim && !showShot ? kickTarget(aim) : null;
  const color = (side: Side) => (side === "left" ? "var(--left)" : "var(--right)");

  return (
    <div
      className="tug-stage pen-stage"
      role="img"
      aria-label={winner ? `${names[winner]} kazandı.` : `Penaltı: ${names.left} ${goals.left}, ${names.right} ${goals.right} gol. Kazanmak için ${target} gol.`}
      data-testid="penalty-stage"
    >
      <div className="tug-title">PENALTI · ilk doğru cevap penaltıyı kullanır!</div>
      {(["left", "right"] as Side[]).map((side) => (
        <div key={side} className="tug-label" style={side === "left" ? { left: 8 } : { right: 8, flexDirection: "row-reverse" }}>
          <span className={side === "left" ? "text-left" : "text-right"}>
            <SideIcon side={side} size={24} player={players?.[side]} />
          </span>
          <span>{names[side]}</span>
          <span className="pen-balls" aria-hidden="true">
            {Array.from({ length: target }, (_, i) => (
              <span key={i} className={i < goals[side] ? "on" : ""} />
            ))}
          </span>
          <span className={`chip ${side === "left" ? "bg-left-soft text-left" : "bg-right-soft text-right"}`} data-testid={`pen-goals-${side}`}>
            ⚽ {goals[side]}/{target}
          </span>
        </div>
      ))}

      <div className="pen-goal" style={{ left: `${GOAL.left}%`, width: `${GOAL.width}%`, top: `${GOAL.top}%`, height: `${GOAL.height}%` }}>
        {shot?.goal && showShot && phase !== "flying" && <div key={`n${shot.shooter}${goals[shot.shooter]}`} className="pen-net-shake" />}
      </div>
      {aimAt && <span className="pen-aim" style={{ left: `${aimAt.x}%`, top: `${aimAt.y}%`, borderColor: shooter ? color(shooter) : undefined }} data-testid="pen-aim" />}
      <div
        className="pen-keeper"
        style={{ left: `${keeperX}%`, transform: `translateX(-50%) rotate(${keeperRot}deg)` }}
        data-testid="pen-keeper"
        data-col={showShot ? shot.keeperCol : ""}
      >
        <Keeper />
      </div>
      <span className="pen-spot" style={{ left: `${SPOT.x}%`, top: `${SPOT.y}%` }} />
      <span
        className={`pen-ball ${showShot ? "kicked" : ""}`}
        style={{ left: `${ball.x}%`, top: `${ball.y}%`, boxShadow: shooter ? `0 0 0 3px ${color(shooter)}` : undefined }}
        data-testid="pen-ball"
      />
      {shooter && phase === "kick" && (
        <div className={`pen-kicker ${shooter}`}>
          <SideIcon side={shooter} size={20} player={players?.[shooter]} /> {names[shooter]} vuruyor
        </div>
      )}
      {shot && (phase === "result" || phase === "finished") && (
        <div key={`r${shot.shooter}${goals.left}${goals.right}`} className={`pen-banner ${shot.goal ? "goal" : "miss"}`} data-testid="pen-banner">
          {shotText(shot)}
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
