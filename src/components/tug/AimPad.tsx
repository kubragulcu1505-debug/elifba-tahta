"use client";
// Kale yıkmada nişan alanı: öğrenci kendi yarısında taşı parmağıyla geriye çeker ve bırakır.
// Çekme uzunluğu atışın gücünü, yönü açısını belirler. Her alan kendi işaretçisini yakalar;
// iki öğrenci aynı anda nişan alabilir.
import { useRef, useState } from "react";
import type { Side } from "@/lib/game";
import { MIN_POWER, type Pt } from "@/lib/ballistics";

/** Tam güç için gereken çekme uzunluğu, alanın kısa kenarına oranla. */
const MAX_PULL_FRAC = 0.32;

export function AimPad({
  side,
  secondsLeft,
  disabled,
  flying,
  onPull,
  onRelease,
}: {
  side: Side;
  secondsLeft: number;
  disabled: boolean;
  flying: boolean;
  /** Çekerken her harekette (null: vazgeçildi). */
  onPull: (pull: Pt | null, maxPull: number) => void;
  /** Bırakınca; güç yeterliyse atış yapılır. */
  onRelease: (pull: Pt, maxPull: number) => void;
}) {
  const pad = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; max: number } | null>(null);
  const [pull, setPull] = useState<Pt | null>(null);
  const [max, setMax] = useState(1);
  const power = pull ? Math.min(1, Math.hypot(pull.x, pull.y) / max) : 0;
  const clampPull = (p: Pt, m: number): Pt => {
    const len = Math.hypot(p.x, p.y);
    return len > m * 1.08 ? { x: (p.x / len) * m * 1.08, y: (p.y / len) * m * 1.08 } : p;
  };
  const back = side === "left" ? "←" : "→";

  return (
    <div
      ref={pad}
      className={`aim-pad ${disabled ? "off" : ""}`}
      data-side={side}
      data-testid={`aim-${side}`}
      onPointerDown={(e) => {
        if (disabled || flying || drag.current) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        const r = e.currentTarget.getBoundingClientRect();
        const m = Math.max(60, Math.min(r.width, r.height) * MAX_PULL_FRAC);
        drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, max: m };
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* bazı tarayıcılar desteklemez */
        }
        setMax(m);
        setPull({ x: 0, y: 0 });
        onPull({ x: 0, y: 0 }, m);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d || d.id !== e.pointerId) return;
        const p = clampPull({ x: e.clientX - d.x, y: e.clientY - d.y }, d.max);
        setPull(p);
        onPull(p, d.max);
      }}
      onPointerUp={(e) => {
        const d = drag.current;
        if (!d || d.id !== e.pointerId) return;
        drag.current = null;
        const p = clampPull({ x: e.clientX - d.x, y: e.clientY - d.y }, d.max);
        setPull(null);
        if (Math.hypot(p.x, p.y) / d.max >= MIN_POWER && !disabled) onRelease(p, d.max);
        else onPull(null, d.max);
      }}
      onPointerCancel={(e) => {
        if (drag.current?.id !== e.pointerId) return;
        drag.current = null;
        setPull(null);
        onPull(null, max);
      }}
    >
      <div className="aim-head">
        <span className="aim-title">{flying ? "Taş uçuyor…" : `🎯 Taşı geriye çek ${back}, nişan al ve bırak!`}</span>
        {!flying && (
          <span className="aim-timer" data-testid={`aim-timer-${side}`}>
            {secondsLeft}
          </span>
        )}
      </div>
      <svg className="aim-sling" viewBox="-120 -90 240 180" aria-hidden="true">
        {/* Sapanın iki direği; lastikler taşa bağlıdır. */}
        <path d="M-34 90 L-28 -20 M34 90 L28 -20" stroke="#78350f" strokeWidth="14" strokeLinecap="round" />
        {(() => {
          // Çekme, alan ölçüsünden sapan çizimine ölçeklenir.
          const k = 70 / max;
          const sx = pull ? pull.x * k : 0;
          const sy = pull ? pull.y * k : 0;
          return (
            <>
              <line x1="-28" y1="-20" x2={sx} y2={sy - 10} stroke="#7c2d12" strokeWidth="6" />
              <line x1="28" y1="-20" x2={sx} y2={sy - 10} stroke="#7c2d12" strokeWidth="6" />
              {!flying && <circle cx={sx} cy={sy - 10} r="18" fill="url(#aim-stone)" stroke="#1f2937" strokeWidth="2" />}
            </>
          );
        })()}
        <defs>
          <radialGradient id="aim-stone" cx="35%" cy="35%">
            <stop offset="0%" stopColor="#d1d5db" />
            <stop offset="100%" stopColor="#4b5563" />
          </radialGradient>
        </defs>
      </svg>
      <div className="aim-power" aria-hidden="true">
        <span style={{ width: `${power * 100}%` }} />
      </div>
    </div>
  );
}
