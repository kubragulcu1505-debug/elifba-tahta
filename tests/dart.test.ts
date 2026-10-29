// Dart oyunu testleri. Çalıştırma: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createPenalty,
  reducePenalty,
  currentPenaltyItem,
  sweepPos,
  dartPoints,
  DART_RANGE,
  DART_SWEEP_MS,
  DART_TARGET,
  PENALTY_DEFAULTS,
  type PenaltyState,
} from "../src/lib/penalty.ts";
import type { QuestionLite, Side } from "../src/lib/game.ts";
import { TUG_POOLS } from "../src/content/index.ts";

const lite = (lessonId: string): QuestionLite[] =>
  TUG_POOLS[lessonId].map((q) => ({ id: q.id, objectiveId: q.objectiveId, correctOptionId: q.correctOptionId, optionIds: q.options.map((o) => o.id), difficulty: q.difficulty, stimulus: q.stimulus }));

function setup(seed = "d") {
  const pool = lite("u1-l6");
  const byId = new Map(pool.map((q) => [q.id, q]));
  const ctx = { pool, lookup: (id: string) => byId.get(id) };
  return { ctx, s: createPenalty({ lessonId: "u1-l6", seed, pool, kind: "dart" }) };
}
const G = PENALTY_DEFAULTS.inputGuardMs;
/** Çizginin merkezden (0) geçtiği an: gidiş yolunun ortası. */
const CENTER_MS = DART_SWEEP_MS / 4;

function answer(s: PenaltyState, side: Side, correct: boolean, now: number, ctx: ReturnType<typeof setup>["ctx"]) {
  s = reducePenalty(s, { type: "QUESTION_VISIBLE", now }, ctx);
  const item = currentPenaltyItem(s)!;
  const q = ctx.lookup(item.questionId)!;
  const opt = correct ? q.correctOptionId : item.order[side].find((o) => o !== q.correctOptionId)!;
  return reducePenalty(s, { type: "ANSWER", side, questionId: q.id, optionId: opt, now: now + G + 100 }, ctx);
}

test("gidip gelen çizgi: soldan başlar, ortadan geçer, sağa varıp geri döner", () => {
  assert.ok(Math.abs(sweepPos(0) + DART_RANGE) < 1e-9);
  assert.ok(Math.abs(sweepPos(CENTER_MS)) < 1e-9);
  assert.ok(Math.abs(sweepPos(DART_SWEEP_MS / 2) - DART_RANGE) < 1e-9);
  assert.ok(Math.abs(sweepPos((3 * DART_SWEEP_MS) / 4)) < 1e-9);
  assert.ok(Math.abs(sweepPos(DART_SWEEP_MS) + DART_RANGE) < 1e-9);
});

test("puan: kırmızı merkez 10; merkezden uzaklaştıkça 7, 5, 3, 1; tahtanın dışı 0", () => {
  assert.deepEqual(
    [0, 0.08, -0.2, 0.45, -0.7, 0.95, 1.1].map(dartPoints),
    [10, 10, 7, 5, 3, 1, 0],
  );
});

test("dart: ilk doğru cevap atışı yapar; DUR dediği andaki yere göre puan alır; yanlışta atış rakibe geçer", () => {
  const { s: s0, ctx } = setup();
  assert.equal(s0.kind, "dart");
  assert.equal(s0.settings.target, DART_TARGET);
  let s = answer(s0, "left", true, 0, ctx);
  assert.equal(s.shooter, "left");
  const start = s.aimStart;
  assert.equal(reducePenalty(s, { type: "KICK", kick: { col: 0, row: 0, out: null }, now: start + 100 }, ctx), s, "dartta penaltı vuruşu yok");
  s = reducePenalty(s, { type: "STOP", now: start + CENTER_MS }, ctx);
  assert.equal(s.phase, "flying");
  assert.equal(s.shot?.dart?.points, 10, "çizgi merkezdeyken durdurmak kırmızıyı vurur");
  s = reducePenalty(s, { type: "LANDED", now: start + 2000 }, ctx);
  assert.equal(s.goals.left, 10);
  s = reducePenalty(s, { type: "NEXT", now: start + 2000 + PENALTY_DEFAULTS.resultMs }, ctx);
  s = answer(s, "left", false, 20000, ctx);
  assert.equal(s.shooter, "right");
  s = reducePenalty(s, { type: "STOP", now: s.aimStart + 5 }, ctx);
  assert.equal(s.shot?.dart?.points, 0, "çizgi en soldayken tahtanın dışı");
  s = reducePenalty(s, { type: "LANDED", now: 30000 }, ctx);
  assert.equal(s.goals.right, 0);
});

test("dart: önce 50 puana ulaşan kazanır; duraklatma çizgiyi bekletir", () => {
  const { s: s0, ctx } = setup("kazan");
  let s = s0;
  let now = 0;
  for (let i = 0; i < 5; i++) {
    s = answer(s, "right", true, now, ctx);
    s = reducePenalty(s, { type: "PAUSE", now: s.aimStart + 100 }, ctx);
    s = reducePenalty(s, { type: "RESUME", now: s.aimStart + 3100 }, ctx);
    // Duraklama 3 sn sürdü: çizgi kaldığı yerden devam eder, merkez 3 sn sonra gelir.
    s = reducePenalty(s, { type: "STOP", now: s.aimStart + CENTER_MS }, ctx);
    assert.equal(s.shot?.dart?.points, 10);
    s = reducePenalty(s, { type: "LANDED", now: now + 6000 }, ctx);
    if (!s.winner) s = reducePenalty(s, { type: "NEXT", now: now + 6000 + PENALTY_DEFAULTS.resultMs }, ctx);
    now += 10000;
  }
  assert.equal(s.goals.right, 50);
  assert.equal(s.winner, "right");
});
