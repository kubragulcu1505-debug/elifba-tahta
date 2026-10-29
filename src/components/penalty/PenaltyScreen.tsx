"use client";
// Penaltı ve dart ekranı: iki tarafa aynı soru, ilk cevap belirleyici. Penaltıda atış sırası gelen topu
// kaydırarak vurur; dartta gidip gelen çizgiyi "DUR" ile durdurur.
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SIDES, type Side } from "@/lib/game";
import {
  AUTO_KICK,
  currentPenaltyItem,
  reducePenalty,
  restorePenalty,
  snapshotPenalty,
  type Kick,
  type PenaltyAction,
  type PenaltyState,
  type ShootoutKind,
} from "@/lib/penalty";
import { lookupAnyLite, recordFinishedPenalty, sideNames, startDart, startPenalty, toLite } from "@/lib/session";
import { read, write, usePersisted, useHydrated } from "@/lib/storage";
import { LESSON_BY_ID } from "@/content/lessons";
import { TUG_POOLS, getAnyQuestion } from "@/content/index";
import { TapButton } from "@/components/TapButton";
import { SideIcon } from "@/components/PlayerAvatar";
import { Ar, RichText } from "@/components/Arabic";
import { Confetti, Trophy } from "@/components/Celebration";
import { PenaltyStage, shotText } from "./PenaltyStage";
import { KickPad } from "./KickPad";
import { DartStage, dartText } from "./DartStage";
import { StopPad } from "./StopPad";

/** Penaltı ve dart aynı ekranı kullanır; değişen yazılar ve süreler buradadır. */
const KINDS = {
  penalty: {
    key: "activePenalty",
    chip: "Penaltı · sınırsız soru",
    none: "Aktif penaltı oyunu yok",
    noneHint: "Bir ders sayfasından “Penaltı” oyununu başlatın.",
    /** Topun kaleye varma süresi (ms); CSS geçişiyle aynı. */
    flightMs: 750,
    mine: "Doğru! Penaltıyı sen kullan.",
    gift: (rival: string) => `${rival} yanlış cevap verdi, penaltı senin!`,
    waiting: (shooter: string) => `🧤 ${shooter} penaltı kullanıyor…`,
    moving: "Top gidiyor…",
    stat: (score: number, shots: number) => `⚽ ${score} gol / ${shots} penaltı`,
    rule: (t: number) => `İki tarafa aynı soru gelir; ilk cevap doğruysa penaltıyı o kullanır, yanlışsa penaltı rakibe geçer. Önce ${t} gol atan kazanır.`,
    restartQ: "Penaltı oyunu yeniden başlasın mı?",
  },
  dart: {
    key: "activeDart",
    chip: "Dart · sınırsız soru",
    none: "Aktif dart oyunu yok",
    noneHint: "Bir ders sayfasından “Dart” oyununu başlatın.",
    /** Okun tahtaya saplanma süresi (ms); CSS animasyonuyla aynı. */
    flightMs: 450,
    mine: "Doğru! Okunu sen at.",
    gift: (rival: string) => `${rival} yanlış cevap verdi, atış senin!`,
    waiting: (shooter: string) => `🎯 ${shooter} atış yapıyor…`,
    moving: "Ok gidiyor…",
    stat: (score: number, shots: number) => `🎯 ${score} puan / ${shots} atış`,
    rule: (t: number) => `İki tarafa aynı soru gelir; ilk cevap doğruysa atışı o yapar, yanlışsa atış rakibe geçer. Kırmızı merkez 10, dışa doğru 7, 5, 3, 1 puan. Önce ${t} puana ulaşan kazanır.`,
    restartQ: "Dart oyunu yeniden başlasın mı?",
  },
} as const;

const isLongArabic = (s: string) => [...s].filter((c) => c !== " ").length > 7 || s.includes(" ");
const isLongText = (s: string) => s.length > 22;

