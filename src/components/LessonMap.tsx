"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { startPenalty, startSiege, startTug } from "@/lib/session";
import { LESSON_ORDER } from "@/content/lessons";
import { UNITS, lessonsOfUnit, LESSON_BY_ID } from "@/content/lessons";
import { usePersisted } from "@/lib/storage";
import { RichText } from "@/components/Arabic";

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

  return (
    <div className="flex flex-col gap-6">
      {active && (
        <div className="card flex flex-wrap items-center gap-4 border-brand p-4">
          <span className="text-lg font-bold">Yarıda kalan bir oyun var.</span>
          <Link href="/oyun" className="btn btn-primary inline-flex items-center">Oyuna dön</Link>
        </div>
      )}
      <section className="card flex flex-wrap items-center gap-4 border-left p-5" aria-labelledby="duello-h">
        <h2 id="duello-h" className="text-2xl font-extrabold">⚔ Bireysel düello</h2>
        <p className="min-w-60 flex-1 text-ink-soft">
          İki öğrenci fotoğrafından kendini seçer ve bire bir yarışır: Harfler oyunu, Kale yıkma ya da Penaltı. Her doğru cevap 10 puan; bütün puanlar genel tabloya işlenir.
        </p>
        <Link href="/duello" className="btn btn-primary inline-flex items-center">⚔ Oyuncu seç</Link>
        <Link href="/tablo" className="btn btn-ghost inline-flex items-center">🏆 Genel tablo</Link>
      </section>
      <section className="card flex flex-wrap items-center gap-4 border-warn p-5" aria-labelledby="halat-h">
        <h2 id="halat-h" className="text-2xl font-extrabold">🪢 Halat çekme · 🏰 Kale yıkma · ⚽ Penaltı</h2>
        <p className="min-w-60 flex-1 text-ink-soft">Sınırsız sorulu iki takımlı oyunlar. Doğru cevap halatı çeker, rakip kaleye mancınıkla taş atar ya da penaltı kazandırır. Her derste oynanabilir.</p>
        <label className="flex items-center gap-2 text-lg">
          <span className="font-bold">Ders:</span>
          <select value={tugLesson} onChange={(e) => setTugLesson(e.target.value)} className="min-h-12 max-w-[60vw] rounded-xl border-2 border-line px-3 text-lg">
            {LESSON_ORDER.map((l) => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            startTug(tugLesson);
            router.push("/halat");
          }}
        >
          🪢 Halat çekme
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            startSiege(tugLesson);
            router.push("/kale");
          }}
        >
          🏰 Kale yıkma
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            startPenalty(tugLesson);
            router.push("/penalti");
          }}
        >
          ⚽ Penaltı
        </button>
      </section>
      {UNITS.map((u) => (
        <section key={u.id} className="card p-5" aria-labelledby={`unit-${u.id}`}>
          <div className="flex flex-wrap items-baseline gap-3">
            <h2 id={`unit-${u.id}`} className="text-2xl font-extrabold">
              {u.order}. {u.title}
            </h2>
            <p className="text-ink-soft">{u.summary}</p>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lessonsOfUnit(u.id).map((l) => {
              const b = l.gameLessonId ? null : best(l.id);
              return (
                <li key={l.id}>
                  <Link
                    href={`/ders/${l.id}`}
                    className="flex h-full flex-col gap-2 rounded-2xl border-2 border-line bg-surface-2 p-4 hover:border-brand focus-visible:border-brand"
                  >
                    <span className="text-lg font-extrabold">
                      <RichText text={l.title.replace(/([؀-ۿ][؀-ۿ\s]*[؀-ۿ])/g, "⟪$1⟫")} />
                    </span>
                    <span className="text-ink-soft">{l.goal}</span>
                    <span className="mt-auto flex flex-wrap gap-2">
                      {l.gameLessonId ? (
                        <span className="chip bg-left-soft text-left">Oyun: {LESSON_BY_ID.get(l.gameLessonId)?.title}</span>
                      ) : b ? (
                        <>
                          <span className="chip bg-surface">{b.count} oyun</span>
                          <span className={`chip ${b.pct >= settings.threshold ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn"}`}>
                            En iyi takım %{b.pct}
                          </span>
                        </>
                      ) : (
                        <span className="chip bg-surface text-ink-soft">Henüz oynanmadı</span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
