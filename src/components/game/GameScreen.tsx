"use client";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { reduce, restoreFromSave, snapshotForSave, computeResult, SIDES, type GameAction, type GameState, type Side } from "@/lib/game";
import { lookupLite, recordFinishedGame, sideNames, startCompetition, startReview } from "@/lib/session";
import { read, write, usePersisted, useHydrated } from "@/lib/storage";
import { LESSON_BY_ID } from "@/content/lessons";
import { TapButton } from "@/components/TapButton";
import { TeamPanel } from "./TeamPanel";
import { ResultOverlay } from "./ResultOverlay";

function useFontsReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        setReady(true);
      }
    };
    const t = setTimeout(finish, 2500);
    try {
      // next/font yerel fonta özel bir aile adı verir; adı CSS değişkeninden okunur.
      const family = getComputedStyle(document.documentElement).getPropertyValue("--font-scheherazade").split(",")[0].trim();
      const load = family ? document.fonts.load(`64px ${family}`, "بَ") : Promise.resolve([]);
      load.finally(() => document.fonts.ready.then(finish));
    } catch {
      finish();
    }
    return () => clearTimeout(t);
  }, []);
  return ready;
}

function loadInitial(): GameState | null {
  const ag = read("activeGame");
  if (!ag) return null;
  // Yeni başlatılan oyun hemen başlar; sayfa yenilendiyse oyun duraklatılmış olarak döner.
  return ag.fresh ? ag.state : restoreFromSave(ag.state, performance.now());
}

export function GameScreen() {
  const hydrated = useHydrated();
  const active = usePersisted("activeGame");
  if (!hydrated) return <div className="p-10 text-2xl">Hazırlanıyor…</div>;
  // Next.js (cacheComponents) önceki sayfaların bileşen durumunu saklar. Başka bir yerde yeni oyun
  // başlatıldığında (yeni kimlik) oyun bileşeni sıfırdan kurulsun diye kimlik anahtar olarak verilir.
  return <GameInner key={active?.state.id ?? "none"} />;
}

