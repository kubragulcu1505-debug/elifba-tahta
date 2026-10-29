"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SIDES, type Side } from "@/lib/game";
import { reduceTug, snapshotTug, restoreTug, currentTugItem, type TugAction, type TugKind, type TugState } from "@/lib/tug";
import { lookupAnyLite, recordFinishedSiege, sideNames, startSiege, startTug, toLite } from "@/lib/session";
import { read, write, usePersisted, useHydrated } from "@/lib/storage";
import { LESSON_BY_ID } from "@/content/lessons";
import { TUG_POOLS, getAnyQuestion } from "@/content/index";
import { TapButton } from "@/components/TapButton";
import { SideIcon } from "@/components/PlayerAvatar";
import { Ar, RichText } from "@/components/Arabic";
import { RopeStage } from "./RopeStage";
import { SiegeStage, type Flight, type Impact, type SiegeGeometry } from "./SiegeStage";
import { AimPad } from "./AimPad";
import { AUTO_POWER, launchFromAngle, launchFromPull, previewPath, simulateShot, type Launch, type Pt } from "@/lib/ballistics";
import { Confetti, Trophy } from "@/components/Celebration";

const isLongArabic = (s: string) => [...s].filter((c) => c !== " ").length > 7 || s.includes(" ");
const isLongText = (s: string) => s.length > 22;

/** Halat çekme ve kale yıkma aynı ekranı kullanır; değişen yazılar ve sahne buradadır. */
const KINDS = {
  tug: {
    key: "activeTug",
    chip: "Halat çekme · sınırsız soru",
    none: "Aktif halat çekme oyunu yok",
    noneHint: "Bir ders sayfasından “Halat çekme” oyununu başlatın.",
    winLine: "Rakip takım ortadaki çukura düştü.",
    praise: "İki takım da çok güzel çekti. Tebrikler!",
    rule: (t: number) => `Kazanmak için rakibi ${t} çekiş farkla ortadaki çukura çekmek gerekir.`,
    restartQ: "Halat çekme yeniden başlasın mı?",
    restartHint: "Halat ortaya döner, sorular yeniden karışır.",
    correctMsg: "Doğru! Halatı çektiniz",
    winDelayMs: 1600,
  },
  siege: {
    key: "activeSiege",
    chip: "Kale yıkma · sınırsız soru",
    none: "Aktif kale yıkma oyunu yok",
    noneHint: "Bir ders sayfasından “Kale yıkma” oyununu başlatın.",
    winLine: "Rakip kale yıkıldı!",
    praise: "İki takım da çok güzel nişan aldı. Tebrikler!",
    rule: (t: number) => `Doğru cevap veren, mancınığı kendisi çekip bırakarak rakip kaleye taş atar. Kaleye isabet 1, kuledeki hedefe (zayıf nokta) isabet 3 hasar verir. Rakip kaleye ${t} hasar ilk veren kazanır.`,
    restartQ: "Kale yıkma yeniden başlasın mı?",
    restartHint: "Kaleler onarılır, sorular yeniden karışır.",
    correctMsg: "Doğru! Şimdi nişan al",
    winDelayMs: 2000,
  },
} as const;

