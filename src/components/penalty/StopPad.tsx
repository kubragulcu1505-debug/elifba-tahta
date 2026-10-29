"use client";
// Dart atış alanı: tahtadaki çizginin aynısı burada da gidip gelir; öğrenci büyük "DUR!" düğmesine basar.
import { useEffect, useRef } from "react";
import type { Side } from "@/lib/game";
import { DART_RANGE, DART_RINGS, sweepPos } from "@/lib/penalty";
import { TapButton } from "@/components/TapButton";

const RING_COLORS = ["#dc2626", "#facc15", "#3b82f6", "#22c55e", "#f8fafc"];

/** Çizginin yolu: ortada kırmızı, dışa doğru halka renkleri (tahtanın dışı gri). */
function trackGradient(): string {
  const stops: string[] = [];
  const pct = (d: number) => 50 + (d / DART_RANGE) * 50;
  stops.push(`#cbd5e1 0%`, `#cbd5e1 ${pct(-1)}%`);
  const rings = [...DART_RINGS].reverse();
  rings.forEach((r, i) => {
    const inner = rings[i + 1]?.upTo ?? 0;
    const c = RING_COLORS[rings.length - 1 - i];
    stops.push(`${c} ${pct(-r.upTo)}%`, `${c} ${pct(-inner)}%`);
  });
  [...DART_RINGS].forEach((r, i) => {
    const inner = DART_RINGS[i - 1]?.upTo ?? 0;
    stops.push(`${RING_COLORS[i]} ${pct(inner)}%`, `${RING_COLORS[i]} ${pct(r.upTo)}%`);
  });
  stops.push(`#cbd5e1 ${pct(1)}%`, `#cbd5e1 100%`);
  return `linear-gradient(90deg, ${stops.join(", ")})`;
}
const TRACK = trackGradient();

export function StopPad({
  side,
  secondsLeft,
  aimStart,
  frozenAt,
  disabled,
  onStop,
}: {
  side: Side;
  secondsLeft: number;
  aimStart: number;
  frozenAt: number | null;
  disabled: boolean;
  onStop: (now: number) => void;
}) {
  const marker = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const place = () => {
      const t = (frozenAt ?? performance.now()) - aimStart;
      if (marker.current) marker.current.style.left = `${50 + (sweepPos(t) / DART_RANGE) * 50}%`;
    };
    const tick = () => {
      place();
      raf = requestAnimationFrame(tick);
    };
    place();
    if (frozenAt === null) raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [aimStart, frozenAt]);

  return (
    <div className="aim-pad stop-pad" data-side={side} data-testid={`stop-${side}`}>
      <div className="aim-head">
        <span className="aim-title">🎯 Çizgi kırmızının üstündeyken DUR&apos;a bas!</span>
        <span className="aim-timer" data-testid={`stop-timer-${side}`}>
          {secondsLeft}
        </span>
      </div>
      <div className="stop-track" style={{ background: TRACK }} aria-hidden="true">
        <span ref={marker} className={`stop-marker ${side}`} />
      </div>
      <TapButton className="stop-btn" disabled={disabled} onTap={onStop} ariaLabel="Dur">
        🎯 DUR!
      </TapButton>
    </div>
  );
}
