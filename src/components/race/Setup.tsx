"use client";
// Oyun başlangıç ekranları: araba yarışında "garaj" (ad, araba, renk, numara), lava düşmede takım adları.
import Link from "next/link";
import { Fragment, useState } from "react";
import type { DuelPlayer, Side } from "@/lib/game";
import type { CarType, Racer } from "@/lib/tug";
import { update, usePersisted } from "@/lib/storage";
import { studentsOfClass } from "@/lib/roster";
import { startLava, startRace } from "@/lib/session";
import { LESSON_BY_ID } from "@/content/lessons";
import { LAVA_LESSON, LAVA_LESSON_TITLE } from "@/content/index";
import { TapButton } from "@/components/TapButton";
import { Avatar } from "@/components/PlayerAvatar";
import { Car, CAR_COLORS, CAR_TYPES } from "./Car";
import { HangingKid } from "./LavaStage";

const SIDE_TITLE: Record<Side, string> = { left: "1. oyuncu", right: "2. oyuncu" };
const DEFAULT_RACERS: Record<Side, Racer> = {
  left: { name: "", car: "racer", color: "#3b82f6", number: "1" },
  right: { name: "", car: "jeep", color: "#f97316", number: "2" },
};
export const DEFAULT_LAVA_NAMES: Record<Side, string> = { left: "Ay Takımı", right: "Beşik Takımı" };

const lessonTitle = (id: string) => (id === LAVA_LESSON ? LAVA_LESSON_TITLE : LESSON_BY_ID.get(id)?.title ?? "");

function SetupShell({ title, lessonId, onCancel, children, footer }: { title: string; lessonId: string; onCancel: () => void; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="setup-root" data-testid="game-setup">
      <header className="flex flex-wrap items-center gap-3 border-b-2 border-line bg-surface px-4 py-2">
        <div className="min-w-0 flex-1 truncate text-xl font-extrabold">
          {title}
          <span className="ml-3 chip bg-surface-2 text-ink-soft">{lessonTitle(lessonId)}</span>
        </div>
        <Link href="/" className="btn btn-ghost inline-flex items-center" onClick={onCancel}>
          Çık
        </Link>
      </header>
      <div className="halves min-h-0">{children}</div>
      <footer className="setup-foot">{footer}</footer>
    </div>
  );
}

