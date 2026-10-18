"use client";
import Link from "next/link";
import { UNITS, lessonsOfUnit } from "@/content/lessons";
import { usePersisted } from "@/lib/storage";
import { RichText } from "@/components/Arabic";

export function LessonMap() {
  const history = usePersisted("history");
  const settings = usePersisted("settings");
  const active = usePersisted("activeGame");

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
              const b = best(l.id);
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
                      {b ? (
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
