"use client";
import type { Side } from "@/lib/game";
import { TeamIcon } from "@/components/TeamBadge";

// Kalenin kırılabilen parçaları, düşme sırasıyla: önce mazgallar (m…), arada duvarda delikler (h…).
const DAMAGE_ORDER = ["m1", "h1", "m6", "m9", "h2", "m3", "m11", "m7", "h3", "m4", "m2", "m10", "h4", "m5", "m8"];

const MERLONS: Record<string, [number, number, number, number]> = {
  m1: [4, 10, 8, 8], m2: [15, 10, 8, 8], m3: [26, 10, 8, 8],
  m4: [86, 10, 8, 8], m5: [97, 10, 8, 8], m6: [108, 10, 8, 8],
  m7: [37, 35, 6, 7], m8: [47, 35, 6, 7], m9: [57, 35, 6, 7], m10: [67, 35, 6, 7], m11: [77, 35, 6, 7],
};
const HOLES: Record<string, string> = {
  h1: "M12 34 l8 -3 l5 6 l-4 7 l-8 -1 z",
  h2: "M92 48 l9 -2 l4 8 l-6 6 l-8 -3 z",
  h3: "M44 52 l8 -1 l3 7 l-7 5 l-6 -4 z",
  h4: "M66 50 l7 1 l2 8 l-8 3 l-4 -6 z",
};

/** Kale çizimi. `hits` aldığı isabet, `target` yıkılması için gereken isabet. */
function Castle({ side, hits, target }: { side: Side; hits: number; target: number }) {
  const lost = new Set(DAMAGE_ORDER.slice(0, Math.min(DAMAGE_ORDER.length, Math.round((hits / target) * DAMAGE_ORDER.length))));
  const ratio = hits / target;
  const color = side === "left" ? "var(--left)" : "var(--right)";
  return (
    <svg viewBox="0 0 120 100" aria-hidden="true">
      {/* Kuleler ve sur */}
      <rect x="4" y="18" width="30" height="82" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
      <rect x="86" y="18" width="30" height="82" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
      <rect x="33" y="42" width="54" height="58" fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
      {/* Taş dokusu */}
      <path d="M4 40h30M4 62h30M4 84h30M86 40h30M86 62h30M86 84h30M33 60h54M33 80h54M19 18v22M101 18v22M60 42v18M48 60v20M72 60v20" stroke="#94a3b8" strokeWidth="1.2" />
      {/* Kapı ve pencereler */}
      <path d="M49 100v-20a11 11 0 0 1 22 0v20z" fill="#78350f" stroke="#451a03" strokeWidth="2" />
      <rect x="15" y="46" width="8" height="12" rx="4" fill="#334155" />
      <rect x="97" y="46" width="8" height="12" rx="4" fill="#334155" />
      {/* Bayrak */}
      <line x1="101" y1="10" x2="101" y2="-12" stroke="#334155" strokeWidth="2" />
      <path className="siege-flag" d="M101 -12h16l-5 5 5 5h-16z" fill={color} />
      {Object.entries(MERLONS).map(([id, [x, y, w, h]]) =>
        lost.has(id) ? null : <rect key={id} x={x} y={y} width={w} height={h} fill="#cbd5e1" stroke="#475569" strokeWidth="2" />,
      )}
      {Object.entries(HOLES).map(([id, d]) => (lost.has(id) ? <path key={id} d={d} fill="#1e293b" stroke="#0f172a" strokeWidth="1" /> : null))}
      {/* Çatlaklar hasar arttıkça çoğalır */}
      {ratio >= 0.25 && <path d="M24 100l-4-12 5-8-4-10" stroke="#1f2937" strokeWidth="1.6" fill="none" />}
      {ratio >= 0.5 && <path d="M80 42l-4 9 6 7-3 10" stroke="#1f2937" strokeWidth="1.6" fill="none" />}
      {ratio >= 0.75 && <path d="M108 100l3-14-6-9 4-12M40 42l3 10-5 8" stroke="#1f2937" strokeWidth="1.6" fill="none" />}
    </svg>
  );
}

