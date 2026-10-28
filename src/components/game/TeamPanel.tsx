"use client";
import { useEffect, useState } from "react";
import { currentItem, liveTotalMs, formatMs, type GameAction, type GameState, type Side } from "@/lib/game";
import { getQuestion } from "@/content/index";
import { TapButton } from "@/components/TapButton";
import { SideIcon } from "@/components/PlayerAvatar";
import { Ar, RichText } from "@/components/Arabic";

/** Etkinken ~200 ms'de bir güncellenen monoton saat (render sırasında performance.now çağrılmaz). */
function useNow(active: boolean, deps: unknown, ms = 200): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(performance.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, ms);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [active, ms, deps]);
  return now;
}

const isLongArabic = (s: string) => [...s].filter((c) => c !== " ").length > 7 || s.includes(" ");
const isLongText = (s: string) => s.length > 22;

export function TeamPanel({
  side,
  game,
  name,
  dispatch,
  fontsReady,
  threshold,
}: {
  side: Side;
  game: GameState;
  name: string;
  dispatch: (a: GameAction) => void;
  fontsReady: boolean;
  threshold: number;
}) {
  const team = game.teams[side];
  const item = currentItem(team);
  const q = item ? getQuestion(item.questionId) : undefined;
  const competition = game.mode === "competition";
  const running = team.phase === "question" && !game.paused;
  const now = useNow(running || team.phase === "feedback", `${team.index}-${team.phase}-${game.paused}`);

  // Soru gerçekten ekrana çizildikten sonra saati başlat (yükleme süresi sayılmaz).
  useEffect(() => {
    if (team.phase !== "loading" || !fontsReady) return;
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => dispatch({ type: "QUESTION_VISIBLE", side, now: performance.now() }));
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [team.phase, team.index, fontsReady, dispatch, side]);

  const total = team.queue.length;
  const shownIndex = Math.min(team.index + 1, total);
  const sideColor = side === "left" ? "text-left" : "text-right";

  return (
    <section className="team-panel" data-side={side} aria-label={`${name} alanı`} data-testid={`team-${side}`}>
      <header className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className={`inline-flex items-center gap-2 text-[clamp(18px,3vh,34px)] font-extrabold ${sideColor}`}>
          <SideIcon side={side} size={34} player={game.players?.[side]} />
          <span className="text-ink">{name}</span>
        </span>
        <span className="ml-auto flex flex-wrap items-center gap-2 text-[clamp(14px,2.2vh,24px)] font-bold">
          <span className="chip bg-surface" data-testid={`progress-${side}`}>
            {team.phase === "finished" ? total : shownIndex}/{total}
          </span>
          {competition && (
            <>
              <span className="chip bg-ok-soft text-ok" data-testid={`correct-${side}`}>✓ {team.correctCount} doğru</span>
              <span className="chip bg-surface" data-testid={`score-${side}`}>{team.score} puan</span>
              <span className="chip bg-surface tabular-nums text-ink-soft" title="Yarışma süresi">⏱ {formatMs(liveTotalMs(team, Math.max(now, team.runningSince ?? 0)))}</span>
            </>
          )}
        </span>
      </header>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface" aria-hidden="true">
        <div
          className={`h-full rounded-full ${side === "left" ? "bg-left" : "bg-right"}`}
          style={{ width: `${(team.answers.length / Math.max(1, total)) * 100}%` }}
        />
      </div>

      {team.phase === "finished" ? (
        <FinishedCard game={game} side={side} threshold={threshold} />
      ) : q && item ? (
        <QuestionView key={item.questionId} game={game} side={side} dispatch={dispatch} now={now} />
      ) : (
        <div className="flex-1" />
      )}
    </section>
  );
}