/** Araba yarışı garajı: iki oyuncu adını yazar (ya da sınıftan seçer), arabasını, rengini ve numarasını seçer. */
export function RaceSetup({ lessonId }: { lessonId: string }) {
  const ui = usePersisted("ui");
  const roster = usePersisted("roster");
  const [racers, setRacers] = useState<Record<Side, Racer>>(() => ui.lastRacers ?? DEFAULT_RACERS);
  const [picked, setPicked] = useState<Record<Side, DuelPlayer | null>>({ left: null, right: null });
  const classId = roster.classes.some((c) => c.id === ui.duel?.classId) ? ui.duel?.classId : roster.classes[0]?.id;
  const students = studentsOfClass(roster, classId);
  const set = (side: Side, patch: Partial<Racer>) => setRacers((r) => ({ ...r, [side]: { ...r[side], ...patch } }));
  const ready = racers.left.name.trim() !== "" && racers.right.name.trim() !== "" && (!picked.left || !picked.right || picked.left.id !== picked.right.id);
  const start = () => {
    const clean = { left: { ...racers.left, name: racers.left.name.trim() }, right: { ...racers.right, name: racers.right.name.trim() } };
    const players = picked.left && picked.right ? { left: { ...picked.left, name: clean.left.name }, right: { ...picked.right, name: clean.right.name } } : undefined;
    startRace(lessonId, clean, players);
  };

  return (
    <SetupShell
      title="🚗 Cezalı Araba Yarışı · Garaj"
      lessonId={lessonId}
      onCancel={() => update("ui", (u) => ({ ...u, raceSetup: undefined }))}
      footer={
        <>
          <span className="text-lg text-ink-soft">
            Doğru cevap arabanı 1 basamak ilerletir; arka arkaya 3 yanlışta araban 1 basamak geri gider. Bitişe ilk ulaşan kazanır.
          </span>
          <TapButton className="big-btn btn-primary" disabled={!ready} onTap={start} ariaLabel="Yarışı başlat">
            🏁 Yarışı başlat
          </TapButton>
        </>
      }
    >
      {(["left", "right"] as Side[]).map((side, i) => {
        const r = racers[side];
        return (
          <Fragment key={side}>
            {i === 1 && <div className="divider" aria-hidden="true" />}
            <section className="team-panel setup-panel" data-side={side} data-testid={`setup-${side}`}>
              <h2 className={`text-[clamp(18px,3vh,30px)] font-extrabold ${side === "left" ? "text-left" : "text-right"}`}>{SIDE_TITLE[side]}</h2>
              <div className="setup-preview">
                <Car type={r.car} color={r.color} number={r.number} />
              </div>
              <label className="setup-row">
                <span className="font-bold">Adın</span>
                <input
                  value={r.name}
                  onChange={(e) => {
                    set(side, { name: e.target.value });
                    setPicked((p) => ({ ...p, [side]: null }));
                  }}
                  maxLength={24}
                  placeholder="Adını yaz"
                  className="setup-input"
                  data-testid={`setup-name-${side}`}
                />
              </label>
              {students.length > 0 && (
                <div className="setup-students" aria-label="Sınıftan seç">
                  {students.map((s) => (
                    <TapButton
                      key={s.id}
                      className={`setup-student ${picked[side]?.id === s.id ? "on" : ""}`}
                      onTap={() => {
                        set(side, { name: s.name });
                        setPicked((p) => ({ ...p, [side]: { id: s.id, name: s.name } }));
                      }}
                      ariaLabel={s.name}
                    >
                      <Avatar id={s.id} name={s.name} size={34} />
                      <span>{s.name.split(" ")[0]}</span>
                    </TapButton>
                  ))}
                </div>
              )}
              <div className="setup-cars" role="group" aria-label="Araba">
                {CAR_TYPES.map((c) => (
                  <TapButton key={c.id} className={`setup-car ${r.car === c.id ? "on" : ""}`} onTap={() => set(side, { car: c.id as CarType })} ariaLabel={c.label}>
                    <Car type={c.id} color={r.color} />
                    <span>{c.label}</span>
                  </TapButton>
                ))}
              </div>
              <div className="setup-row">
                <div className="setup-colors" role="group" aria-label="Renk">
                  {CAR_COLORS.map((c) => (
                    <TapButton key={c} className={`setup-color ${r.color === c ? "on" : ""}`} onTap={() => set(side, { color: c })} ariaLabel={`Renk ${c}`}>
                      <span style={{ background: c }} />
                    </TapButton>
                  ))}
                </div>
                <label className="flex items-center gap-2">
                  <span className="font-bold">No</span>
                  <input
                    value={r.number}
                    onChange={(e) => set(side, { number: e.target.value.replace(/\D/g, "").slice(0, 2) })}
                    inputMode="numeric"
                    className="setup-input w-20 text-center"
                  />
                </label>
              </div>
            </section>
          </Fragment>
        );
      })}
    </SetupShell>
  );
}

/** Lava düşme: iki takımın adı yazılır (varsayılan Ay Takımı ve Beşik Takımı). */
export function LavaSetup({ lessonId }: { lessonId: string }) {
  const ui = usePersisted("ui");
  const settings = usePersisted("settings");
  const [names, setNames] = useState<Record<Side, string>>(() => ui.lavaNames ?? DEFAULT_LAVA_NAMES);
  const ready = names.left.trim() !== "" && names.right.trim() !== "";
  return (
    <SetupShell
      title="🌋 Lava Düşme Oyunu"
      lessonId={lessonId}
      onCancel={() => update("ui", (u) => ({ ...u, lavaSetup: undefined }))}
      footer={
        <>
          <span className="text-lg text-ink-soft">
            30 soru, süre yok. Her yanlış cevap takımı lava biraz daha yaklaştırır; {settings.lavaLives}. yanlışta takım lava düşer. Kazanan televizyonda kupayı gösterir!
          </span>
          <TapButton
            className="big-btn btn-primary"
            disabled={!ready}
            onTap={() => startLava(lessonId, { left: names.left.trim(), right: names.right.trim() })}
            ariaLabel="Oyunu başlat"
          >
            🌋 Oyunu başlat
          </TapButton>
        </>
      }
    >
      {(["left", "right"] as Side[]).map((side, i) => (
        <Fragment key={side}>
          {i === 1 && <div className="divider" aria-hidden="true" />}
          <section className="team-panel setup-panel items-center justify-center" data-side={side} data-testid={`setup-${side}`}>
            <div className="setup-kid">
              <HangingKid color={side === "left" ? "var(--left)" : "var(--right)"} />
            </div>
            <label className="setup-row w-full max-w-md">
              <span className="font-bold">Takım adı</span>
              <input
                value={names[side]}
                onChange={(e) => setNames((n) => ({ ...n, [side]: e.target.value }))}
                maxLength={24}
                className="setup-input"
                data-testid={`setup-name-${side}`}
              />
            </label>
          </section>
        </Fragment>
      ))}
    </SetupShell>
  );
}
