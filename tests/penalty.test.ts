// Penaltı oyunu testleri. Çalıştırma: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createPenalty,
  reducePenalty,
  currentPenaltyItem,
  kickFromSwipe,
  keeperFor,
  snapshotPenalty,
  restorePenalty,
  PENALTY_DEFAULTS,
  AUTO_KICK,
  type Kick,
  type PenaltyState,
} from "../src/lib/penalty.ts";
import type { QuestionLite, Side } from "../src/lib/game.ts";
import { TUG_POOLS } from "../src/content/index.ts";

const lite = (lessonId: string): QuestionLite[] =>
  TUG_POOLS[lessonId].map((q) => ({ id: q.id, objectiveId: q.objectiveId, correctOptionId: q.correctOptionId, optionIds: q.options.map((o) => o.id), difficulty: q.difficulty, stimulus: q.stimulus }));

function setup(seed = "p", settings?: Partial<typeof PENALTY_DEFAULTS>) {
  const pool = lite("u1-l6");
  const byId = new Map(pool.map((q) => [q.id, q]));
  const ctx = { pool, lookup: (id: string) => byId.get(id) };
  return { ctx, s: createPenalty({ lessonId: "u1-l6", seed, pool, settings }) };
}
const G = PENALTY_DEFAULTS.inputGuardMs;

/** Soruyu gösterir, `side` cevaplar (doğru/yanlış). */
function answer(s: PenaltyState, side: Side, correct: boolean, now: number, ctx: ReturnType<typeof setup>["ctx"]) {
  s = reducePenalty(s, { type: "QUESTION_VISIBLE", now }, ctx);
  const item = currentPenaltyItem(s)!;
  const q = ctx.lookup(item.questionId)!;
  const opt = correct ? q.correctOptionId : item.order[side].find((o) => o !== q.correctOptionId)!;
  return reducePenalty(s, { type: "ANSWER", side, questionId: q.id, optionId: opt, now: now + G + 1100 }, ctx);
}

/** Vuruşu yapar, topu indirir ve (oyun bitmediyse) sıradaki soruya geçer. */
function kick(s: PenaltyState, k: Kick, now: number, ctx: ReturnType<typeof setup>["ctx"]) {
  s = reducePenalty(s, { type: "KICK", kick: k, now }, ctx);
  s = reducePenalty(s, { type: "LANDED", now: now + 800 }, ctx);
  if (!s.winner) s = reducePenalty(s, { type: "NEXT", now: now + 800 + PENALTY_DEFAULTS.resultMs }, ctx);
  return s;
}

/** Kalecinin atlamadığı bir köşe (gol garantisi). */
const goalKick = (s: PenaltyState): Kick => {
  const k = keeperFor(s.seed, s.cycle, s.index);
  return { col: k === 0 ? 1 : 0, row: 0, out: null };
};

test("iki tarafa aynı soru gelir; şık sıraları taraf başına ayrı karıştırılır", () => {
  const { s } = setup("ayni");
  const item = currentPenaltyItem(s)!;
  assert.ok(item.questionId);
  assert.deepEqual([...item.order.left].sort(), [...item.order.right].sort());
  const differs = s.deck.some((d) => d.order.left.join() !== d.order.right.join());
  assert.ok(differs, "en az bir soruda şık sırası farklı");
});

test("ilk cevap doğruysa penaltıyı o kullanır; yanlışsa penaltı karşı tarafa geçer; ikinci cevap yok sayılır", () => {
  const { s: s0, ctx } = setup();
  let s = answer(s0, "left", true, 0, ctx);
  assert.equal(s.phase, "kick");
  assert.equal(s.shooter, "left");
  const q = ctx.lookup(currentPenaltyItem(s)!.questionId)!;
  assert.equal(reducePenalty(s, { type: "ANSWER", side: "right", questionId: q.id, optionId: q.correctOptionId, now: 5000 }, ctx), s, "geç kalan cevap sayılmaz");
  s = kick(s, goalKick(s), 6000, ctx);
  s = answer(s, "left", false, 10000, ctx);
  assert.equal(s.shooter, "right", "yanlış cevapta penaltı rakibe geçer");
  assert.deepEqual([s.correct.left, s.wrong.left, s.correct.right], [1, 1, 0]);
});

test("kaleci topla aynı tarafa atlarsa kurtarır; farklı tarafa atlarsa gol; auta giden top gol olmaz", () => {
  const { s: s0, ctx } = setup("kaleci");
  let s = answer(s0, "right", true, 0, ctx);
  const k = keeperFor(s.seed, s.cycle, s.index);
  const saved = reducePenalty(s, { type: "KICK", kick: { col: k, row: 1, out: null }, now: 3000 }, ctx);
  assert.equal(saved.shot?.goal, false);
  assert.equal(saved.shot?.keeperCol, k);
  const wide = reducePenalty(s, { type: "KICK", kick: { col: 1, row: 0, out: "wide" }, now: 3000 }, ctx);
  assert.equal(wide.shot?.goal, false);
  s = reducePenalty(s, { type: "KICK", kick: goalKick(s), now: 3000 }, ctx);
  assert.equal(s.shot?.goal, true);
  assert.equal(s.goals.right, 0, "gol top kaleye varınca sayılır");
  s = reducePenalty(s, { type: "LANDED", now: 3800 }, ctx);
  assert.equal(s.goals.right, 1);
  assert.equal(s.phase, "result");
});

