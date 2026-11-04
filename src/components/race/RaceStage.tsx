"use client";
// Cezalı araba yarışı sahnesi: iki şeritli pist, basamak çizgileri ve damalı bitiş çizgisi.
// Doğru cevapta araba bir basamak ilerler; arka arkaya 3 yanlışta bir basamak geri gider.
import type { DuelPlayer, Side } from "@/lib/game";
import type { Racer } from "@/lib/tug";
import { SideIcon } from "@/components/PlayerAvatar";
import { Car } from "./Car";

/** Pistin sahne içindeki yatay sınırları (yüzde). */
const START = 19;
const FINISH = 92;

export function RaceStage({
  names,
  players,
  racers,
  pos,
  streak,
  backKey,
  target,
  winner,
}: {
  names: Record<Side, string>;
  players?: Record<Side, DuelPlayer>;
  racers?: Record<Side, Racer>;
  pos: Record<Side, number>;
  streak: Record<Side, number>;
  /** Geri gitme anında değişen anahtar (sarsılma animasyonu için). */
  backKey: Record<Side, string>;
  target: number;
  winner: Side | null;
}) {
  const x = (p: number) => START + (Math.min(p, target) / target) * (FINISH - START);
  return (
    <div
      className="tug-stage race-stage"
      role="img"
      aria-label={winner ? `${names[winner]} bitiş çizgisine ulaştı.` : `Araba yarışı: ${names.left} ${pos.left}, ${names.right} ${pos.right} basamakta. Bitiş ${target}.`}
      data-testid="race-stage"
    >
      <div className="race-steps" style={{ left: `${START}%`, width: `${FINISH - START}%` }} aria-hidden="true">
        {Array.from({ length: target + 1 }, (_, i) => (
          <span key={i} style={{ left: `${(i / target) * 100}%` }}>
            {i > 0 && i < target && i % 5 === 0 ? i : ""}
          </span>
        ))}
      </div>
      <div className="race-finish" style={{ left: `${FINISH}%` }} aria-hidden="true" />
      <div className="race-startline" style={{ left: `${START}%` }} aria-hidden="true" />
      {(["left", "right"] as Side[]).map((side, lane) => {
        const r = racers?.[side];
        return (
          <div key={side} className={`race-lane lane-${lane}`}>
            <div className="race-name">
              <SideIcon side={side} size={18} player={players?.[side]} /> {names[side]}
              <span className="race-count" data-testid={`race-pos-${side}`}>
                🏁 {pos[side]}/{target}
              </span>
              {streak[side] > 0 && !winner && (
                <span className="race-warn" data-testid={`race-streak-${side}`}>
                  ⚠ {streak[side]}/3
                </span>
              )}
            </div>
            <div
              className={`race-car ${winner === side ? "won" : ""}`}
              style={{ left: `${x(pos[side])}%` }}
              data-testid={`race-car-${side}`}
            >
              <div key={backKey[side]} className={backKey[side] ? "race-back" : ""}>
                <Car type={r?.car ?? "racer"} color={r?.color ?? (side === "left" ? "#3b82f6" : "#f97316")} number={r?.number ?? ""} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