function GameInner() {
  const router = useRouter();
  const settings = usePersisted("settings");
  const [state, setState] = useState<GameState | null>(loadInitial);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [, tick] = useReducer((x: number) => x + 1, 0);
  const fontsReady = useFontsReady();
  const recorded = useRef<string | null>(null);

  // Yalnızca geliştirme modunda: tarayıcı içi testler için soru sözlüğüne erişim.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __ELIFBA_DEBUG__?: unknown }).__ELIFBA_DEBUG__ = { lookupLite };
    }
  }, []);

  const dispatch = useCallback((a: GameAction) => {
    setState((prev) => (prev ? reduce(prev, a, lookupLite) : prev));
  }, []);

  // Her değişiklikte ve oyun sürerken saniyede bir kaydet.
  const stateRef = useRef<GameState | null>(state);
  const save = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    // Başka bir oyun başlatılmışsa ya da veriler sıfırlandıysa eski oyunu üzerine yazma.
    const cur = read("activeGame");
    if (!cur || cur.state.id !== s.id) return;
    write("activeGame", { state: snapshotForSave(s, performance.now()), savedAtEpoch: Date.now(), fresh: false });
  }, []);
  useEffect(() => {
    stateRef.current = state;
    save();
  }, [state, save]);
  useEffect(() => {
    const id = setInterval(() => {
      if (stateRef.current && !stateRef.current.paused) save();
    }, 1000);
    return () => clearInterval(id);
  }, [save]);

  // Sekme gizlenirse adil süre için otomatik duraklat.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") dispatch({ type: "PAUSE", now: performance.now() });
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [dispatch]);

  // Doğru cevaptan sonra otomatik geçiş; yanlışta "Sıradaki" düğmesinin açılması için yeniden çizim.
  useEffect(() => {
    if (!state || state.paused) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const side of SIDES) {
      const t = state.teams[side];
      if (t.phase !== "feedback") continue;
      const wait = Math.max(0, t.continueAt - performance.now()) + 20;
      if (t.lastAnswer?.correct) timers.push(setTimeout(() => dispatch({ type: "NEXT", side, now: performance.now() }), wait));
      else timers.push(setTimeout(tick, wait));
    }
    return () => timers.forEach(clearTimeout);
  }, [state, dispatch]);

  // Biten yarışmayı geçmişe kaydet.
  useEffect(() => {
    if (!state || state.mode !== "competition") return;
    const r = computeResult(state);
    if (r.winner && recorded.current !== state.id) {
      recorded.current = state.id;
      recordFinishedGame(state);
    }
  }, [state]);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* tarayıcı izin vermedi */
    }
  };

  if (!state) {
    return (
      <main className="mx-auto max-w-3xl p-10 text-center">
        <h1 className="text-3xl font-extrabold">Aktif oyun yok</h1>
        <p className="mt-4 text-xl text-ink-soft">Bir ders sayfasından takım oyununu başlatın.</p>
        <Link href="/" className="btn btn-primary mt-8 inline-flex items-center">Ders haritasına git</Link>
      </main>
    );
  }

  const lesson = LESSON_BY_ID.get(state.lessonId);
  const names = state.players ? sideNames(state.players) : settings.teamNames;
  const result = computeResult(state);
  const bothFinished = SIDES.every((s) => state.teams[s].phase === "finished");
  const wrongBySide: Record<Side, string[]> = {
    left: result.teams.left.wrongQuestionIds,
    right: result.teams.right.wrongQuestionIds,
  };

  const restart = () => {
    setConfirmRestart(false);
    const s = startCompetition(state.lessonId, state.players);
    recorded.current = null;
    setState(s);
  };
  const review = () => {
    const s = startReview(state.lessonId, wrongBySide, state.players);
    setState(s);
  };

  return (
    <div className="game-root" data-testid="game-root">
      <header className="flex items-center gap-3 border-b-2 border-line bg-surface px-4 py-2">
        <div className="min-w-0 flex-1 truncate text-lg font-extrabold">
          {lesson?.title}
          <span className="ml-3 chip bg-surface-2 text-ink-soft">{state.mode === "competition" ? (state.players ? "Bireysel düello · 30 soru" : "Yarışma · 30 soru") : "Tekrar · puansız"}</span>
        </div>
        <TapButton
          className="btn btn-primary"
          onTap={(now) => dispatch(state.paused ? { type: "RESUME", now } : { type: "PAUSE", now })}
          ariaLabel={state.paused ? "Oyuna devam et" : "Oyunu duraklat"}
        >
          {state.paused ? "▶ Devam" : "⏸ Duraklat"}
        </TapButton>
        <TapButton className="btn btn-ghost" onTap={() => setConfirmRestart(true)}>
          ↻ Yeniden başlat
        </TapButton>
        <TapButton className="btn btn-ghost" onTap={toggleFullscreen}>
          {isFullscreen ? "Tam ekrandan çık" : "⛶ Tam ekran"}
        </TapButton>
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

      <div className="relative min-h-0">
        <div className="halves h-full">
          <TeamPanel side="left" game={state} name={names.left} dispatch={dispatch} fontsReady={fontsReady} threshold={settings.threshold} />
          <div className="divider" aria-hidden="true" />
          <TeamPanel side="right" game={state} name={names.right} dispatch={dispatch} fontsReady={fontsReady} threshold={settings.threshold} />
        </div>

        {state.paused && !bothFinished && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink/40" data-testid="pause-overlay">
            <div className="card anim-pop flex flex-col items-center gap-6 p-10 text-center">
              <div className="text-4xl font-extrabold">Oyun duraklatıldı</div>
              <p className="max-w-xl text-xl text-ink-soft">Duraklama süresi iki takımın süresine de eklenmez.</p>
              <TapButton className="big-btn btn-primary" onTap={(now) => dispatch({ type: "RESUME", now })}>
                ▶ Devam et
              </TapButton>
            </div>
          </div>
        )}

        {bothFinished && (
          <ResultOverlay
            game={state}
            names={names}
            threshold={settings.threshold}
            onReview={review}
            onRestart={restart}
            canReview={state.mode === "competition" && wrongBySide.left.length + wrongBySide.right.length > 0}
          />
        )}

        {confirmRestart && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink/40">
            <div className="card flex flex-col items-center gap-6 p-10 text-center">
              <div className="text-3xl font-extrabold">Yarışma yeniden başlasın mı?</div>
              <p className="text-xl text-ink-soft">Aynı 30 soru yeni bir sırayla gelir. Bu oyunun puanları silinir.</p>
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
