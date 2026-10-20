"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SIDES, type Side } from "@/lib/game";
import { reduceTug, snapshotTug, restoreTug, currentTugItem, type TugAction, type TugState } from "@/lib/tug";
import { lookupAnyLite, startTug, toLite } from "@/lib/session";
import { read, write, usePersisted, useHydrated } from "@/lib/storage";
import { LESSON_BY_ID } from "@/content/lessons";
import { TUG_POOLS, getAnyQuestion } from "@/content/index";
import { TapButton } from "@/components/TapButton";
import { TeamIcon } from "@/components/TeamBadge";
import { Ar, RichText } from "@/components/Arabic";
import { RopeStage } from "./RopeStage";

const isLongArabic = (s: string) => [...s].filter((c) => c !== " ").length > 7 || s.includes(" ");
const isLongText = (s: string) => s.length > 22;

function loadInitial(): TugState | null {
  const at = read("activeTug");
  if (!at) return null;
  return at.fresh ? at.state : restoreTug(at.state, performance.now());
}

/** ~200 ms'de bir güncellenen saat (render sırasında performance.now çağrılmaz). */
function useNow(active: boolean): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(performance.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 200);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [active]);
  return now;
}

export function TugScreen() {
  const hydrated = useHydrated();
  const active = usePersisted("activeTug");
  if (!hydrated) return <div className="p-10 text-2xl">Hazırlanıyor…</div>;
  // Yeni oyun başlatılınca bileşen sıfırdan kurulsun (Next.js sayfa durumunu saklar).
  return <TugInner key={active?.state.id ?? "none"} />;
}

