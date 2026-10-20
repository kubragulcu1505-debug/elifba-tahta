// Halat çekme oyunu testleri. Çalıştırma: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { createTug, reduceTug, currentTugItem, snapshotTug, restoreTug, TUG_DEFAULTS, type TugState } from "../src/lib/tug.ts";
import type { QuestionLite, Side } from "../src/lib/game.ts";
import { TUG_POOLS, getAnyQuestion } from "../src/content/index.ts";
import { LESSONS, LESSON_BY_ID } from "../src/content/lessons.ts";
import { detectFeatures, checkArabicChars } from "../src/content/arabic.ts";

const lite = (lessonId: string): QuestionLite[] =>
  TUG_POOLS[lessonId].map((q) => ({ id: q.id, objectiveId: q.objectiveId, correctOptionId: q.correctOptionId, optionIds: q.options.map((o) => o.id), difficulty: q.difficulty, stimulus: q.stimulus }));

function setup(lessonId = "u1-l1", seed = "t") {
  const pool = lite(lessonId);
  const byId = new Map(pool.map((q) => [q.id, q]));
  const ctx = { pool, lookup: (id: string) => byId.get(id) };
  return { pool, byId, ctx, s: createTug({ lessonId, seed, pool }) };
}
const G = TUG_DEFAULTS.inputGuardMs;

/** Bir takıma soru gösterir, cevaplatır ve gerekiyorsa bekleme sonunda sıradakine geçirir. */
function step(s: TugState, side: Side, correct: boolean, now: number, ctx: ReturnType<typeof setup>["ctx"]) {
  s = reduceTug(s, { type: "QUESTION_VISIBLE", side, now }, ctx);
  const item = currentTugItem(s.teams[side])!;
  const q = ctx.lookup(item.questionId)!;
  const opt = correct ? q.correctOptionId : item.optionOrder.find((o) => o !== q.correctOptionId)!;
  s = reduceTug(s, { type: "ANSWER", side, questionId: q.id, optionId: opt, now: now + G + 10 }, ctx);
  const wait = correct ? TUG_DEFAULTS.correctFeedbackMs : TUG_DEFAULTS.wrongLockMs;
  s = reduceTug(s, { type: "NEXT", side, now: now + G + 10 + wait }, ctx);
  return { s, now: now + G + 20 + wait, stim: q.stimulus! };
}

test("her ders için halat çekme havuzu var; Arapça uyaran, Türkçe şıklar, öğretilmemiş kural yok", () => {
  for (const l of LESSONS) {
    const pool = TUG_POOLS[l.id];
    assert.ok(pool && pool.length >= 20, `${l.id}: havuz ${pool?.length}`);
    for (const q of pool) {
      assert.ok(q.stimulus, `${q.id}: uyaran yok`);
      assert.ok(q.options.every((o) => o.kind === "text"), `${q.id}: Arapça şık`);
      assert.equal(q.options.filter((o) => o.id === q.correctOptionId).length, 1, q.id);
      assert.deepEqual(checkArabicChars(q.stimulus!), [], q.id);
      const allowed = new Set(LESSON_BY_ID.get(q.lessonId)!.allowedFeatures);
      for (const f of detectFeatures(q.stimulus!)) assert.ok(allowed.has(f), `${q.id}: öğretilmemiş ${f}`);
      assert.equal(getAnyQuestion(q.id)?.id, q.id);
    }
  }
  // Harfler 1. derste yalnızca o dersin 7 harfi sorulur.
  assert.equal(new Set(TUG_POOLS["u1-l1"].map((q) => q.stimulus)).size, 7);
});

test("doğru cevap halatı o takıma çeker, yanlış cevap çekmez", () => {
  const { s: s0, ctx } = setup();
  let { s } = step(s0, "left", true, 0, ctx);
  assert.equal(s.rope, -1);
  ({ s } = step(s, "right", true, 0, ctx));
  ({ s } = step(s, "right", true, 10000, ctx));
  assert.equal(s.rope, 1);
  ({ s } = step(s, "left", false, 20000, ctx));
  assert.equal(s.rope, 1);
  assert.equal(s.teams.left.wrong, 1);
});

test("yanlış cevapta 5 saniye beklenir, sonra soru geçer; bu sürede dokunuşlar yok sayılır", () => {
  const { s: s0, ctx } = setup();
  let s = reduceTug(s0, { type: "QUESTION_VISIBLE", side: "left", now: 0 }, ctx);
  const item = currentTugItem(s.teams.left)!;
  const q = ctx.lookup(item.questionId)!;
  const wrong = item.optionOrder.find((o) => o !== q.correctOptionId)!;
  s = reduceTug(s, { type: "ANSWER", side: "left", questionId: q.id, optionId: wrong, now: 1000 }, ctx);
  const locked = s;
  s = reduceTug(s, { type: "ANSWER", side: "left", questionId: q.id, optionId: q.correctOptionId, now: 1500 }, ctx);
  assert.equal(s, locked, "bekleme sırasında cevap kabul edilmez");
  assert.equal(reduceTug(s, { type: "NEXT", side: "left", now: 1000 + 4999 }, ctx), s, "5 saniyeden önce geçmez");
  s = reduceTug(s, { type: "NEXT", side: "left", now: 1000 + 5000 }, ctx);
  assert.equal(s.teams.left.index, 1);
  assert.equal(s.teams.left.phase, "loading");
});

