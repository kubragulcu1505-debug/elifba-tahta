"use client";
// Oyun oturumu yardımcıları: başlatma, tekrar, sonuç kaydı.
import { createGame, computeResult, objectiveStats, type GameMode, type GameState, type QuestionLite, type Side } from "./game";
import { newSeed } from "./rng";
import { questionsForLesson, getQuestion, TUG_POOLS, getAnyQuestion } from "@/content/index";
import { createTug, type TugState } from "./tug";
import type { Question } from "@/content/types";
import { read, update, write, type GameRecord } from "./storage";

export function toLite(q: Question): QuestionLite {
  return { id: q.id, objectiveId: q.objectiveId, correctOptionId: q.correctOptionId, optionIds: q.options.map((o) => o.id), difficulty: q.difficulty, stimulus: q.stimulus };
}

export function lookupLite(id: string): QuestionLite | undefined {
  const q = getQuestion(id);
  return q ? toLite(q) : undefined;
}

/** Yarışmayı başlatır: ortak 30 soru bir kez seçilir, takımlar için ayrı sıralanır. */
export function startCompetition(lessonId: string): GameState {
  const questions = questionsForLesson(lessonId).map(toLite);
  const state = createGame({ lessonId, mode: "competition", seed: newSeed(), questions, nowEpoch: Date.now() });
  write("activeGame", { state, savedAtEpoch: Date.now(), fresh: true });
  update("ui", (u) => ({ ...u, lastLessonId: lessonId }));
  return state;
}

/** Puansız tekrar: her takım kendi yanlış sorularını çözer. */
/** Halat çekme oyununu başlatır (dersin soru havuzu, sınırsız). */
export function startTug(lessonId: string): TugState {
  const pool = (TUG_POOLS[lessonId] ?? []).map(toLite);
  const state = createTug({ lessonId, seed: newSeed(), pool, settings: { target: read("settings").tugTarget } });
  write("activeTug", { state, savedAtEpoch: Date.now(), fresh: true });
  return state;
}

/** Kale yıkma oyununu başlatır (halat çekmeyle aynı soru havuzu, sınırsız). */
export function startSiege(lessonId: string): TugState {
  const pool = (TUG_POOLS[lessonId] ?? []).map(toLite);
  const state = createTug({ lessonId, seed: newSeed(), pool, kind: "siege", settings: { target: read("settings").siegeTarget } });
  write("activeSiege", { state, savedAtEpoch: Date.now(), fresh: true });
  return state;
}

/** Halat çekme sorularını da kapsayan arama. */
export function lookupAnyLite(id: string): QuestionLite | undefined {
  const q = getAnyQuestion(id);
  return q ? toLite(q) : undefined;
}

export function startReview(lessonId: string, wrong: Record<Side, string[]>): GameState {
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
  });
  write("activeGame", { state, savedAtEpoch: Date.now(), fresh: true });
  return state;
}

/** Biten yarışmayı geçmişe bir kez kaydeder. */
export function recordFinishedGame(state: GameState): void {
  if (state.mode !== "competition") return;
  const result = computeResult(state);
  if (!result.winner) return;
  const history = read("history");
  if (history.some((h) => h.id === state.id)) return;
  const names = read("settings").teamNames;
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

export function lastRecordForLesson(lessonId: string): GameRecord | undefined {
  return read("history").find((h) => h.lessonId === lessonId);
}
