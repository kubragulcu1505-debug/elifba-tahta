"use client";
// Bireysel düello için dövüş oyunu tarzı oyuncu seçim ekranı.
// Önce soldaki öğrenci, sonra sağdaki öğrenci kendi kartına dokunur; "VS" ekranından sonra oyun başlar.
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { DuelPlayer, Side } from "@/lib/game";
import { update, usePersisted, useHydrated } from "@/lib/storage";
import { DUEL_GAME_LABEL, DUEL_LETTERS_LESSON, studentsOfClass, type DuelGame, type Student } from "@/lib/roster";
import { startDuel } from "@/lib/session";
import { LESSON_BY_ID, LESSON_ORDER } from "@/content/lessons";
import { TapButton } from "@/components/TapButton";
import { usePhotos } from "@/lib/photoStore";

const VS_MS = 2300;
const SIDE_TITLE: Record<Side, string> = { left: "1. OYUNCU", right: "2. OYUNCU" };

function Portrait({ side, student, onClear }: { side: Side; student?: Student; onClear: () => void }) {
  const photo = usePhotos()[student?.id ?? ""];
  return (
    <div className={`duel-portrait duel-${side}`} data-testid={`duel-portrait-${side}`}>
      <div className="duel-portrait-title">{SIDE_TITLE[side]}</div>
      <div key={student?.id ?? "none"} className={`duel-portrait-img ${student ? "duel-pop" : ""}`}>
        {student ? (
          photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- yerel veri adresi
            <img src={photo} alt="" draggable={false} />
          ) : (
            <span className="duel-initials">{initials(student.name)}</span>
          )
        ) : (
          <span className="duel-question">?</span>
        )}
      </div>
      <div className="duel-portrait-name">{student ? student.name : side === "left" ? "Kendini seç!" : "Rakibini bekle…"}</div>
      {student && (
        <TapButton className="duel-clear" onTap={onClear} ariaLabel={`${SIDE_TITLE[side]} seçimini kaldır`}>
          ✕ Değiştir
        </TapButton>
      )}
    </div>
  );
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toLocaleUpperCase("tr"))
    .join("");

function Card({ student, picked, onTap }: { student: Student; picked: Side | null; onTap: () => void }) {
  const photo = usePhotos()[student.id];
  return (
    <TapButton className={`duel-card ${picked ? `picked-${picked}` : ""}`} onTap={onTap} ariaLabel={student.name}>
      <span className="duel-card-img">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- yerel veri adresi
          <img src={photo} alt="" draggable={false} />
        ) : (
          <span className="duel-initials">{initials(student.name)}</span>
        )}
        {picked && <span className={`duel-badge ${picked}`}>{picked === "left" ? "1P" : "2P"}</span>}
      </span>
      <span className="duel-card-name">{student.name}</span>
    </TapButton>
  );
}

export function DuelSelect() {
  const hydrated = useHydrated();
  if (!hydrated) return <div className="p-10 text-2xl">Hazırlanıyor…</div>;
  return <DuelSelectInner />;
}