/** Mancınık çizimi (sağa atar; sağ takımda aynalanır). */
function Catapult({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 60" aria-hidden="true" overflow="visible">
      <rect x="6" y="40" width="64" height="7" rx="2" fill="#92400e" stroke="#451a03" strokeWidth="1.5" />
      <path d="M30 41 L40 18 L50 41" fill="none" stroke="#78350f" strokeWidth="5" strokeLinejoin="round" />
      <g className="siege-arm">
        <line x1="40" y1="20" x2="6" y2="34" stroke="#a16207" strokeWidth="5" strokeLinecap="round" />
        <path d="M2 30a7 6 0 0 0 12 6" fill="none" stroke="#451a03" strokeWidth="3" />
      </g>
      <circle cx="40" cy="20" r="3.5" fill={color} stroke="#1f2937" strokeWidth="1" />
      <circle cx="18" cy="50" r="8" fill="#78350f" stroke="#451a03" strokeWidth="2" />
      <circle cx="58" cy="50" r="8" fill="#78350f" stroke="#451a03" strokeWidth="2" />
      <circle cx="18" cy="50" r="2" fill="#451a03" />
      <circle cx="58" cy="50" r="2" fill="#451a03" />
    </svg>
  );
}

/**
 * Kale yıkma sahnesi: iki takımın kalesi ve mancınığı. Doğru cevapta takımın mancınığı rakip kaleye taş atar,
 * kale isabet aldıkça parçalanır. Kazanan belli olunca kaybeden takımın kalesi yıkılır.
 */
export function SiegeStage({
  target,
  names,
  shots,
  winner,
}: {
  target: number;
  names: Record<Side, string>;
  /** Takımın attığı (isabet eden) taş sayısı = doğru cevap sayısı. */
  shots: Record<Side, number>;
  winner: Side | null;
}) {
  const hitsOn: Record<Side, number> = { left: shots.right, right: shots.left };
  const left = (side: Side) => Math.max(0, target - hitsOn[side]);
  return (
    <div
      className="tug-stage siege-stage"
      role="img"
      aria-label={
        winner
          ? `${names[winner]} kazandı; rakip takımın kalesi yıkıldı.`
          : `Kale yıkma: ${names.left} kalesinin ${left("left")}, ${names.right} kalesinin ${left("right")} taşlık dayanıklılığı kaldı.`
      }
      data-testid="siege-stage"
    >
      <div className="tug-title">KALE YIKMA · doğru cevap = mancınıkla taş!</div>
      {(["left", "right"] as Side[]).map((side) => (
        <div key={side} className="tug-label" style={side === "left" ? { left: 8 } : { right: 8, flexDirection: "row-reverse" }}>
          <span className={side === "left" ? "text-left" : "text-right"}>
            <TeamIcon side={side} size={24} />
          </span>
          <span>{names[side]}</span>
          <span className="siege-hp" title="Kale dayanıklılığı" data-testid={`siege-hp-${side}`}>
            <span style={{ width: `${(left(side) / target) * 100}%` }} />
          </span>
          <span className={`chip ${side === "left" ? "bg-left-soft text-left" : "bg-right-soft text-right"}`} data-testid={`siege-shots-${side}`}>
            {shots[side]}/{target} taş
          </span>
        </div>
      ))}

      {(["left", "right"] as Side[]).map((side) => {
        const lost = winner !== null && winner !== side;
        return (
          <div key={side} className={`siege-side siege-${side}`}>
            {/* İsabet alınca sarsılsın: anahtar her isabette değişir. */}
            <div key={`c${hitsOn[side]}`} className={`siege-castle ${hitsOn[side] > 0 && !lost ? "siege-hit" : ""} ${lost ? "siege-collapse" : ""} ${winner === side ? "siege-win" : ""}`}>
              <Castle side={side} hits={hitsOn[side]} target={target} />
            </div>
            {hitsOn[side] > 0 && <div key={`p${hitsOn[side]}`} className="siege-puff" />}
            {lost && <div className="siege-rubble" />}
            <div key={`a${shots[side]}`} className={`siege-catapult ${shots[side] > 0 ? "siege-fire" : ""}`}>
              <Catapult color={side === "left" ? "var(--left)" : "var(--right)"} />
            </div>
            {shots[side] > 0 && <div key={`s${shots[side]}`} className="siege-stone" />}
          </div>
        );
      })}
    </div>
  );
}