test("iki takım bağımsız ve aynı anda cevap verebilir", () => {
  const { s: s0, ctx } = setup();
  let s = reduceTug(s0, { type: "QUESTION_VISIBLE", side: "left", now: 0 }, ctx);
  s = reduceTug(s, { type: "QUESTION_VISIBLE", side: "right", now: 0 }, ctx);
  const l = ctx.lookup(currentTugItem(s.teams.left)!.questionId)!;
  const r = ctx.lookup(currentTugItem(s.teams.right)!.questionId)!;
  const rightBefore = s.teams.right;
  s = reduceTug(s, { type: "ANSWER", side: "left", questionId: l.id, optionId: l.correctOptionId, now: 600 }, ctx);
  assert.equal(s.teams.right, rightBefore);
  s = reduceTug(s, { type: "ANSWER", side: "right", questionId: r.id, optionId: r.correctOptionId, now: 600 }, ctx);
  assert.equal(s.rope, 0, "iki çekiş birbirini dengeler");
  assert.equal(s.teams.left.correct + s.teams.right.correct, 2);
});

test("sorular sınırsız: deste bitince yeniden karışır, her turda önce bütün harfler gelir, aynı harf arka arkaya gelmez", () => {
  const { s: s0, ctx, pool } = setup("u1-l1", "sonsuz");
  const distinct = new Set(pool.map((q) => q.stimulus)).size;
  let s = s0;
  let now = 0;
  const seen: string[] = [];
  for (let i = 0; i < 300; i++) {
    // Sağ takım hep yanlış yaptığından halat bitmez; sol takım da yanlış yapar.
    const r = step(s, "left", false, now, ctx);
    s = r.s;
    now = r.now;
    seen.push(r.stim);
  }
  assert.equal(s.winner, null);
  assert.ok(s.teams.left.cycle >= 6, `deste en az 6 kez yenilenmeli, ${s.teams.left.cycle}`);
  for (let i = 1; i < seen.length; i++) assert.notEqual(seen[i], seen[i - 1], `${i}. soruda aynı harf arka arkaya`);
  assert.equal(new Set(seen.slice(0, distinct)).size, distinct, "ilk sorularda bütün harfler");
});

test("bayrağı kendi çizgisine ilk çeken kazanır; sonra cevap kabul edilmez", () => {
  const { s: s0, ctx } = setup("u3-l1", "kazan");
  let s = s0;
  let now = 0;
  for (let i = 0; i < TUG_DEFAULTS.target; i++) ({ s, now } = step(s, "right", true, now, ctx));
  assert.equal(s.winner, "right");
  assert.equal(s.rope, TUG_DEFAULTS.target);
  assert.equal(s.teams.left.phase, "finished");
  const after = reduceTug(s, { type: "QUESTION_VISIBLE", side: "left", now }, ctx);
  assert.equal(after, s);
});

test("duraklatma bekleme süresini uzatır, dokunuşları kilitler", () => {
  const { s: s0, ctx } = setup();
  let s = reduceTug(s0, { type: "QUESTION_VISIBLE", side: "left", now: 0 }, ctx);
  const item = currentTugItem(s.teams.left)!;
  const q = ctx.lookup(item.questionId)!;
  s = reduceTug(s, { type: "ANSWER", side: "left", questionId: q.id, optionId: item.optionOrder.find((o) => o !== q.correctOptionId)!, now: 1000 }, ctx);
  s = reduceTug(s, { type: "PAUSE", now: 2000 }, ctx);
  assert.equal(reduceTug(s, { type: "NEXT", side: "left", now: 9000 }, ctx), s);
  s = reduceTug(s, { type: "RESUME", now: 12000 }, ctx);
  assert.equal(s.teams.left.continueAt, 6000 + 10000);
});

test("kaydet/yükle: kalan bekleme korunur, oyun duraklatılmış döner", () => {
  const { s: s0, ctx } = setup();
  let s = reduceTug(s0, { type: "QUESTION_VISIBLE", side: "left", now: 0 }, ctx);
  const item = currentTugItem(s.teams.left)!;
  const q = ctx.lookup(item.questionId)!;
  s = reduceTug(s, { type: "ANSWER", side: "left", questionId: q.id, optionId: item.optionOrder.find((o) => o !== q.correctOptionId)!, now: 1000 }, ctx);
  const saved = JSON.parse(JSON.stringify(snapshotTug(s, 3000)));
  const r = restoreTug(saved, 50);
  assert.equal(r.paused, true);
  assert.equal(r.teams.left.continueAt, 50 + 3000);
  const resumed = reduceTug(r, { type: "RESUME", now: 1050 }, ctx);
  assert.equal(resumed.teams.left.continueAt, 50 + 3000 + 1000);
});
