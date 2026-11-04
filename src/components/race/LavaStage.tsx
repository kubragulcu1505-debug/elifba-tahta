"use client";
// Lava düşme sahnesi: her takımın oyuncusu bir ipe asılı, altta kaynayan lav. Her yanlış cevap ipi uzatır ve
// oyuncuyu lava yaklaştırır; hakkı biten takım lava düşer. (Çocukların çizimindeki gibi.)
import type { DuelPlayer, Side } from "@/lib/game";
import { SideIcon } from "@/components/PlayerAvatar";

/** Asılı oyuncu (çöp adam), iki eliyle ipe tutunur. */
export function HangingKid({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 60 100" aria-hidden="true" overflow="visible">
      <line x1="30" y1="0" x2="30" y2="10" stroke="#78350f" strokeWidth="3" />
      <line x1="30" y1="10" x2="18" y2="30" stroke="#1f2937" strokeWidth="5" strokeLinecap="round" />
      <line x1="30" y1="10" x2="42" y2="30" stroke="#1f2937" strokeWidth="5" strokeLinecap="round" />
      <circle cx="30" cy="38" r="11" fill="#f1c27d" stroke="#1f2937" strokeWidth="2" />
      <circle cx="26" cy="37" r="1.6" fill="#1f2937" />
      <circle cx="34" cy="37" r="1.6" fill="#1f2937" />
      <path d="M25 42 Q30 46 35 42" stroke="#1f2937" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <rect x="20" y="48" width="20" height="24" rx="6" fill={color} stroke="#1f2937" strokeWidth="2" />
      <line x1="25" y1="72" x2="20" y2="94" stroke="#1f2937" strokeWidth="5" strokeLinecap="round" />
      <line x1="35" y1="72" x2="40" y2="94" stroke="#1f2937" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function LavaStage({
  names,
  players,
  wrong,
  lives,
  winner,
}: {
  names: Record<Side, string>;
  players?: Record<Side, DuelPlayer>;
  wrong: Record<Side, number>;
  lives: number;
  winner: Side | null;
}) {
  const color = (side: Side) => (side === "left" ? "var(--left)" : "var(--right)");
  // İp uzunluğu (sahne yüksekliğine göre %): yanlış arttıkça oyuncu lava iner.
  const drop = (side: Side) => 4 + (Math.min(wrong[side], lives - 1) / Math.max(1, lives - 1)) * 34;
  return (
    <div
      className="tug-stage lava-stage"
      role="img"
      aria-label={winner ? `${names[winner]} kazandı; rakip takım lava düştü.` : `Lava düşme: ${names.left} ${lives - wrong.left}, ${names.right} ${lives - wrong.right} hak.`}
      data-testid="lava-stage"
    >
      <div className="tug-title">LAVA DÜŞME · yanlış cevap ipi uzatır!</div>
      {(["left", "right"] as Side[]).map((side) => (
        <div key={side} className="tug-label" style={side === "left" ? { left: 8 } : { right: 8, flexDirection: "row-reverse" }}>
          <span className={side === "left" ? "text-left" : "text-right"}>
            <SideIcon side={side} size={24} player={players?.[side]} />
          </span>
          <span>{names[side]}</span>
          <span className="lava-hearts" data-testid={`lava-lives-${side}`} aria-label={`${lives - wrong[side]} hak`}>
            {Array.from({ length: lives }, (_, i) => (
              <span key={i} className={i < lives - wrong[side] ? "on" : ""}>
                ♥
              </span>
            ))}
          </span>
        </div>
      ))}
      <div className="lava-beam" aria-hidden="true" />
      <div className="lava-pool" aria-hidden="true">
        <span className="bubble b1" />
        <span className="bubble b2" />
        <span className="bubble b3" />
        <span className="bubble b4" />
      </div>
      {(["left", "right"] as Side[]).map((side) => {
        const lost = winner !== null && winner !== side;
        return (
          <div
            key={side}
            className={`lava-hanger ${lost ? "lava-fall" : ""} ${winner === side ? "lava-cheer" : ""}`}
            style={{ left: side === "left" ? "30%" : "70%" }}
            data-testid={`lava-kid-${side}`}
          >
            <div className="lava-rope" style={{ height: `${drop(side)}%` }} />
            <div className="lava-kid" style={{ top: `${drop(side) + 18}%` }}>
              <HangingKid color={color(side)} />
            </div>
            {lost && <div className="lava-splash" style={{ top: "70%" }} />}
          </div>
        );
      })}
    </div>
  );
}