function loadInitial(kind: ShootoutKind): PenaltyState | null {
  const at = read(KINDS[kind].key);
  if (!at) return null;
  return at.fresh ? at.state : restorePenalty(at.state, performance.now());
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

export function PenaltyScreen({ kind = "penalty" }: { kind?: ShootoutKind }) {
  const hydrated = useHydrated();
  const active = usePersisted(KINDS[kind].key);
  if (!hydrated) return <div className="p-10 text-2xl">Hazırlanıyor…</div>;
  // Yeni oyun başlatılınca bileşen sıfırdan kurulsun (Next.js sayfa durumunu saklar).
  return <PenaltyInner key={active?.state.id ?? "none"} kind={kind} />;
}

function PenaltyInner({ kind }: { kind: ShootoutKind }) {
  const router = useRouter();
  const cfg = KINDS[kind];
  const settings = usePersisted("settings");
  const [state, setState] = useState<PenaltyState | null>(() => loadInitial(kind));
  const [aim, setAim] = useState<Kick | null>(null);
  const [isFs, setIsFs] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [showWin, setShowWin] = useState(false);

  const lessonId = state?.lessonId;
  const pool = useMemo(() => (lessonId ? (TUG_POOLS[lessonId] ?? []).map(toLite) : []), [lessonId]);
  const ctx = useMemo(() => ({ pool, lookup: lookupAnyLite }), [pool]);
  const dispatch = useCallback((a: PenaltyAction) => setState((prev) => (prev ? reducePenalty(prev, a, ctx) : prev)), [ctx]);
  const kick = useCallback(
    (k: Kick) => {
      setAim(null);
      dispatch({ type: "KICK", kick: k, now: performance.now() });
    },
    [dispatch],
  );

  const winner = state?.winner ?? null;
  useEffect(() => {
    if (!winner) return;
    const t = setTimeout(() => setShowWin(true), 1800);
    return () => clearTimeout(t);
  }, [winner]);

  // Bireysel düello bitince öğrencilerin puanları genel tabloya işlenir (aynı oyun bir kez).
  useEffect(() => {
    if (state?.winner && state.players) recordFinishedPenalty(state);
  }, [state]);

  // Kaydet (başka bir oyun başlatıldıysa üzerine yazma).
  useEffect(() => {
    if (!state) return;
    const cur = read(cfg.key);
    if (!cur || cur.state.id !== state.id) return;
    write(cfg.key, { state: snapshotPenalty(state, performance.now(), ctx), savedAtEpoch: Date.now(), fresh: false });
  }, [state, ctx, cfg.key]);

  // Soru ekrana çizilince süre başlar.
  const phase = state?.phase;
  const index = state?.index;
  const cycle = state?.cycle;
  useEffect(() => {
    if (phase !== "loading") return;
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => dispatch({ type: "QUESTION_VISIBLE", now: performance.now() }));
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [phase, index, cycle, dispatch]);

  // Süreler: cevap süresi, vuruş süresi (dolunca zayıf vuruş), topun uçuşu, sonuç ekranı.
  useEffect(() => {
    if (!state || state.winner) return;
    const at = (t: number, a: () => void) => setTimeout(a, Math.max(0, t - performance.now()) + 20);
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (state.phase === "flying") timer = setTimeout(() => dispatch({ type: "LANDED", now: performance.now() }), cfg.flightMs);
    else if (!state.paused && state.phase === "question") timer = at(state.answerDeadline, () => dispatch({ type: "TIMEOUT", now: performance.now() }));
    // Süre dolunca: penaltıda ortaya zayıf vuruş, dartta çizgi o an neredeyse oraya atış.
    else if (!state.paused && state.phase === "kick")
      timer = at(state.kickDeadline, () => (kind === "dart" ? dispatch({ type: "STOP", now: performance.now() }) : kick(AUTO_KICK)));
    else if (!state.paused && state.phase === "result") timer = at(state.continueAt, () => dispatch({ type: "NEXT", now: performance.now() }));
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [state, dispatch, kick, kind, cfg.flightMs]);

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
    if (kind === "dart") startDart(state.lessonId, state.players);
    else startPenalty(state.lessonId, state.players);
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
    <div className="game-root tug-root" data-testid="penalty-root">
      <header className="flex items-center gap-3 border-b-2 border-line bg-surface px-4 py-2">
        <div className="min-w-0 flex-1 truncate text-lg font-extrabold">
          {lesson?.title}
          <span className="ml-3 chip bg-warn-soft text-warn">{duel ? "Bireysel düello · " : ""}{cfg.chip}</span>
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
            router.push(duel ? "/duello" : `/ders/${state.lessonId}`);
          }}
        >
          Çık
        </TapButton>
      </header>

      {kind === "dart" ? (
        <DartStage
          names={names}
          players={state.players}
          scores={state.goals}
          target={state.settings.target}
          phase={state.phase}
          shooter={state.shooter}
          shot={state.shot}
          aimStart={state.aimStart ?? 0}
          pausedAt={state.paused ? state.pausedAt : null}
          winner={state.winner}
        />
      ) : (
        <PenaltyStage
          names={names}
          players={state.players}
          goals={state.goals}
          target={state.settings.target}
          phase={state.phase}
          shooter={state.shooter}
          shot={state.shot}
          aim={aim}
          winner={state.winner}
        />
      )}

      <div className="relative min-h-0">
        <div className="halves h-full">
          <PenaltyPanel side="left" kind={kind} state={state} names={names} dispatch={dispatch} onAim={setAim} onKick={kick} />
          <div className="divider" aria-hidden="true" />
          <PenaltyPanel side="right" kind={kind} state={state} names={names} dispatch={dispatch} onAim={setAim} onKick={kick} />
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
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink/45 p-4" data-testid="penalty-winner">
            <Confetti />
            <div className="card anim-pop flex w-full max-w-3xl flex-col items-center gap-4 p-8 text-center">
              <Trophy />
              <div className={`text-[clamp(28px,5vh,56px)] font-extrabold ${state.winner === "left" ? "text-left" : "text-right"}`}>
                <SideIcon side={state.winner} size={48} player={state.players?.[state.winner]} /> <span className="text-ink">{names[state.winner]} kazandı!</span>
              </div>
              <p className="text-[clamp(16px,2.6vh,28px)]">
                Skor: {state.goals.left} – {state.goals.right}
              </p>
              <p className="text-[clamp(16px,2.6vh,28px)] font-semibold">{duel ? "İki oyuncu da çok güzel oynadı. Tebrikler!" : "İki takım da çok güzel oynadı. Tebrikler!"}</p>
              <div className="grid w-full grid-cols-2 gap-4 text-[clamp(16px,2.4vh,26px)]">
                {SIDES.map((side) => (
                  <div key={side} className={`rounded-2xl border-4 p-3 ${side === "left" ? "border-left bg-left-soft" : "border-right bg-right-soft"}`}>
                    <div className="font-extrabold">{names[side]}</div>
                    <div>
                      {state.correct[side]} doğru · {state.wrong[side]} yanlış · {cfg.stat(state.goals[side], state.kicks[side])}
                    </div>
                    {duel && (
                      <div className="font-extrabold text-ok" data-testid={`duel-points-${side}`}>+{state.correct[side] * 10} puan genel tabloya eklendi</div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-base text-ink-soft">
                {cfg.rule(state.settings.target)}{" "}
                {duel ? "Bireysel düelloda her doğru cevap 10 puandır; iki oyuncunun puanı da genel tabloya eklenir." : "Takım sonucu tek tek öğrencilerin düzeyini göstermez."}
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
              <p className="text-xl text-ink-soft">Skor sıfırlanır, sorular yeniden karışır.</p>
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

function PenaltyPanel({
  side,
  kind,
  state,
  names,
  dispatch,
  onAim,
  onKick,
}: {
  side: Side;
  kind: ShootoutKind;
  state: PenaltyState;
  names: Record<Side, string>;
  dispatch: (a: PenaltyAction) => void;
  onAim: (k: Kick | null) => void;
  onKick: (k: Kick) => void;
}) {
  const cfg = KINDS[kind];
  const item = currentPenaltyItem(state);
  const q = item ? getAnyQuestion(item.questionId) : undefined;
  const now = useNow((state.phase === "question" || state.phase === "kick") && !state.paused);
  const name = names[side];
  const rival = names[side === "left" ? "right" : "left"];
  const header = (
    <header className="flex items-center gap-3">
      <span className={`inline-flex items-center gap-2 text-[clamp(16px,2.6vh,30px)] font-extrabold ${side === "left" ? "text-left" : "text-right"}`}>
        <SideIcon side={side} size={28} player={state.players?.[side]} />
        <span className="text-ink">{name}</span>
      </span>
      <span className="ml-auto flex gap-2 text-[clamp(13px,2vh,22px)] font-bold">
        <span className="chip bg-ok-soft text-ok" data-testid={`correct-${side}`}>✓ {state.correct[side]}</span>
        <span className="chip bg-bad-soft text-bad">✗ {state.wrong[side]}</span>
        <span className="chip bg-warn-soft text-warn">{kind === "dart" ? "🎯" : "⚽"} {state.goals[side]}</span>
      </span>
    </header>
  );
  if (!q || !item) return <section className="team-panel compact" data-side={side} />;
  const correctOpt = q.options.find((o) => o.id === q.correctOptionId)!;
  const answeredWrong = state.first?.side === side && !state.first.correct;
  const iShoot = state.shooter === side;

  // Soru ekranı: iki tarafta aynı soru, şık sırası farklı. İlk dokunan belirler.
  if (state.phase === "loading" || state.phase === "question") {
    const options = item.order[side].map((id) => q.options.find((o) => o.id === id)!);
    const slow = state.phase === "question" && !!state.delayed?.[side] && now > 0 && now < state.inputOpensAt[side];
    const timeLeft = state.phase === "question" && now > 0 ? Math.max(0, Math.ceil((state.answerDeadline - now) / 1000)) : Math.round(state.settings.answerMs / 1000);
    return (
      <section className="team-panel compact" data-side={side} aria-label={`${name} alanı`} data-testid={`team-${side}`}>
        {header}
        <div className="flex min-h-0 flex-1 flex-col gap-[clamp(4px,1vh,14px)]" data-qid={q.id} data-phase={state.phase}>
          <div className="flex min-h-[clamp(96px,18vh,250px)] flex-col items-center justify-center">
            <h2 className="prompt-text">
              <RichText text={q.prompt} /> <span className="pen-clock">⏱ {timeLeft}</span>
            </h2>
            {q.stimulus && (
              <div className={`stimulus ${isLongArabic(q.stimulus) ? "long" : ""}`} data-testid={`stimulus-${side}`}>
                <Ar>{q.stimulus}</Ar>
              </div>
            )}
          </div>
          <div className="options-grid relative" role="group" aria-label="Seçenekler">
            {options.map((o) => (
              <TapButton
                key={o.id}
                className="option-btn"
                data-oid={o.id}
                disabled={state.phase !== "question" || state.paused || !!state.winner}
                ariaLabel={`Seçenek: ${o.label}`}
                onTap={(t) => dispatch({ type: "ANSWER", side, questionId: q.id, optionId: o.id, now: t })}
              >
                <span className={`opt-text ${isLongText(o.label) ? "long" : ""}`}>{o.label}</span>
              </TapButton>
            ))}
            {slow && <div className="pen-slow">⏳ Önceki soruda yanlış: 1 saniye bekle…</div>}
          </div>
          <footer className="flex min-h-[clamp(40px,6vh,70px)] items-center justify-center">
            <span className="text-[clamp(13px,2vh,22px)] font-semibold text-ink-soft">{kind === "dart" ? "Önce doğru cevaplayan atışı yapar!" : "Önce doğru cevaplayan penaltıyı kullanır!"}</span>
          </footer>
        </div>
      </section>
    );
  }

  const reveal = answeredWrong || (!state.first && state.phase === "result");
  const note = (
    <>
      {state.phase === "kick" && iShoot && (
        <p className="pen-note ok">{state.first?.side === side ? cfg.mine : cfg.gift(rival)}</p>
      )}
      {reveal && (
        <div className="anim-in w-full rounded-2xl border-4 border-ok bg-ok-soft p-[clamp(6px,1vh,16px)] text-center" role="status">
          <div className="text-[clamp(16px,2.6vh,30px)] font-extrabold text-ok">
            {answeredWrong ? "Yanlış cevap. " : "Süre doldu. "}Doğru cevap: <span className="text-ink">{correctOpt.label}</span>
          </div>
          <p className="text-[clamp(14px,2.1vh,24px)] leading-snug">
            <RichText text={q.explanation} />
          </p>
        </div>
      )}
    </>
  );

  return (
    <section className="team-panel compact" data-side={side} aria-label={`${name} alanı`} data-testid={`team-${side}`}>
      {header}
      <div className="flex min-h-0 flex-1 flex-col gap-[clamp(4px,1vh,12px)]" data-qid={q.id} data-phase={state.phase}>
        {note}
        {state.phase === "kick" && iShoot && kind === "dart" ? (
          <StopPad
            side={side}
            secondsLeft={Math.max(0, Math.ceil((state.kickDeadline - (now || state.kickDeadline - state.settings.kickMs)) / 1000))}
            aimStart={state.aimStart ?? 0}
            frozenAt={state.paused ? state.pausedAt : null}
            disabled={state.paused || !!state.winner}
            onStop={(t) => dispatch({ type: "STOP", now: t })}
          />
        ) : state.phase === "kick" && iShoot ? (
          <KickPad
            side={side}
            secondsLeft={Math.max(0, Math.ceil((state.kickDeadline - (now || state.kickDeadline - state.settings.kickMs)) / 1000))}
            disabled={state.paused || !!state.winner}
            onAim={onAim}
            onKick={onKick}
          />
        ) : (
          <div className={`pen-wait ${state.phase === "result" && state.shot ? (state.shot.goal ? "goal" : "miss") : ""}`} data-testid={`pen-wait-${side}`}>
            {state.phase === "kick" && cfg.waiting(names[state.shooter!])}
            {state.phase === "flying" && cfg.moving}
            {(state.phase === "result" || state.phase === "finished") &&
              (state.shot
                ? state.shot.dart
                  ? `${dartText(state.shot)} · ${names[state.shot.shooter]}`
                  : `${shotText(state.shot)}${state.shot.goal ? ` ${names[state.shot.shooter]} attı.` : ""}`
                : "Kimse cevap vermedi.")}
          </div>
        )}
      </div>
    </section>
  );
}
