"use client";
// Genel puan tablosu: bireysel düellolarda öğrencilerin topladığı bütün puanlar.
import Link from "next/link";
import { update, usePersisted, useHydrated } from "@/lib/storage";
import { DUEL_GAME_LABEL, leaderboard, studentsOfClass } from "@/lib/roster";
import { Avatar } from "@/components/PlayerAvatar";

const MEDAL = ["🥇", "🥈", "🥉"];

export function Leaderboard() {
  const hydrated = useHydrated();
  const roster = usePersisted("roster");
  const duels = usePersisted("duels");
  const ui = usePersisted("ui");
  if (!hydrated) return <div className="p-10 text-2xl">Hazırlanıyor…</div>;

  const classId = roster.classes.some((c) => c.id === ui.duel?.classId) ? ui.duel?.classId : roster.classes[0]?.id;
  const cls = roster.classes.find((c) => c.id === classId);
  const rows = leaderboard(studentsOfClass(roster, classId), duels);
  const matches = duels.filter((d) => rows.some((r) => r.student.id === d.players.left.studentId || r.student.id === d.players.right.studentId)).length;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-6" data-testid="leaderboard">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-3xl font-extrabold">🏆 Genel tablo{cls ? ` · ${cls.name}` : ""}</h1>
        {roster.classes.length > 1 && (
          <select
            value={classId}
            onChange={(e) => update("ui", (u) => ({ ...u, duel: { game: u.duel?.game ?? "letters", lessonId: u.duel?.lessonId ?? "u1-l6", ...u.duel, classId: e.target.value } }))}
            className="min-h-12 rounded-xl border-2 border-line px-3 text-lg"
            aria-label="Sınıf"
          >
            {roster.classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
        <Link href="/duello" className="btn btn-primary ml-auto inline-flex items-center">⚔ Yeni düello</Link>
      </div>
      <p className="mt-2 text-lg text-ink-soft">
        Bireysel düellolarda (Harfler oyunu, Kale yıkma ve Penaltı) her doğru cevap 10 puandır; kazanan da kaybeden de doğruları kadar puan alır.
        Sıralama önce toplam puana, eşitlikte galibiyet sayısına göredir. {matches > 0 && `Bu sınıfta ${matches} düello oynandı.`}
      </p>

      {!cls ? (
        <div className="card mt-6 p-6 text-xl">
          Henüz sınıf yok. <Link href="/ogretmen#siniflar" className="font-bold text-brand underline">Öğretmen panelinden</Link> sınıf ve öğrenci ekleyin.
        </div>
      ) : (
        <ol className="mt-6 flex flex-col gap-3">
          {rows.map((r) => (
            <li
              key={r.student.id}
              className={`card flex flex-wrap items-center gap-4 p-3 ${r.rank <= 3 && r.points > 0 ? "border-warn" : ""}`}
              data-testid="board-row"
            >
              <span className="w-14 text-center text-3xl font-extrabold tabular-nums" aria-label={`${r.rank}. sıra`}>
                {r.points > 0 && r.rank <= 3 ? MEDAL[r.rank - 1] : r.rank}
              </span>
              <Avatar id={r.student.id} name={r.student.name} size={r.rank === 1 && r.points > 0 ? 72 : 56} />
              <span className="min-w-40 flex-1 text-2xl font-extrabold">{r.student.name}</span>
              <span className="flex flex-wrap gap-2 text-lg font-bold">
                <span className="chip bg-surface-2" title="Oynanan düello">⚔ {r.matches} maç</span>
                <span className="chip bg-ok-soft text-ok" title="Galibiyet">🏅 {r.wins} galibiyet</span>
                <span className="chip bg-surface-2" title={DUEL_GAME_LABEL.letters}>🔤 {r.byGame.letters}</span>
                <span className="chip bg-surface-2" title={DUEL_GAME_LABEL.siege}>🏰 {r.byGame.siege}</span>
                <span className="chip bg-surface-2" title={DUEL_GAME_LABEL.penalty}>⚽ {r.byGame.penalty}</span>
              </span>
              <span className="w-32 text-right text-3xl font-extrabold tabular-nums text-brand" data-testid="board-points">{r.points} <span className="text-lg">puan</span></span>
            </li>
          ))}
          {!rows.length && <li className="card p-6 text-xl">Bu sınıfta öğrenci yok.</li>}
        </ol>
      )}
    </main>
  );
}
