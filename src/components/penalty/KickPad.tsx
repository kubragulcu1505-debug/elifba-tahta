"use client";
// Penaltı vuruş alanı: öğrenci topu parmağıyla kaleye doğru (yukarı) kaydırır ve bırakır.
// Kaydırma yönü köşeyi, uzunluğu yüksekliği seçer. Kaydırırken topun gideceği yer sahnede gösterilir.
import { useRef, useState } from "react";
import type { Side } from "@/lib/game";
import { kickFromSwipe, type Kick } from "@/lib/penalty";

/** Tam uzunluk için gereken kaydırma, alanın kısa kenarına oranla. */
const MAX_FRAC = 0.55;

export function KickPad({
  side,
  secondsLeft,
  disabled,
  onAim,
  onKick,
}: {
  side: Side;
  secondsLeft: number;
  disabled: boolean;
  onAim: (kick: Kick | null) => void;
  onKick: (kick: Kick) => void;
}) {
  const drag = useRef<{ id: number; x: number; y: number; max: number } | null>(null);
  const [off, setOff] = useState<{ x: number; y: number } | null>(null);
  const [max, setMax] = useState(1);
  const len = off ? Math.min(1, Math.hypot(off.x, off.y) / max) : 0;

  return (
    <div
      className={`aim-pad kick-pad ${disabled ? "off" : ""}`}
      data-side={side}
      data-testid={`kick-${side}`}
      onPointerDown={(e) => {
        if (disabled || drag.current) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        const r = e.currentTarget.getBoundingClientRect();
        const m = Math.max(80, Math.min(r.width, r.height) * MAX_FRAC);
        drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, max: m };
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* bazı tarayıcılar desteklemez */
        }
        setMax(m);
        setOff({ x: 0, y: 0 });
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d || d.id !== e.pointerId) return;
        const o = { x: e.clientX - d.x, y: e.clientY - d.y };
        setOff(o);
        onAim(kickFromSwipe(o, d.max));
      }}
      onPointerUp={(e) => {
        const d = drag.current;
        if (!d || d.id !== e.pointerId) return;
        drag.current = null;
        setOff(null);
        const k = kickFromSwipe({ x: e.clientX - d.x, y: e.clientY - d.y }, d.max);
        if (k && !disabled) onKick(k);
        else onAim(null);
      }}
      onPointerCancel={(e) => {
        if (drag.current?.id !== e.pointerId) return;
        drag.current = null;
        setOff(null);
        onAim(null);
      }}
    >
      <div className="aim-head">
        <span className="aim-title">⚽ Topu kaleye doğru kaydır ⬆ ve bırak!</span>
        <span className="aim-timer" data-testid={`kick-timer-${side}`}>
          {secondsLeft}
        </span>
      </div>
      <div className="kick-field" aria-hidden="true">
        <span className="kick-hint">↖ sol · ⬆ orta · sağ ↗ — kısa: alt köşe, uzun: üst köşe</span>
        <span
          className="kick-ball"
          style={off ? { transform: `translate(calc(-50% + ${Math.max(-max, Math.min(max, off.x)) * 0.6}px), calc(-50% + ${Math.max(-max, Math.min(max, off.y)) * 0.6}px))` } : undefined}
        />
      </div>
      <div className="aim-power" aria-hidden="true">
        <span style={{ width: `${len * 100}%` }} />
      </div>
    </div>
  );
}
