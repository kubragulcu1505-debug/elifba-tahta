import type { Side } from "@/lib/game";

export function StarIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"
        fill="currentColor"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1"
      />
    </svg>
  );
}

export function CrescentIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15.5 3.2A9 9 0 1 0 20.8 16 7.2 7.2 0 0 1 15.5 3.2z" fill="currentColor" />
    </svg>
  );
}

export function TeamIcon({ side, size = 32 }: { side: Side; size?: number }) {
  return side === "left" ? <StarIcon size={size} /> : <CrescentIcon size={size} />;
}

export const SIDE_LABEL: Record<Side, string> = { left: "Sol takım", right: "Sağ takım" };

export function TeamBadge({ side, name, size = 32, className = "" }: { side: Side; name: string; size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-extrabold ${side === "left" ? "text-left" : "text-right"} ${className}`}>
      <TeamIcon side={side} size={size} />
      <span className="text-ink">{name}</span>
    </span>
  );
}