test("önce 5 gol atan kazanır; kazanınca soru gelmez", () => {
  const { s: s0, ctx } = setup("kazan");
  let s = s0;
  let now = 0;
  for (let i = 0; i < 5; i++) {
    s = answer(s, "left", true, now, ctx);
    s = kick(s, goalKick(s), now + 3000, ctx);
    now += 10000;
  }
  assert.equal(s.winner, "left");
  assert.equal(s.goals.left, 5);
  assert.equal(s.phase, "finished");
  assert.equal(reducePenalty(s, { type: "QUESTION_VISIBLE", now }, ctx), s);
});

test("kimse cevap vermezse süre dolunca soru geçer; yanlış cevap veren sonraki soruda 1 saniye geç başlar", () => {
  const { s: s0, ctx } = setup("sure");
  let s = reducePenalty(s0, { type: "QUESTION_VISIBLE", now: 0 }, ctx);
  assert.equal(reducePenalty(s, { type: "TIMEOUT", now: PENALTY_DEFAULTS.answerMs - 1 }, ctx), s);
  s = reducePenalty(s, { type: "TIMEOUT", now: PENALTY_DEFAULTS.answerMs }, ctx);
  assert.equal(s.phase, "result");
  assert.equal(s.shooter, null);
  s = reducePenalty(s, { type: "NEXT", now: PENALTY_DEFAULTS.answerMs + PENALTY_DEFAULTS.resultMs }, ctx);
  assert.equal(s.index, 1);
  s = answer(s, "left", false, 20000, ctx);
  s = kick(s, AUTO_KICK, 25000, ctx);
  s = reducePenalty(s, { type: "QUESTION_VISIBLE", now: 40000 }, ctx);
  assert.equal(s.inputOpensAt.left, 40000 + G + PENALTY_DEFAULTS.wrongDelayMs);
  assert.equal(s.inputOpensAt.right, 40000 + G);
});

test("kaydırma: yön köşeyi, uzunluk yüksekliği belirler; çok yana ya da çok sert vuruş dışarı gider", () => {
  const max = 200;
  assert.equal(kickFromSwipe({ x: 0, y: -10 }, max), null, "çok kısa kaydırma vuruş sayılmaz");
  assert.deepEqual(kickFromSwipe({ x: 0, y: -80 }, max), { col: 0, row: 0, out: null });
  assert.deepEqual(kickFromSwipe({ x: -40, y: -140 }, max), { col: -1, row: 1, out: null });
  assert.deepEqual(kickFromSwipe({ x: 30, y: -80 }, max), { col: 1, row: 0, out: null });
  assert.equal(kickFromSwipe({ x: 150, y: -60 }, max)?.out, "wide");
  assert.equal(kickFromSwipe({ x: 0, y: -199 }, max)?.out, "over");
  assert.equal(kickFromSwipe({ x: 0, y: 80 }, max)?.out, "short", "geriye kaydırma topu ileri göndermez");
});

test("kaleci üç tarafa da atlayabilir; duraklatma süreleri uzatır; kaydet/yükle havadaki topu sonuçlandırır", () => {
  const seen = new Set<number>();
  for (let i = 0; i < 60; i++) seen.add(keeperFor("x", 0, i));
  assert.deepEqual([...seen].sort(), [-1, 0, 1]);
  const { s: s0, ctx } = setup("dur");
  let s = answer(s0, "left", true, 0, ctx);
  const dl = s.kickDeadline;
  s = reducePenalty(s, { type: "PAUSE", now: 2000 }, ctx);
  assert.equal(reducePenalty(s, { type: "KICK", kick: AUTO_KICK, now: 2500 }, ctx), s, "duraklatılmışken vuruş yok");
  s = reducePenalty(s, { type: "RESUME", now: 6000 }, ctx);
  assert.equal(s.kickDeadline, dl + 4000);
  s = reducePenalty(s, { type: "KICK", kick: goalKick(s), now: 6100 }, ctx);
  const saved = JSON.parse(JSON.stringify(snapshotPenalty(s, 6200, ctx)));
  const r = restorePenalty(saved, 100);
  assert.equal(r.goals.left, 1, "havadaki top kayıtta gol olarak işlenir");
  assert.equal(r.phase, "result");
  assert.equal(r.paused, true);
});

test("soru duraklatılmışken görünürse cevap süresi devam edince tam 10 saniyedir; geç başlama yalnızca yanlış yapan tarafta", () => {
  const { s: s0, ctx } = setup("durgor");
  let s = reducePenalty(s0, { type: "PAUSE", now: 0 }, ctx);
  s = reducePenalty(s, { type: "QUESTION_VISIBLE", now: 5000 }, ctx);
  s = reducePenalty(s, { type: "RESUME", now: 9000 }, ctx);
  assert.equal(s.answerDeadline, 9000 + PENALTY_DEFAULTS.answerMs);
  assert.deepEqual(s.delayed, { left: false, right: false });
  assert.ok(s.inputOpensAt.left <= 9000 + G);
});