function TugInner() {
  const router = useRouter();
  const settings = usePersisted("settings");
  const [state, setState] = useState<TugState | null>(loadInitial);
  const [isFs, setIsFs] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);

  const lessonId = state?.lessonId;
  const pool = useMemo(() => (lessonId ? (TUG_POOLS[lessonId] ?? []).map(toLite) : []), [lessonId]);
  const ctx = useMemo(() => ({ pool, lookup: lookupAnyLite }), [pool]);
  const dispatch = useCallback((a: TugAction) => setState((prev) => (prev ? reduceTug(prev, a, ctx) : prev)), [ctx]);

  // Kaydet (başka bir oyun başlatıldıysa üzerine yazma).
  useEffect(() => {
    if (!state) return;
    const cur = read("activeTug");
    if (!cur || cur.state.id !== state.id) return;
    write("activeTug", { state: snapshotTug(state, performance.now()), savedAtEpoch: Date.now(), fresh: false });
  }, [state]);

  // Bekleme süresi dolunca soru kendiliğinden geçer (doğruda kısa, yanlışta 5 saniye).
  useEffect(() => {
    if (!state || state.paused || state.winner) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const side of SIDES) {
      const t = state.teams[side];
      if (t.phase !== "feedback") continue;
      const wait = Math.max(0, t.continueAt - performance.now()) + 20;
      timers.push(setTimeout(() => dispatch({ type: "NEXT", side, now: performance.now() }), wait));
    }
    return () => timers.forEach(clearTimeout);
  }, [state, dispatch]);

  // Sekme gizlenince duraklat.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") dispatch({ type: "PAUSE", now: performance.now() });
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [dispatch]);

  useEffect(() => {
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __ELIFBA_DEBUG__?: unknown }).__ELIFBA_DEBUG__ = { lookupLite: lookupAnyLite };
    }
  }, []);

  if (!state) {
    return (
      <main className="mx-auto max-w-3xl p-10 text-center">
        <h1 className="text-3xl font-extrabold">Aktif halat çekme oyunu yok</h1>
        <p className="mt-4 text-xl text-ink-soft">Bir ders sayfasından “Halat çekme” oyununu başlatın.</p>
        <Link href="/" className="btn btn-primary mt-8 inline-flex items-center">Ders haritasına git</Link>
      </main>
    );
  }

  const lesson = LESSON_BY_ID.get(state.lessonId);
  const names = settings.teamNames;
  const restart = () => {
    setConfirmRestart(false);
    startTug(state.lessonId);
  };
  const toggleFs = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* izin yok */
    }
  };

  return (
    <div className="game-root tug-root" data-testid="tug-root">
      <header className="flex items-center gap-3 border-b-2 border-line bg-surface px-4 py-2">
        <div className="min-w-0 flex-1 truncate text-lg font-extrabold">
          {lesson?.title}
          <span className="ml-3 chip bg-warn-soft text-warn">Halat çekme · sınırsız soru</span>
        </div>
        <TapButton className="btn btn-primary" onTap={(now) => dispatch(state.paused ? { type: "RESUME", now } : { type: "PAUSE", now })}>
          {state.paused ? "▶ Devam" : "⏸ Duraklat"}
        </TapButton>
        <TapButton className="btn btn-ghost" onTap={() => setConfirmRestart(true)}>↻ Yeniden başlat</TapButton>
        <TapButton className="btn btn-ghost" onTap={toggleFs}>{isFs ? "Tam ekrandan çık" : "⛶ Tam ekran"}</TapButton>
        <TapButton
          className="btn btn-ghost"
          onTap={(now) => {
            dispatch({ type: "PAUSE", now });
            router.push(`/ders/${state.lessonId}`);
          }}
        >
          Çık
        </TapButton>
      </header>

      <RopeStage rope={state.rope} target={state.settings.target} names={names} pulls={{ left: state.teams.left.correct, right: state.teams.right.correct }} />

      <div className="relative min-h-0">
        <div className="halves h-full">
          <TugPanel side="left" state={state} name={names.left} dispatch={dispatch} />
          <div className="divider" aria-hidden="true" />
          <TugPanel side="right" state={state} name={names.right} dispatch={dispatch} />
        </div>

        {state.paused && !state.winner && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink/40" data-testid="pause-overlay">
            <div className="card anim-pop flex flex-col items-center gap-6 p-10 text-center">
              <div className="text-4xl font-extrabold">Oyun duraklatıldı</div>
              <TapButton className="big-btn btn-primary" onTap={(now) => dispatch({ type: "RESUME", now })}>▶ Devam et</TapButton>
            </div>
          </div>
        )}

        {state.winner && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink/45 p-4" data-testid="tug-winner">
            <div className="card anim-pop flex w-full max-w-3xl flex-col items-center gap-5 p-8 text-center">
              <div className={`text-[clamp(28px,5vh,56px)] font-extrabold ${state.winner === "left" ? "text-left" : "text-right"}`}>
                <TeamIcon side={state.winner} size={48} /> <span className="text-ink">{names[state.winner]} halatı kendi tarafına çekti!</span>
              </div>
              <p className="text-[clamp(16px,2.6vh,28px)] font-semibold">İki takım da çok güzel çekti. Tebrikler!</p>
              <div className="grid w-full grid-cols-2 gap-4 text-[clamp(16px,2.4vh,26px)]">
                {(["left", "right"] as Side[]).map((side) => (
                  <div key={side} className={`rounded-2xl border-4 p-3 ${side === "left" ? "border-left bg-left-soft" : "border-right bg-right-soft"}`}>
                    <div className="font-extrabold">{names[side]}</div>
                    <div>{state.teams[side].correct} doğru · {state.teams[side].wrong} yanlış</div>
                  </div>
                ))}
              </div>
              <p className="text-base text-ink-soft">
                Kazanmak için bayrağı {state.settings.target} çekiş farkla kendi çizgisine çekmek gerekir. Takım sonucu tek tek öğrencilerin düzeyini göstermez.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <TapButton className="big-btn btn-primary" onTap={restart}>↻ Yeniden oyna</TapButton>
                <Link href={`/ders/${state.lessonId}`} className="big-btn btn-ghost inline-flex items-center border-2 border-line">Ders sayfası</Link>
              </div>
            </div>
          </div>
        )}

        {confirmRestart && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink/40">
            <div className="card flex flex-col items-center gap-6 p-10 text-center">
              <div className="text-3xl font-extrabold">Halat çekme yeniden başlasın mı?</div>
              <p className="text-xl text-ink-soft">Halat ortaya döner, sorular yeniden karışır.</p>
              <div className="flex gap-4">
                <TapButton className="big-btn btn-primary" onTap={restart}>Evet, yeniden başlat</TapButton>
                <TapButton className="big-btn btn-ghost" onTap={() => setConfirmRestart(false)}>Vazgeç</TapButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TugPanel({ side, state, name, dispatch }: { side: Side; state: TugState; name: string; dispatch: (a: TugAction) => void }) {
  const team = state.teams[side];
  const item = currentTugItem(team);
  const q = item ? getAnyQuestion(item.questionId) : undefined;
  const now = useNow(team.phase === "feedback" && !state.paused);
  const fb = team.phase === "feedback" ? team.lastAnswer : null;

  // Soru ekrana çizilince dokunuşları aç.
  useEffect(() => {
    if (team.phase !== "loading" || state.winner) return;
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => dispatch({ type: "QUESTION_VISIBLE", side, now: performance.now() }));
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [team.phase, team.index, team.cycle, state.winner, dispatch, side]);

  if (!q || !item) return <section className="team-panel compact" data-side={side} />;
  const options = item.optionOrder.map((id) => q.options.find((o) => o.id === id)!);
  const correctOpt = q.options.find((o) => o.id === q.correctOptionId)!;
  const secondsLeft = fb && !fb.correct ? Math.max(1, Math.ceil((team.continueAt - (now || team.continueAt - state.settings.wrongLockMs)) / 1000)) : 0;

  return (
    <section className="team-panel compact" data-side={side} aria-label={`${name} alanı`} data-testid={`team-${side}`}>
      <header className="flex items-center gap-3">
        <span className={`inline-flex items-center gap-2 text-[clamp(16px,2.6vh,30px)] font-extrabold ${side === "left" ? "text-left" : "text-right"}`}>
          <TeamIcon side={side} size={28} />
          <span className="text-ink">{name}</span>
        </span>
        <span className="ml-auto flex gap-2 text-[clamp(13px,2vh,22px)] font-bold">
          <span className="chip bg-ok-soft text-ok" data-testid={`correct-${side}`}>✓ {team.correct}</span>
          <span className="chip bg-bad-soft text-bad">✗ {team.wrong}</span>
        </span>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-[clamp(4px,1vh,14px)]" data-qid={q.id} data-phase={team.phase}>
        <div className="flex min-h-[clamp(96px,18vh,250px)] flex-col items-center justify-center">
          {fb && !fb.correct ? (
            <div className="anim-in w-full rounded-2xl border-4 border-ok bg-ok-soft p-[clamp(6px,1vh,16px)] text-center" role="status">
              <div className="text-[clamp(16px,2.6vh,30px)] font-extrabold text-ok">
                Doğru cevap: <span className="text-ink">{correctOpt.label}</span>
              </div>
              <p className="text-[clamp(14px,2.1vh,24px)] leading-snug">
                <RichText text={q.explanation} />
              </p>
              <p className="mt-1 text-[clamp(16px,2.6vh,30px)] font-extrabold text-bad" data-testid={`wait-${side}`}>
                {secondsLeft} saniye bekleyin…
              </p>
            </div>
          ) : (
            <>
              <h2 className="prompt-text">
                <RichText text={q.prompt} />
              </h2>
              {q.stimulus && (
                <div className={`stimulus ${isLongArabic(q.stimulus) ? "long" : ""}`} data-testid={`stimulus-${side}`}>
                  <Ar>{q.stimulus}</Ar>
                </div>
              )}
            </>
          )}
        </div>
        <div className="options-grid" role="group" aria-label="Seçenekler">
          {options.map((o) => {
            let st: string | undefined;
            if (fb) st = o.id === q.correctOptionId ? "correct" : o.id === fb.optionId ? "wrong" : "dim";
            return (
              <TapButton
                key={o.id}
                className="option-btn"
                data-oid={o.id}
                state={st}
                disabled={team.phase !== "question" || state.paused || !!state.winner}
                ariaLabel={`Seçenek: ${o.label}`}
                onTap={(t) => dispatch({ type: "ANSWER", side, questionId: q.id, optionId: o.id, now: t })}
              >
                <span className={`opt-text ${isLongText(o.label) ? "long" : ""}`}>{o.label}</span>
              </TapButton>
            );
          })}
        </div>
        <footer className="flex min-h-[clamp(40px,6vh,70px)] items-center justify-center">
          {fb?.correct && (
            <div className="anim-pop rounded-full bg-ok px-8 py-1 text-[clamp(18px,3vh,36px)] font-extrabold text-white" role="status">
              Doğru! Halatı çektiniz
            </div>
          )}
          {!fb && <span className="text-[clamp(13px,2vh,22px)] font-semibold text-ink-soft">Cevabını seç.</span>}
        </footer>
      </div>
    </section>
  );
}