function QuestionView({ game, side, dispatch, now }: { game: GameState; side: Side; dispatch: (a: GameAction) => void; now: number }) {
  const team = game.teams[side];
  const item = currentItem(team)!;
  const q = getQuestion(item.questionId)!;
  const options = item.optionOrder.map((id) => q.options.find((o) => o.id === id)!);
  const fb = team.phase === "feedback" ? team.lastAnswer : null;
  const canContinue = team.phase === "feedback" && !game.paused && now >= team.continueAt;
  const correctOpt = q.options.find((o) => o.id === q.correctOptionId)!;
  const competition = game.mode === "competition";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[clamp(6px,1.2vh,16px)]" data-qid={q.id} data-phase={team.phase}>
      <div className="relative flex min-h-[clamp(110px,22vh,300px)] flex-col items-center justify-center">
        {fb && !fb.correct ? (
          <div className="anim-in w-full rounded-2xl border-4 border-ok bg-ok-soft p-[clamp(8px,1.4vh,20px)] text-center" role="status">
            <div className="text-[clamp(18px,3vh,34px)] font-extrabold text-ok">Doğru cevap:</div>
            <div className="flex justify-center">
              {correctOpt.kind === "arabic" ? (
                <Ar className="text-[clamp(44px,8vh,100px)]">{correctOpt.label}</Ar>
              ) : (
                <span className="text-[clamp(18px,3vh,34px)] font-bold">{correctOpt.label}</span>
              )}
            </div>
            <p className="mt-1 text-[clamp(15px,2.4vh,28px)] leading-snug">
              <RichText text={q.explanation} />
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
          let state: string | undefined;
          if (fb) {
            if (o.id === q.correctOptionId) state = "correct";
            else if (o.id === fb.optionId) state = "wrong";
            else state = "dim";
          }
          return (
            <TapButton
              key={o.id}
              className="option-btn"
              data-oid={o.id}
              state={state}
              disabled={team.phase !== "question" || game.paused}
              ariaLabel={`Seçenek: ${o.label}`}
              onTap={(t) => dispatch({ type: "ANSWER", side, questionId: q.id, optionId: o.id, now: t })}
            >
              {o.kind === "arabic" ? (
                <Ar className={`opt-ar ${isLongArabic(o.label) ? "long" : ""}`}>{o.label}</Ar>
              ) : (
                <span className={`opt-text ${isLongText(o.label) ? "long" : ""}`}>{o.label}</span>
              )}
            </TapButton>
          );
        })}
      </div>

      <footer className="flex min-h-[clamp(56px,8vh,90px)] items-center justify-center">
        {fb?.correct && (
          <div className="anim-pop rounded-full bg-ok px-8 py-2 text-[clamp(20px,3.4vh,40px)] font-extrabold text-white" role="status">
            Doğru! {competition ? `+${game.settings.pointsCorrect}` : ""}
          </div>
        )}
        {fb && !fb.correct && (
          <TapButton
            className={`big-btn ${side === "left" ? "bg-left" : "bg-right"} text-white`}
            disabled={!canContinue}
            onTap={(t) => dispatch({ type: "NEXT", side, now: t })}
          >
            {team.index + 1 >= team.queue.length ? "Bitir ▶" : "Sıradaki soru ▶"}
          </TapButton>
        )}
        {!fb && <span className="text-[clamp(14px,2.2vh,24px)] font-semibold text-ink-soft">Cevabını seç.</span>}
      </footer>
    </div>
  );
}

function FinishedCard({ game, side, threshold }: { game: GameState; side: Side; threshold: number }) {
  const t = game.teams[side];
  const other: Side = side === "left" ? "right" : "left";
  const otherDone = game.teams[other].phase === "finished";
  const competition = game.mode === "competition";
  const pct = t.queue.length ? Math.round((t.correctCount / t.queue.length) * 100) : 0;
  const reviewCorrect = t.answers.filter((a) => a.correct).length;
  return (
    <div className="anim-pop flex flex-1 flex-col items-center justify-center gap-4 text-center" data-testid={`finished-${side}`}>
      <div className="text-[clamp(28px,5vh,60px)] font-extrabold">{competition ? "Bitirdiniz!" : "Tekrar tamamlandı!"}</div>
      {competition ? (
        <div className="grid grid-cols-3 gap-4 text-[clamp(16px,2.6vh,30px)]">
          <Stat label="Doğru" value={`${t.correctCount}/${t.queue.length}`} />
          <Stat label="Puan" value={String(t.score)} />
          <Stat label="Süre" value={formatMs(t.totalMs)} />
        </div>
      ) : (
        <div className="text-[clamp(18px,3vh,32px)]">
          {t.queue.length === 0 ? "Tekrar edilecek soru yoktu." : `${reviewCorrect}/${t.queue.length} soruyu doğru cevapladınız.`}
        </div>
      )}
      {competition && (
        <p className="text-[clamp(14px,2.2vh,24px)] text-ink-soft">
          Başarı: %{pct} (önerilen eşik %{threshold})
        </p>
      )}
      {!otherDone && (
        <p className="max-w-md rounded-2xl bg-surface p-4 text-[clamp(16px,2.6vh,28px)] font-semibold">
          Diğer takım devam ediyor. Onları sessizce bekleyelim.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card px-5 py-3">
      <div className="text-ink-soft">{label}</div>
      <div className="font-extrabold tabular-nums">{value}</div>
    </div>
  );
}
