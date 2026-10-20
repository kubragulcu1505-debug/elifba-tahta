// Kazanma kutlaması: konfeti ve kupa. Hareket azaltma tercihinde konfeti gösterilmez (globals.css).
import { mulberry32 } from "@/lib/rng";

const COLORS = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#a855f7", "#ec4899", "#facc15", "#14b8a6"];

// Parçalar sabit tohumla bir kez üretilir (render sırasında rastgelelik yok).
const PIECES = (() => {
  const r = mulberry32(20261020);
  return Array.from({ length: 150 }, (_, i) => ({
    left: r() * 100,
    delay: r() * 1.4,
    dur: 2.8 + r() * 2.2,
    size: 8 + r() * 10,
    color: COLORS[i % COLORS.length],
    rot: Math.round(r() * 360),
    drift: (r() - 0.5) * 24,
    round: r() < 0.3,
  }));
})();

export function Confetti() {
  return (
    <div className="confetti" aria-hidden="true" data-testid="confetti">
      {PIECES.map((p, i) => (
        <span
          key={i}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.45,
            background: p.color,
            borderRadius: p.round ? "50%" : 2,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            ["--drift" as string]: `${p.drift}vw`,
            ["--rot" as string]: `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  );
}

export function Trophy({ size = 84 }: { size?: number }) {
  return (
    <svg className="trophy-bounce" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M18 8h28v10c0 9-6 16-14 16S18 27 18 18z" fill="#facc15" stroke="#a16207" strokeWidth="2" />
      <path d="M18 12H9c0 8 4 13 10 14M46 12h9c0 8-4 13-10 14" fill="none" stroke="#a16207" strokeWidth="3" strokeLinecap="round" />
      <rect x="28" y="34" width="8" height="10" fill="#eab308" stroke="#a16207" strokeWidth="2" />
      <rect x="20" y="44" width="24" height="8" rx="2" fill="#a16207" />
      <path d="M27 16l3 2-1 4 3-2 3 2-1-4 3-2h-4l-1-3-1 3z" fill="#fff7cc" />
    </svg>
  );
}
