"use client";
import { Fragment, useEffect, useRef } from "react";
import type { DuelPlayer, Side } from "@/lib/game";
import { pointAt, toStagePct, toWorld, type Pt, type Rect, type Shot } from "@/lib/ballistics";
import { SideIcon } from "@/components/PlayerAvatar";

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

/** Mancınık çizimi (sağa atar; sağ takımda aynalanır). Nişan alınırken kol geriye gerilir (cock 0–1). */
function Catapult({ color, cock = 0 }: { color: string; cock?: number }) {
  return (
    <svg viewBox="0 0 80 60" aria-hidden="true" overflow="visible">
      <rect x="6" y="40" width="64" height="7" rx="2" fill="#92400e" stroke="#451a03" strokeWidth="1.5" />
      <path d="M30 41 L40 18 L50 41" fill="none" stroke="#78350f" strokeWidth="5" strokeLinejoin="round" />
      <g className="siege-arm" style={{ transform: `rotate(${-cock * 28}deg)` }}>
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

/** Havadaki taş: uçuş boyunca konumu her karede güncellenir; yere ya da kaleye değince bildirir. */
function FlyingStone({ flight, onDone }: { flight: Flight; onDone: () => void }) {
  const el = useRef<HTMLDivElement>(null);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);
  useEffect(() => {
    let raf = 0;
    let finished = false;
    const tick = () => {
      const t = (performance.now() - flight.startedAt) / 1000;
      const p = toStagePct(pointAt(flight.shot, t));
      if (el.current) {
        el.current.style.left = `${p.left}%`;
        el.current.style.top = `${p.top}%`;
      }
      if (t >= flight.shot.duration) {
        if (!finished) {
          finished = true;
          done.current();
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Sekme arka plandayken kare çizilmez; uçuş yine de zamanında sonuçlansın.
    const safety = setTimeout(() => {
      if (!finished) {
        finished = true;
        done.current();
      }
    }, flight.shot.duration * 1000 + 600);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(safety);
    };
  }, [flight]);
  const p0 = toStagePct(flight.shot.points[0]);
  return <div ref={el} className="siege-stone" style={{ left: `${p0.left}%`, top: `${p0.top}%` }} data-testid="siege-stone" />;
}

export interface Flight {
  id: number;
  shot: Shot;
  startedAt: number;
}

export interface Impact {
  id: number;
  at: Pt;
  hit: boolean;
}

/** Nişan için sahne ölçüleri: taşın çıkış noktası ve rakip kalenin isabet kutusu (dünya koordinatı). */
export type SiegeGeometry = (side: Side) => { start: Pt; target: Rect } | null;

/**
 * Kale yıkma sahnesi: iki tarafın kalesi ve mancınığı. Doğru cevaptan sonra öğrenci kendi alanında
 * mancınığı çekip bırakır; taş gerçek bir yay çizerek uçar, kaleye değerse kale parçalanır.
 * Kazanan belli olunca kaybedenin kalesi yıkılır.
 */
export function SiegeStage({
  target,
  names,
  hits,
  winner,
  players,
  cock,
  preview,
  flights,
  impacts,
  onLanded,
  geometryRef,
}: {
  target: number;
  names: Record<Side, string>;
  players?: Record<Side, DuelPlayer>;
  /** Tarafın rakip kaleye isabet ettirdiği taş sayısı. */
  hits: Record<Side, number>;
  winner: Side | null;
  /** Nişan alınırken mancınığın gerilmesi (0–1). */
  cock: Record<Side, number>;
  /** Nişan çizgisinin noktaları (dünya koordinatı). */
  preview: Record<Side, Pt[]>;
  flights: Record<Side, Flight | null>;
  impacts: Record<Side, Impact | null>;
  onLanded: (side: Side) => void;
  geometryRef: { current: SiegeGeometry | null };
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const catapults = useRef<Record<Side, HTMLDivElement | null>>({ left: null, right: null });
  const castles = useRef<Record<Side, HTMLDivElement | null>>({ left: null, right: null });
  const hitsOn: Record<Side, number> = { left: hits.right, right: hits.left };
  const left = (side: Side) => Math.max(0, target - hitsOn[side]);

  useEffect(() => {
    geometryRef.current = (side) => {
      const st = stageRef.current?.getBoundingClientRect();
      const cat = catapults.current[side]?.getBoundingClientRect();
      const castle = castles.current[side === "left" ? "right" : "left"]?.getBoundingClientRect();
      if (!st || !cat || !castle || st.width === 0) return null;
      // Taş, mancınığın kolunun ucundan (öne bakan üst köşe) çıkar.
      const startPx = { x: side === "left" ? cat.left + cat.width * 0.75 : cat.right - cat.width * 0.75, y: cat.top + cat.height * 0.15 };
      const a = toWorld({ x: castle.left, y: castle.top + castle.height * 0.1 }, st);
      const b = toWorld({ x: castle.right, y: castle.bottom }, st);
      return { start: toWorld(startPx, st), target: { x0: a.x, x1: b.x, y0: 0, y1: a.y } };
    };
    return () => {
      geometryRef.current = null;
    };
  }, [geometryRef]);

  return (
    <div
      ref={stageRef}
      className="tug-stage siege-stage"
      role="img"
      aria-label={
        winner
          ? `${names[winner]} kazandı; rakip kale yıkıldı.`
          : `Kale yıkma: ${names.left} kalesinin ${left("left")}, ${names.right} kalesinin ${left("right")} taşlık dayanıklılığı kaldı.`
      }
      data-testid="siege-stage"
    >
      <div className="tug-title">KALE YIKMA · doğru cevap → mancınığı çek, bırak!</div>
      {(["left", "right"] as Side[]).map((side) => (
        <div key={side} className="tug-label" style={side === "left" ? { left: 8 } : { right: 8, flexDirection: "row-reverse" }}>
          <span className={side === "left" ? "text-left" : "text-right"}>
            <SideIcon side={side} size={24} player={players?.[side]} />
          </span>
          <span>{names[side]}</span>
          <span className="siege-hp" title="Kale dayanıklılığı" data-testid={`siege-hp-${side}`}>
            <span style={{ width: `${(left(side) / target) * 100}%` }} />
          </span>
          <span className={`chip ${side === "left" ? "bg-left-soft text-left" : "bg-right-soft text-right"}`} data-testid={`siege-shots-${side}`}>
            🎯 {hits[side]}/{target}
          </span>
        </div>
      ))}

      {(["left", "right"] as Side[]).map((side) => {
        const lost = winner !== null && winner !== side;
        const flightId = flights[side]?.id ?? 0;
        return (
          <div key={side} className={`siege-side siege-${side}`}>
            {/* İsabet alınca sarsılsın: anahtar her isabette değişir. */}
            <div
              key={`c${hitsOn[side]}`}
              ref={(n) => {
                castles.current[side] = n;
              }}
              className={`siege-castle ${hitsOn[side] > 0 && !lost ? "siege-hit" : ""} ${lost ? "siege-collapse" : ""} ${winner === side ? "siege-win" : ""}`}
            >
              <Castle side={side} hits={hitsOn[side]} target={target} />
            </div>
            {hitsOn[side] > 0 && <div key={`p${hitsOn[side]}`} className="siege-puff" />}
            {lost && <div className="siege-rubble" />}
            <div
              key={`a${flightId}`}
              ref={(n) => {
                catapults.current[side] = n;
              }}
              className={`siege-catapult ${flightId ? "siege-fire" : ""}`}
              data-testid={`siege-catapult-${side}`}
            >
              <Catapult color={side === "left" ? "var(--left)" : "var(--right)"} cock={flightId ? 0 : cock[side]} />
            </div>
          </div>
        );
      })}

      {/* Aynalanmayan katman: nişan çizgisi, uçan taş, ıska tozu */}
      <div className="siege-fx">
        {(["left", "right"] as Side[]).map((side) => (
          <Fragment key={side}>
            {!flights[side] &&
              preview[side].map((p, i) => {
                const q = toStagePct(p);
                return <span key={i} className={`siege-dot ${side}`} style={{ left: `${q.left}%`, top: `${q.top}%`, opacity: 1 - i / (preview[side].length + 4) }} />;
              })}
            {flights[side] && <FlyingStone key={flights[side]!.id} flight={flights[side]!} onDone={() => onLanded(side)} />}
            {impacts[side] && !impacts[side]!.hit && (
              <span key={`i${impacts[side]!.id}`} className="siege-dust" style={{ left: `${toStagePct(impacts[side]!.at).left}%`, top: `${toStagePct(impacts[side]!.at).top}%` }} />
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