function loadInitial(kind: TugKind): TugState | null {
  const at = read(KINDS[kind].key);
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

export function TugScreen({ kind = "tug" }: { kind?: TugKind }) {
  const hydrated = useHydrated();
  const active = usePersisted(KINDS[kind].key);
  if (!hydrated) return <div className="p-10 text-2xl">Hazırlanıyor…</div>;
  // Yeni oyun başlatılınca bileşen sıfırdan kurulsun (Next.js sayfa durumunu saklar).
  return <TugInner key={active?.state.id ?? "none"} kind={kind} />;
}

function TugInner({ kind }: { kind: TugKind }) {
  const router = useRouter();
  const cfg = KINDS[kind];
  const settings = usePersisted("settings");
  const [state, setState] = useState<TugState | null>(() => loadInitial(kind));
  const [isFs, setIsFs] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  // Kazanma kartı, kaybedenlerin çukura düşmesinden / kalenin yıkılmasından sonra açılır.
  const [showWin, setShowWin] = useState(false);
  const winner = state?.winner ?? null;
  useEffect(() => {
    if (!winner) return;
    const t = setTimeout(() => setShowWin(true), cfg.winDelayMs);
    return () => clearTimeout(t);
  }, [winner, cfg.winDelayMs]);

  const lessonId = state?.lessonId;
  const pool = useMemo(() => (lessonId ? (TUG_POOLS[lessonId] ?? []).map(toLite) : []), [lessonId]);
  const ctx = useMemo(() => ({ pool, lookup: lookupAnyLite }), [pool]);
  const dispatch = useCallback((a: TugAction) => setState((prev) => (prev ? reduceTug(prev, a, ctx) : prev)), [ctx]);

  // ── Kale yıkma: çek-bırak nişanı ve uçan taşlar ──
  const stateRef = useRef(state);
  const geometry = useRef<SiegeGeometry | null>(null);
  const flightSeq = useRef(0);
  const [aims, setAims] = useState<Record<Side, { power: number; path: Pt[] } | null>>({ left: null, right: null });
  const [flights, setFlights] = useState<Record<Side, Flight | null>>({ left: null, right: null });
  const [impacts, setImpacts] = useState<Record<Side, Impact | null>>({ left: null, right: null });
  const flightsRef = useRef(flights);
  useEffect(() => {
    stateRef.current = state;
    flightsRef.current = flights;
  }, [state, flights]);
  const easyAim = state?.settings.easyAim ?? false;

  const plan = useCallback((side: Side, launch: Launch) => {
    const g = geometry.current?.(side);
    return g ? simulateShot(g.start, launch, g.target, g.weak) : null;
  }, []);
  const onPull = useCallback(
    (side: Side, pull: Pt | null, maxPull: number) => {
      if (!pull) {
        setAims((a) => ({ ...a, [side]: null }));
        return;
      }
      const launch = launchFromPull(pull, maxPull, side);
      const shot = plan(side, launch);
      setAims((a) => ({ ...a, [side]: { power: launch.power, path: shot ? previewPath(shot, easyAim) : [] } }));
    },
    [plan, easyAim],
  );
  const fire = useCallback(
    (side: Side, launch: Launch) => {
      setAims((a) => ({ ...a, [side]: null }));
      const s = stateRef.current;
      if (!s || s.paused || s.winner || s.teams[side].phase !== "aim") return;
      const now = performance.now();
      const shot = plan(side, launch);
      dispatch({ type: "FIRE", side, now });
      if (!shot) {
        dispatch({ type: "LAND", side, hit: false, now });
        return;
      }
      flightSeq.current += 1;
      const id = flightSeq.current;
      setFlights((f) => ({ ...f, [side]: { id, shot, startedAt: now } }));
    },
    [plan, dispatch],
  );
  const landed = useCallback(
    (side: Side) => {
      const fl = flightsRef.current[side];
      if (!fl) return;
      dispatch({ type: "LAND", side, hit: fl.shot.hit, critical: fl.shot.critical, now: performance.now() });
      setImpacts((i) => ({ ...i, [side]: { id: fl.id, at: fl.shot.end, hit: fl.shot.hit, critical: fl.shot.critical } }));
      setFlights((f) => ({ ...f, [side]: null }));
    },
    [dispatch],
  );

  // Nişan süresi dolunca zayıf bir atış kendiliğinden yapılır (oyun akışı durmasın).
  useEffect(() => {
    if (!state || kind !== "siege" || state.paused || state.winner) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const side of SIDES) {
      const t = state.teams[side];
      if (t.phase !== "aim") continue;
      const wait = Math.max(0, (t.aimDeadline ?? 0) - performance.now()) + 20;
      timers.push(setTimeout(() => fire(side, launchFromAngle(AUTO_POWER, 45, side)), wait));
    }
    return () => timers.forEach(clearTimeout);
  }, [state, kind, fire]);

  // Bireysel kale yıkma bitince öğrencilerin puanları genel tabloya işlenir (aynı oyun bir kez).
  useEffect(() => {
    if (state?.winner && state.players) recordFinishedSiege(state);
  }, [state]);

  // Kaydet (başka bir oyun başlatıldıysa üzerine yazma).
  useEffect(() => {
    if (!state) return;
    const cur = read(cfg.key);
    if (!cur || cur.state.id !== state.id) return;
    write(cfg.key, { state: snapshotTug(state, performance.now()), savedAtEpoch: Date.now(), fresh: false });
  }, [state, cfg.key]);

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
        <h1 className="text-3xl font-extrabold">{cfg.none}</h1>
        <p className="mt-4 text-xl text-ink-soft">{cfg.noneHint}</p>
        <Link href="/" className="btn btn-primary mt-8 inline-flex items-center">Ders haritasına git</Link>
      </main>
    );
  }

  const lesson = LESSON_BY_ID.get(state.lessonId);
  const duel = !!state.players;
  const names = duel ? sideNames(state.players) : settings.teamNames;
  const restart = () => {
    setConfirmRestart(false);
    if (kind === "siege") startSiege(state.lessonId, state.players);
    else startTug(state.lessonId);
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
          <span className="ml-3 chip bg-warn-soft text-warn">{duel ? `Bireysel düello · ${cfg.chip}` : cfg.chip}</span>
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

      {kind === "siege" ? (
        <SiegeStage
          target={state.settings.target}
          names={names}
          players={state.players}
          winner={state.winner}
          damage={{ left: state.teams.left.damage ?? 0, right: state.teams.right.damage ?? 0 }}
          cock={{ left: aims.left?.power ?? 0, right: aims.right?.power ?? 0 }}
          preview={{ left: aims.left?.path ?? [], right: aims.right?.path ?? [] }}
          flights={flights}
          impacts={impacts}
          onLanded={landed}
          geometryRef={geometry}
        />
      ) : (
        <RopeStage rope={state.rope} target={state.settings.target} names={names} winner={state.winner} pulls={{ left: state.teams.left.correct, right: state.teams.right.correct }} />
      )}

      <div className="relative min-h-0">
        <div className="halves h-full">
          {SIDES.map((side, i) => (
            <TugSlot key={side} divider={i === 1}>
              <TugPanel
                side={side}
                state={state}
                name={names[side]}
                dispatch={dispatch}
                correctMsg={cfg.correctMsg}
                onPull={(pull, max) => onPull(side, pull, max)}
                onRelease={(pull, max) => fire(side, launchFromPull(pull, max, side))}
              />
            </TugSlot>
          ))}
        </div>

        {state.paused && !state.winner && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink/40" data-testid="pause-overlay">
            <div className="card anim-pop flex flex-col items-center gap-6 p-10 text-center">
              <div className="text-4xl font-extrabold">Oyun duraklatıldı</div>
              <TapButton className="big-btn btn-primary" onTap={(now) => dispatch({ type: "RESUME", now })}>▶ Devam et</TapButton>
            </div>
          </div>
        )}

        {state.winner && showWin && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink/45 p-4" data-testid="tug-winner">
            <Confetti />
            <div className="card anim-pop flex w-full max-w-3xl flex-col items-center gap-4 p-8 text-center">
              <Trophy />
              <div className={`text-[clamp(28px,5vh,56px)] font-extrabold ${state.winner === "left" ? "text-left" : "text-right"}`}>
                <SideIcon side={state.winner} size={48} player={state.players?.[state.winner]} /> <span className="text-ink">{names[state.winner]} kazandı!</span>
              </div>
              <p className="text-[clamp(16px,2.6vh,28px)]">{cfg.winLine}</p>
              <p className="text-[clamp(16px,2.6vh,28px)] font-semibold">{duel ? "İki oyuncu da çok güzel nişan aldı. Tebrikler!" : cfg.praise}</p>
              <div className="grid w-full grid-cols-2 gap-4 text-[clamp(16px,2.4vh,26px)]">
                {(["left", "right"] as Side[]).map((side) => (
                  <div key={side} className={`rounded-2xl border-4 p-3 ${side === "left" ? "border-left bg-left-soft" : "border-right bg-right-soft"}`}>
                    <div className="font-extrabold">{names[side]}</div>
                    <div>
                      {state.teams[side].correct} doğru · {state.teams[side].wrong} yanlış
                      {kind === "siege" && ` · 🎯 ${state.teams[side].hits ?? 0} isabet (${state.teams[side].crits ?? 0} tam isabet)`}
                    </div>
                    {duel && (
                      <div className="font-extrabold text-ok" data-testid={`duel-points-${side}`}>+{state.teams[side].correct * 10} puan genel tabloya eklendi</div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-base text-ink-soft">
                {cfg.rule(state.settings.target)} {duel ? "Bireysel düelloda her doğru cevap 10 puandır; iki oyuncunun puanı da genel tabloya eklenir." : "Takım sonucu tek tek öğrencilerin düzeyini göstermez."}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <TapButton className="big-btn btn-primary" onTap={restart}>↻ Yeniden oyna</TapButton>
                {duel ? (
                  <>
                    <Link href="/tablo" className="big-btn btn-ghost inline-flex items-center border-2 border-line">🏆 Genel tablo</Link>
                    <Link href="/duello" className="big-btn btn-ghost inline-flex items-center border-2 border-line">⚔ Yeni düello</Link>
                  </>
                ) : (
                  <Link href={`/ders/${state.lessonId}`} className="big-btn btn-ghost inline-flex items-center border-2 border-line">Ders sayfası</Link>
                )}
              </div>
            </div>
          </div>
        )}

        {confirmRestart && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink/40">
            <div className="card flex flex-col items-center gap-6 p-10 text-center">
              <div className="text-3xl font-extrabold">{cfg.restartQ}</div>
              <p className="text-xl text-ink-soft">{cfg.restartHint}</p>
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

/** İki panelin arasına çizgi koyar (panel sırası korunur). */
function TugSlot({ divider, children }: { divider: boolean; children: React.ReactNode }) {
  return (
    <>
      {divider && <div className="divider" aria-hidden="true" />}
      {children}
    </>
  );
}

function TugPanel({
  side,
  state,
  name,
  dispatch,
  correctMsg,
  onPull,
  onRelease,
}: {
  side: Side;
  state: TugState;
  name: string;
  dispatch: (a: TugAction) => void;
  correctMsg: string;
  onPull: (pull: Pt | null, maxPull: number) => void;
  onRelease: (pull: Pt, maxPull: number) => void;
}) {
  const team = state.teams[side];
  const item = currentTugItem(team);
  const q = item ? getAnyQuestion(item.questionId) : undefined;
  const now = useNow((team.phase === "feedback" || team.phase === "aim") && !state.paused);
  const fb = team.phase === "feedback" ? team.lastAnswer : null;
  const aiming = team.phase === "aim" || team.phase === "flying";
  const shotResult = team.phase === "feedback" && team.lastShot ? team.lastShot : null;

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
  const aimLeft = Math.max(0, Math.ceil(((team.aimDeadline ?? 0) - (now || (team.aimDeadline ?? 0) - state.settings.aimMs)) / 1000));
  const header = (
    <header className="flex items-center gap-3">
      <span className={`inline-flex items-center gap-2 text-[clamp(16px,2.6vh,30px)] font-extrabold ${side === "left" ? "text-left" : "text-right"}`}>
        <SideIcon side={side} size={28} player={state.players?.[side]} />
        <span className="text-ink">{name}</span>
      </span>
      <span className="ml-auto flex gap-2 text-[clamp(13px,2vh,22px)] font-bold">
        <span className="chip bg-ok-soft text-ok" data-testid={`correct-${side}`}>✓ {team.correct}</span>
        <span className="chip bg-bad-soft text-bad">✗ {team.wrong}</span>
        {state.kind === "siege" && <span className="chip bg-warn-soft text-warn" data-testid={`hits-${side}`}>💥 {team.damage ?? 0}</span>}
      </span>
    </header>
  );

  // Kale: doğru cevaptan sonra soru alanı nişan alanına döner; atıştan sonra kısa bir sonuç gösterilir.
  if (aiming || shotResult) {
    return (
      <section className="team-panel compact" data-side={side} aria-label={`${name} alanı`} data-testid={`team-${side}`}>
        {header}
        <div className="flex min-h-0 flex-1 flex-col" data-qid={q.id} data-phase={team.phase}>
          {aiming ? (
            <AimPad
              side={side}
              secondsLeft={aimLeft}
              disabled={state.paused || !!state.winner || team.phase !== "aim"}
              flying={team.phase === "flying"}
              onPull={onPull}
              onRelease={onRelease}
            />
          ) : (
            <div className={`shot-result anim-pop ${shotResult!.critical ? "crit" : shotResult!.hit ? "hit" : "miss"}`} role="status" data-testid={`shot-${side}`}>
              {shotResult!.critical ? "💥 Tam isabet! Zayıf nokta: 3 hasar" : shotResult!.hit ? "🎯 İsabet! 1 hasar" : "Iska! Bir dahaki sefere"}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="team-panel compact" data-side={side} aria-label={`${name} alanı`} data-testid={`team-${side}`}>
      {header}
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
              {correctMsg}
            </div>
          )}
          {!fb && <span className="text-[clamp(13px,2vh,22px)] font-semibold text-ink-soft">Cevabını seç.</span>}
        </footer>
      </div>
    </section>
  );
}
