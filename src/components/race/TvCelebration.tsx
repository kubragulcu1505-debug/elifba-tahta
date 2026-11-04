"use client";
// Kazanan takım televizyonda kupayı gösterir (çocukların çizimindeki gibi): eski tip bir televizyon,
// ekranda kupayı kaldıran oyuncu, altta kayan "CANLI" spiker bandı ve konfeti.
import type { ReactNode } from "react";
import { Confetti, Trophy } from "@/components/Celebration";

export function TvCelebration({ winnerName, color, children }: { winnerName: string; color: string; children?: ReactNode }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-ink/55 p-4" data-testid="tv-celebration">
      <Confetti />
      <div className="tv anim-pop">
        <div className="tv-antenna" aria-hidden="true" />
        <div className="tv-screen">
          <div className="tv-live">● CANLI</div>
          <div className="tv-champ">
            <svg viewBox="0 0 80 110" className="tv-kid" aria-hidden="true">
              <circle cx="40" cy="38" r="12" fill="#f1c27d" stroke="#1f2937" strokeWidth="2" />
              <circle cx="36" cy="36" r="1.8" fill="#1f2937" />
              <circle cx="44" cy="36" r="1.8" fill="#1f2937" />
              <path d="M34 42 Q40 48 46 42" stroke="#1f2937" strokeWidth="2" fill="none" strokeLinecap="round" />
              <rect x="28" y="50" width="24" height="30" rx="7" fill={color} stroke="#1f2937" strokeWidth="2" />
              <line x1="30" y1="54" x2="16" y2="22" stroke="#1f2937" strokeWidth="5" strokeLinecap="round" />
              <line x1="50" y1="54" x2="64" y2="22" stroke="#1f2937" strokeWidth="5" strokeLinecap="round" />
              <line x1="34" y1="80" x2="30" y2="106" stroke="#1f2937" strokeWidth="5" strokeLinecap="round" />
              <line x1="46" y1="80" x2="50" y2="106" stroke="#1f2937" strokeWidth="5" strokeLinecap="round" />
            </svg>
            <div className="tv-cup">
              <Trophy size={70} />
            </div>
          </div>
          <div className="tv-ticker">
            <span>🏆 ŞAMPİYON: {winnerName.toLocaleUpperCase("tr")}! · Tebrikler! · 🏆 ŞAMPİYON: {winnerName.toLocaleUpperCase("tr")}! · Tebrikler! ·</span>
          </div>
        </div>
        <div className="tv-stand" aria-hidden="true" />
      </div>
      {children}
    </div>
  );
}
