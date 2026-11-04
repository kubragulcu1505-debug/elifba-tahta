"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { openLavaSetup, openRaceSetup, startDart, startPenalty, startSiege, startTug } from "@/lib/session";
import { LESSON_ORDER } from "@/content/lessons";
import { UNITS, lessonsOfUnit, LESSON_BY_ID } from "@/content/lessons";
import { usePersisted } from "@/lib/storage";
import { RichText } from "@/components/Arabic";

/** Oyun kartlarının renkleri: açık, koyu ve gölge tonu. */
const tile = (t1: string, t2: string, t3: string) => ({ "--t1": t1, "--t2": t2, "--t3": t3 }) as CSSProperties;

/** Ünite renkleri sırayla döner. */
const UNIT_COLORS: [string, string][] = [
  ["#7c3aed", "#5b21b6"],
  ["#2563eb", "#1e40af"],
  ["#059669", "#065f46"],
  ["#ea580c", "#9a3412"],
  ["#db2777", "#9d174d"],
  ["#0891b2", "#155e75"],
];

export function LessonMap() {
  const history = usePersisted("history");
  const settings = usePersisted("settings");
  const active = usePersisted("activeGame");
  const router = useRouter();
  const [tugLesson, setTugLesson] = useState(LESSON_ORDER[0].id);

  const best = (lessonId: string) => {
    const games = history.filter((h) => h.lessonId === lessonId);
    if (!games.length) return null;
    const pct = Math.max(...games.flatMap((g) => [g.teams.left, g.teams.right].map((t) => (t.total ? (t.correct / t.total) * 100 : 0))));
    return { count: games.length, pct: Math.round(pct) };
  };

  const games: { icon: string; name: string; desc: string; colors: CSSProperties; go: () => void; tag?: string }[] = [
    {
      icon: "🪢",
      name: "Halat çekme",
      desc: "Her doğru cevap halatı sizin tarafa çeker.",
      colors: tile("#fbbf24", "#f97316", "#c2410c"),
      go: () => {
        startTug(tugLesson);
        router.push("/halat");
      },
    },
    {
      icon: "🏰",
      name: "Kale yıkma",
      desc: "Mancınığı çek, nişan al, rakip kaleyi yık!",
      colors: tile("#818cf8", "#6d28d9", "#4c1d95"),
      go: () => {
        startSiege(tugLesson);
        router.push("/kale");
      },
    },
    {
      icon: "⚽",
      name: "Penaltı",
      desc: "İlk doğru cevaplayan şutu çeker.",
      colors: tile("#4ade80", "#059669", "#065f46"),
      go: () => {
        startPenalty(tugLesson);
        router.push("/penalti");
      },
    },
    {
      icon: "🎯",
      name: "Dart",
      desc: "Çizgiyi kırmızıda durdur, en çok puanı al.",
      colors: tile("#fb7185", "#e11d48", "#9f1239"),
      go: () => {
        startDart(tugLesson);
        router.push("/dart");
      },
    },
    {
      icon: "🏎️",
      name: "Araba yarışı",
      desc: "Arabanı seç, doğru cevapla bitişe koş.",
      colors: tile("#38bdf8", "#2563eb", "#1e3a8a"),
      tag: "YENİ",
      go: () => {
        openRaceSetup(tugLesson);
        router.push("/araba");
      },
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {active && (
        <div className="card flex flex-wrap items-center gap-4 border-brand p-4">
          <span className="text-lg font-bold">⏸ Yarıda kalan bir oyun var.</span>
          <Link href="/oyun" className="btn btn-primary inline-flex items-center">▶ Oyuna dön</Link>
        </div>
      )}

      <section aria-labelledby="oyun-h">
        <div className="section-head">
          <h2 id="oyun-h">🎮 Oyun salonu</h2>
          <label className="flex items-center gap-2 text-lg">
            <span className="font-bold">Hangi dersten sorulsun?</span>
            <select value={tugLesson} onChange={(e) => setTugLesson(e.target.value)} className="lesson-select">
              {LESSON_ORDER.map((l) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </label>
        </div>
        <ul className="game-grid">
          {games.map((g) => (
            <li key={g.name}>
              <button type="button" className="game-tile" style={g.colors} onClick={g.go}>
                {g.tag && <span className="game-tile-tag">{g.tag}</span>}
                <span className="game-tile-icon" aria-hidden="true">{g.icon}</span>
                <span className="game-tile-name">{g.name}</span>
                <span className="game-tile-desc">{g.desc}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="feature-grid">
          <section className="feature-tile" style={tile("#f97316", "#b91c1c", "#7f1d1d")} aria-labelledby="lava-h">
            <span className="game-tile-icon" aria-hidden="true">🌋</span>
            <div className="min-w-52 flex-1">
              <h2 id="lava-h">Lava düşme</h2>
              <p>Harfler, üstün ve cezim karışık. Yanlış yapan takımın ipi uzar; hakkı biten lavaya düşer!</p>
            </div>
            <button
              type="button"
              className="feature-btn"
              onClick={() => {
                openLavaSetup();
                router.push("/lava");
              }}
            >
              🌋 Oyna
            </button>
          </section>
          <section className="feature-tile" style={tile("#a855f7", "#6d28d9", "#3b0764")} aria-labelledby="duello-h">
            <span className="game-tile-icon" aria-hidden="true">⚔️</span>
            <div className="min-w-52 flex-1">
              <h2 id="duello-h">Bireysel düello</h2>
              <p>Fotoğrafından kendini seç, bire bir yarış. Her doğru 10 puan, hepsi genel tabloya!</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/duello" className="feature-btn">⚔ Oyuncu seç</Link>
              <Link href="/tablo" className="feature-btn alt">🏆 Tablo</Link>
            </div>
          </section>
        </div>
      </section>

      <div className="section-head mb-0">
        <h2>🗺 Ders haritası</h2>
        <p className="text-ink-soft">Bütün dersler serbestçe açılabilir.</p>
      </div>
      {UNITS.map((u, i) => {
        const [c, deep] = UNIT_COLORS[i % UNIT_COLORS.length];
        return (
          <section key={u.id} className="card unit-card p-5" style={{ "--u": c, "--u-deep": deep } as CSSProperties} aria-labelledby={`unit-${u.id}`}>
            <div className="flex flex-wrap items-center gap-4">
              <span className="unit-num" aria-hidden="true">{u.order}</span>
              <div className="min-w-60 flex-1">
                <h2 id={`unit-${u.id}`} className="text-2xl font-extrabold">
                  <span className="sr-only">{u.order}. </span>
                  {u.title}
                </h2>
                <p className="text-ink-soft">{u.summary}</p>
              </div>
            </div>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lessonsOfUnit(u.id).map((l) => {
                const b = l.gameLessonId ? null : best(l.id);
                return (
                  <li key={l.id}>
                    <Link href={`/ders/${l.id}`} className="lesson-tile">
                      <span className="lesson-title">
                        <RichText text={l.title.replace(/([؀-ۿ][؀-ۿ\s]*[؀-ۿ])/g, "⟪$1⟫")} />
                      </span>
                      <span className="text-ink-soft">{l.goal}</span>
                      <span className="mt-auto flex flex-wrap gap-2">
                        {l.gameLessonId ? (
                          <span className="chip bg-left-soft text-left">🎮 Oyun: {LESSON_BY_ID.get(l.gameLessonId)?.title}</span>
                        ) : b ? (
                          <>
                            <span className="chip bg-surface-2">{b.count} oyun</span>
                            <span className={`chip ${b.pct >= settings.threshold ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn"}`}>
                              {b.pct >= settings.threshold ? "⭐" : "💪"} En iyi takım %{b.pct}
                            </span>
                          </>
                        ) : (
                          <span className="chip bg-surface-2 text-ink-soft">✨ Henüz oynanmadı</span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