function DuelSelectInner() {
  const router = useRouter();
  const roster = usePersisted("roster");
  const ui = usePersisted("ui");
  const [pick, setPick] = useState<Record<Side, string | null>>({ left: null, right: null });
  const [vs, setVs] = useState(false);

  const game: DuelGame = ui.duel?.game ?? "letters";
  const lessonId = ui.duel?.lessonId && LESSON_BY_ID.has(ui.duel.lessonId) ? ui.duel.lessonId : DUEL_LETTERS_LESSON;
  const classId = roster.classes.some((c) => c.id === ui.duel?.classId) ? ui.duel?.classId : roster.classes[0]?.id;
  const students = studentsOfClass(roster, classId);
  const byId = new Map(students.map((s) => [s.id, s]));
  const left = pick.left ? byId.get(pick.left) : undefined;
  const right = pick.right ? byId.get(pick.right) : undefined;

  const setDuel = (patch: Partial<{ game: DuelGame; lessonId: string; classId: string }>) =>
    update("ui", (u) => ({ ...u, duel: { game, lessonId, classId, ...u.duel, ...patch } }));

  const tapStudent = (id: string) => {
    setPick((p) => {
      if (p.left === id) return { ...p, left: null };
      if (p.right === id) return { ...p, right: null };
      if (!p.left) return { ...p, left: id };
      return { ...p, right: id };
    });
  };

  // VS ekranı bitince oyunu başlat.
  useEffect(() => {
    if (!vs || !left || !right) return;
    const players: Record<Side, DuelPlayer> = { left: { id: left.id, name: left.name }, right: { id: right.id, name: right.name } };
    const t = setTimeout(() => router.push(startDuel(game, lessonId, players)), VS_MS);
    return () => clearTimeout(t);
  }, [vs, left, right, game, lessonId, router]);

  return (
    <div className="duel-root" data-testid="duel-select">
      <header className="duel-head">
        <div className="duel-logo">⚔ OYUNCU SEÇ</div>
        {roster.classes.length > 1 && (
          <select
            value={classId}
            onChange={(e) => {
              setPick({ left: null, right: null });
              setDuel({ classId: e.target.value });
            }}
            className="duel-select"
            aria-label="Sınıf"
          >
            {roster.classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
        {roster.classes.length === 1 && <span className="duel-chip">{roster.classes[0].name}</span>}
        <div className="duel-games" role="group" aria-label="Oyun">
          {(["letters", "siege"] as DuelGame[]).map((g) => (
            <TapButton key={g} className={`duel-game ${game === g ? "on" : ""}`} onTap={() => setDuel({ game: g })}>
              {g === "letters" ? "🔤 " : "🏰 "}
              {DUEL_GAME_LABEL[g]}
            </TapButton>
          ))}
        </div>
        {game === "siege" && (
          <select value={lessonId} onChange={(e) => setDuel({ lessonId: e.target.value })} className="duel-select max-w-[28vw]" aria-label="Ders">
            {LESSON_ORDER.map((l) => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
        )}
        <Link href="/tablo" className="duel-link">🏆 Genel tablo</Link>
        <Link href="/" className="duel-link">Çık</Link>
      </header>

      {!students.length ? (
        <main className="duel-empty">
          <p>Henüz öğrenci yok.</p>
          <p className="text-[clamp(16px,2.4vh,26px)]">Öğretmen panelindeki “Sınıflar ve öğrenciler” bölümünden sınıfı ve öğrencileri (fotoğraflarıyla) ekleyin.</p>
          <Link href="/ogretmen#siniflar" className="duel-start mt-6 inline-flex">Öğretmen paneline git</Link>
        </main>
      ) : (
        <main className="duel-body">
          <Portrait side="left" student={left} onClear={() => setPick((p) => ({ ...p, left: null }))} />
          <div className="duel-grid" data-testid="duel-grid">
            {students.map((s) => (
              <Card key={s.id} student={s} picked={pick.left === s.id ? "left" : pick.right === s.id ? "right" : null} onTap={() => tapStudent(s.id)} />
            ))}
          </div>
          <Portrait side="right" student={right} onClear={() => setPick((p) => ({ ...p, right: null }))} />
        </main>
      )}

      {students.length > 0 && (
        <footer className="duel-foot">
          {left && right ? (
            <TapButton className="duel-start" onTap={() => setVs(true)} ariaLabel="Düelloyu başlat">
              ⚔ BAŞLA · {DUEL_GAME_LABEL[game]}
            </TapButton>
          ) : (
            <span className="duel-hint">{!left ? "1. oyuncu: kendi fotoğrafına dokun" : "2. oyuncu: kendi fotoğrafına dokun"}</span>
          )}
        </footer>
      )}

      {vs && left && right && (
        <div className="duel-vs" data-testid="duel-vs">
          <div className="duel-vs-side duel-vs-left">
            <Portrait side="left" student={left} onClear={() => {}} />
          </div>
          <div className="duel-vs-text">VS</div>
          <div className="duel-vs-side duel-vs-right">
            <Portrait side="right" student={right} onClear={() => {}} />
          </div>
          <div className="duel-vs-game">{DUEL_GAME_LABEL[game]}{game === "siege" ? ` · ${LESSON_BY_ID.get(lessonId)?.title ?? ""}` : " · 28 harf, 30 soru"}</div>
        </div>
      )}
    </div>
  );
}
