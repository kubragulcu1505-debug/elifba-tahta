import type { ReactNode } from "react";

/** Büyük Arapça metin bloğu (RTL, Arapça font, geniş satır yüksekliği). */
export function Ar({ children, className = "", label }: { children: string; className?: string; label?: string }) {
  return (
    <span className={`ar ${className}`} dir="rtl" lang="ar" aria-label={label}>
      {children}
    </span>
  );
}

/**
 * ⟪ ⟫ ile işaretlenmiş Arapça parçaları satır içi Arapça olarak gösterir.
 * Örn. "Be harfi ⟪بَ⟫ ile yazılır."
 */
export function RichText({ text, className = "" }: { text: string; className?: string }) {
  const parts: ReactNode[] = [];
  const re = /⟪([^⟫]*)⟫/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <bdi key={i++} className="ar-inline" dir="rtl" lang="ar">
        {m[1]}
      </bdi>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <span className={className}>{parts}</span>;
}
