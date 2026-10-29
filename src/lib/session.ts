"use client";
// Oyun oturumu yardımcıları: başlatma, tekrar, sonuç kaydı.
import { createGame, computeResult, objectiveStats, type DuelPlayer, type GameMode, type GameState, type QuestionLite, type Side } from "./game";
import { newSeed } from "./rng";
import { questionsForLesson, getQuestion, TUG_POOLS, getAnyQuestion } from "@/content/index";
import { createTug, type TugState } from "./tug";
import { createPenalty, type PenaltyState } from "./penalty";
import type { Question } from "@/content/types";
import { read, update, write, type GameRecord } from "./storage";
import { DUEL_LETTERS_LESSON, makeDuelRecord, type DuelGame, type DuelRecord } from "./roster";

type Players = Record<Side, DuelPlayer> | undefined;

export function toLite(q: Question): QuestionLite {
  return { id: q.id, objectiveId: q.objectiveId, correctOptionId: q.correctOptionId, optionIds: q.options.map((o) => o.id), difficulty: q.difficulty, stimulus: q.stimulus };
}

export function lookupLite(id: string): QuestionLite | undefined {
  const q = getQuestion(id);
  return q ? toLite(q) : undefined;
}

/** Yarışmayı başlatır: ortak 30 soru bir kez seçilir, takımlar için ayrı sıralanır. Düelloda iki öğrenci verilir. */
export function startCompetition(lessonId: string, players?: Players): GameState {
  const questions = questionsForLesson(lessonId).map(toLite);
  const state = createGame({ lessonId, mode: "competition", seed: newSeed(), questions, nowEpoch: Date.now(), players });
  write("activeGame", { state, savedAtEpoch: Date.now(), fresh: true });
  update("ui", (u) => ({ ...u, lastLessonId: lessonId }));
  return state;
}

/** Halat çekme oyununu başlatır (dersin soru havuzu, sınırsız). */
export function startTug(lessonId: string): TugState {
  const pool = (TUG_POOLS[lessonId] ?? []).map(toLite);
  const state = createTug({ lessonId, seed: newSeed(), pool, settings: { target: read("settings").tugTarget } });
  write("activeTug", { state, savedAtEpoch: Date.now(), fresh: true });
  return state;
}

/** Kale yıkma oyununu başlatır (halat çekmeyle aynı soru havuzu, sınırsız). Düelloda iki öğrenci verilir. */
export function startSiege(lessonId: string, players?: Players): TugState {
  const pool = (TUG_POOLS[lessonId] ?? []).map(toLite);
  const state = createTug({ lessonId, seed: newSeed(), pool, kind: "siege", players, settings: { target: read("settings").siegeTarget, easyAim: read("settings").easyAim } });
  write("activeSiege", { state, savedAtEpoch: Date.now(), fresh: true });
  return state;
}

/** Penaltı oyununu başlatır (dersin soru havuzu, sınırsız; iki tarafa aynı soru). Düelloda iki öğrenci verilir. */
export function startPenalty(lessonId: string, players?: Players): PenaltyState {
  const pool = (TUG_POOLS[lessonId] ?? []).map(toLite);
  const state = createPenalty({ lessonId, seed: newSeed(), pool, players, settings: { target: read("settings").penaltyTarget } });
  write("activePenalty", { state, savedAtEpoch: Date.now(), fresh: true });
  return state;
}

/** Bireysel düelloyu başlatır ve oyunun sayfa yolunu döndürür. */
export function startDuel(game: DuelGame, lessonId: string, players: Record<Side, DuelPlayer>): string {
  if (game === "letters") {
    startCompetition(DUEL_LETTERS_LESSON, players);
    return "/oyun";
  }
  if (game === "penalty") {
    startPenalty(lessonId, players);
    return "/penalti";
  }
  startSiege(lessonId, players);
  return "/kale";
}

/** Halat çekme sorularını da kapsayan arama. */
export function lookupAnyLite(id: string): QuestionLite | undefined {
  const q = getAnyQuestion(id);
  return q ? toLite(q) : undefined;
}

