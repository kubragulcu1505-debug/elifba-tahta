"use client";
import type { DuelPlayer, Side } from "@/lib/game";
import { usePhotos } from "@/lib/photoStore";
import { TeamIcon } from "@/components/TeamBadge";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toLocaleUpperCase("tr"))
    .join("");

/** Öğrenci fotoğrafı (yoksa baş harfleri), tarafın rengiyle çerçeveli yuvarlak. */
export function Avatar({ id, name, size = 48, side, className = "" }: { id: string; name: string; size?: number; side?: Side; className?: string }) {
  const photo = usePhotos()[id];
  const ring = side === "left" ? "var(--left)" : side === "right" ? "var(--right)" : "var(--line)";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-2 align-middle font-extrabold text-ink-soft ${className}`}
      style={{ width: size, height: size, border: `${Math.max(2, Math.round(size / 16))}px solid ${ring}`, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- veri adresi; Next görsel optimizasyonu gerekmez
        <img src={photo} alt="" className="h-full w-full object-cover" draggable={false} />
      ) : (
        initials(name)
      )}
    </span>
  );
}

/** Tarafın simgesi: düelloda öğrencinin fotoğrafı, takım oyununda yıldız / hilal. */
export function SideIcon({ side, size = 32, player }: { side: Side; size?: number; player?: DuelPlayer }) {
  if (player) return <Avatar id={player.id} name={player.name} size={Math.round(size * 1.25)} side={side} />;
  return <TeamIcon side={side} size={size} />;
}
