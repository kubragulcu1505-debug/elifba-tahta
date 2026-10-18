"use client";
import { useRef, useState, type ReactNode } from "react";

/**
 * Çoklu dokunmaya uygun düğme.
 * - Pointer Events kullanır; birincil işaretçi şartı yoktur (isPrimary kontrol edilmez).
 * - Her düğme kendi işaretçisini yakalar; iki takımın eşzamanlı dokunuşları birbirini engellemez.
 * - "click" olayına güvenmez: tarayıcılar iki parmakla dokunmada click üretmeyebilir.
 * - Parmak düğmenin dışında kaldırılırsa seçim yapılmaz.
 * - Klavye ile (Enter/Boşluk) de kullanılabilir.
 */
export function TapButton({
  onTap,
  disabled,
  className = "",
  children,
  ariaLabel,
  state,
  "data-oid": dataOid,
}: {
  onTap: (now: number) => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
  state?: string;
  "data-oid"?: string;
}) {
  const pointer = useRef<number | null>(null);
  const [pressed, setPressed] = useState(false);

  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      aria-label={ariaLabel}
      data-pressed={pressed}
      data-state={state}
      data-oid={dataOid}
      onPointerDown={(e) => {
        if (disabled || pointer.current !== null) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        pointer.current = e.pointerId;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* bazı tarayıcılar desteklemez */
        }
        setPressed(true);
      }}
      onPointerUp={(e) => {
        if (pointer.current !== e.pointerId) return;
        pointer.current = null;
        setPressed(false);
        const r = e.currentTarget.getBoundingClientRect();
        const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        if (inside && !disabled) onTap(performance.now());
      }}
      onPointerCancel={(e) => {
        if (pointer.current === e.pointerId) {
          pointer.current = null;
          setPressed(false);
        }
      }}
      onLostPointerCapture={(e) => {
        if (pointer.current === e.pointerId) {
          pointer.current = null;
          setPressed(false);
        }
      }}
      onClick={(e) => {
        // Yalnızca klavye etkinleştirmesi (detail === 0). İşaretçi tıklamaları pointerup ile işlenir.
        if (e.detail === 0 && !disabled) onTap(performance.now());
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}