/** Puansız tekrar: her takım (ya da düelloda her öğrenci) kendi yanlış sorularını çözer. */
export function startReview(lessonId: string, wrong: Record<Side, string[]>, players?: Players): GameState {
  const toList = (ids: string[]) => [...new Set(ids)].map((id) => getQuestion(id)).filter((q): q is Question => !!q).map(toLite);
  const all = toList([...wrong.left, ...wrong.right]);
  const mode: GameMode = "review";
  const state = createGame({
    lessonId,
    mode,
    seed: newSeed(),
    questions: all,
    perTeam: { left: toList(wrong.left), right: toList(wrong.right) },
    nowEpoch: Date.now(),
    players,
  });
  write("activeGame", { state, savedAtEpoch: Date.now(), fresh: true });
  return state;
}

/** Oyundaki taraf adları: düelloda öğrenci adları, takım oyununda ayarlardaki takım adları. */
export function sideNames(players: Players): Record<Side, string> {
  return players ? { left: players.left.name, right: players.right.name } : read("settings").teamNames;
}

function saveDuel(rec: DuelRecord): void {
  const duels = read("duels");
  if (duels.some((d) => d.id === rec.id)) return;
  write("duels", [rec, ...duels]);
}

/** Biten yarışmayı geçmişe bir kez kaydeder; düelloysa öğrencilerin puanlarını genel tabloya da işler. */
export function recordFinishedGame(state: GameState): void {
  if (state.mode !== "competition") return;
  const result = computeResult(state);
  if (!result.winner) return;
  if (state.players) {
    saveDuel(
      makeDuelRecord({
        id: state.id,
        game: "letters",
        lessonId: state.lessonId,
        finishedAtEpoch: Date.now(),
        players: state.players,
        stats: {
          left: { correct: result.teams.left.correct, wrong: result.teams.left.total - result.teams.left.correct },
          right: { correct: result.teams.right.correct, wrong: result.teams.right.total - result.teams.right.correct },
        },
        winner: result.winner,
      }),
    );
  }
  const history = read("history");
  if (history.some((h) => h.id === state.id)) return;
  const names = sideNames(state.players);
  const rec: GameRecord = {
    id: state.id,
    lessonId: state.lessonId,
    finishedAtEpoch: Date.now(),
    winner: result.winner,
    decidedBy: result.decidedBy,
    teams: {
      left: { ...result.teams.left, name: names.left, objectives: objectiveStats(state.teams.left) },
      right: { ...result.teams.right, name: names.right, objectives: objectiveStats(state.teams.right) },
    },
  };
  write("history", [rec, ...history].slice(0, 300));
}

/** Biten bireysel kale yıkmayı genel tabloya bir kez işler. */
export function recordFinishedSiege(state: TugState): void {
  if (state.kind !== "siege" || !state.players || !state.winner) return;
  saveDuel(
    makeDuelRecord({
      id: state.id,
      game: "siege",
      lessonId: state.lessonId,
      finishedAtEpoch: Date.now(),
      players: state.players,
      stats: {
        left: { correct: state.teams.left.correct, wrong: state.teams.left.wrong },
        right: { correct: state.teams.right.correct, wrong: state.teams.right.wrong },
      },
      winner: state.winner,
    }),
  );
}

/** Biten bireysel penaltıyı genel tabloya bir kez işler. */
export function recordFinishedPenalty(state: PenaltyState): void {
  if (!state.players || !state.winner) return;
  saveDuel(
    makeDuelRecord({
      id: state.id,
      game: "penalty",
      lessonId: state.lessonId,
      finishedAtEpoch: Date.now(),
      players: state.players,
      stats: {
        left: { correct: state.correct.left, wrong: state.wrong.left },
        right: { correct: state.correct.right, wrong: state.wrong.right },
      },
      winner: state.winner,
    }),
  );
}

export function lastRecordForLesson(lessonId: string): GameRecord | undefined {
  return read("history").find((h) => h.lessonId === lessonId);
}
