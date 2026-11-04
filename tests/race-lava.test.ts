// Cezalı araba yarışı ve lava düşme testleri. Çalıştırma: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { createTug, reduceTug, currentTugItem, TUG_DEFAULTS, RACE_TARGET, LAVA_LIVES, RACE_LAVA_WRONG_MS, type TugKind, type TugState } from "../src/lib/tug.ts";
import type { QuestionLite, Side } from "../src/lib/game.ts";
import { TUG_POOLS, LAVA_POOL } from "../src/content/index.ts";

const lite = (qs: typeof LAVA_POOL): QuestionLite[] =>
  qs.map((q) => ({ id: q.id, objectiveId: q.objectiveId, correctOptionId: q.correctOptionId, optionIds: q.options.map((o) => o.id), difficulty: q.difficulty, stimulus: q.stimulus }));

function setup(kind: TugKind, settings?: Partial<typeof TUG_DEFAULTS>) {
  const pool = lite(kind === "lava" ? LAVA_POOL : TUG_POOLS["u1-l6"]);
  const byId = new Map(pool.map((q) => [q.id, q]));
  const ctx = { pool, lookup: (id: string) => byId.get(id) };
  return { ctx, s: createTug({ lessonId: "u1-l6", seed: kind, pool, kind, settings }) };
}
const G = TUG_DEFAULTS.inputGuardMs;

/** Bir tarafa soru gösterir, cevaplatır ve (oyun bitmediyse) sıradakine geçirir. */
function step(s: TugState, side: Side, correct: boolean, now: number, ctx: ReturnType<typeof setup>["ctx"]) {
  s = reduceTug(s, { type: "QUESTION_VISIBLE", side, now }, ctx);
  const item = currentTugItem(s.teams[side])!;
  const q = ctx.lookup(item.questionId)!;
  const opt = correct ? q.correctOptionId : item.optionOrder.find((o) => o !== q.correctOptionId)!;
  s = reduceTug(s, { type: "ANSWER", side, questionId: q.id, optionId: opt, now: now + G + 10 }, ctx);
  if (!s.winner) s = reduceTug(s, { type: "NEXT", side, now: now + G + 10 + RACE_LAVA_WRONG_MS }, ctx);
  return { s, now: now + G + 20 + RACE_LAVA_WRONG_MS };
}

test("araba: doğru cevap 1 basamak ileri; arka arkaya 3 yanlışta 1 basamak geri; başlangıçtan geriye gidilmez", () => {
  const { s: s0, ctx } = setup("race");
  assert.equal(s0.settings.target, RACE_TARGET);
  assert.equal(RACE_TARGET, 15);
  let { s, now } = step(s0, "left", false, 0, ctx);
  ({ s, now } = step(s, "left", false, now, ctx));
  ({ s, now } = step(s, "left", false, now, ctx));
  assert.equal(s.teams.left.pos, 0, "başlangıçtan geriye gidilmez");
  assert.equal(s.teams.left.streak, 0);
  ({ s, now } = step(s, "left", true, now, ctx));
  ({ s, now } = step(s, "left", true, now, ctx));
  assert.equal(s.teams.left.pos, 2);
  ({ s, now } = step(s, "left", false, now, ctx));
  ({ s, now } = step(s, "left", false, now, ctx));
  assert.equal(s.teams.left.pos, 2, "2 yanlışta yerinde kalır");
  assert.equal(s.teams.left.streak, 2);
  ({ s, now } = step(s, "left", true, now, ctx));
  ({ s, now } = step(s, "left", false, now, ctx));
  ({ s, now } = step(s, "left", false, now, ctx));
  assert.equal(s.teams.left.pos, 3, "araya doğru cevap girince sayaç sıfırlanır");
  s = reduceTug(s, { type: "QUESTION_VISIBLE", side: "left", now }, ctx);
  const item = currentTugItem(s.teams.left)!;
  const q = ctx.lookup(item.questionId)!;
  s = reduceTug(s, { type: "ANSWER", side: "left", questionId: q.id, optionId: item.optionOrder.find((o) => o !== q.correctOptionId)!, now: now + G + 10 }, ctx);
  assert.equal(s.teams.left.pos, 2, "3. yanlışta 1 basamak geri");
  assert.equal(s.teams.left.lastBack, true);
});

test("araba: bitiş çizgisine ilk ulaşan kazanır", () => {
  const { s: s0, ctx } = setup("race", { target: 5 });
  let s = s0;
  let now = 0;
  for (let i = 0; i < 4; i++) {
    ({ s, now } = step(s, "right", true, now, ctx));
    ({ s, now } = step(s, "left", true, now, ctx));
  }
  assert.equal(s.winner, null);
  ({ s, now } = step(s, "right", true, now, ctx));
  assert.equal(s.winner, "right");
  assert.equal(s.teams.left.phase, "finished");
});

test("araba: 30 soru bitince önde olan kazanır; berabere ise birer soruluk uzatma", () => {
  const { s: s0, ctx } = setup("race", { questionLimit: 4 });
  let s = s0;
  let now = 0;
  for (let i = 0; i < 4; i++) ({ s, now } = step(s, "left", i % 2 === 0, now, ctx));
  assert.equal(s.teams.left.phase, "waiting", "soruları biten taraf rakibini bekler");
  for (let i = 0; i < 4; i++) ({ s, now } = step(s, "right", i % 2 === 0, now, ctx));
  assert.equal(s.winner, null);
  assert.equal(s.overtime, true);
  assert.equal(s.settings.questionLimit, 5);
  ({ s, now } = step(s, "left", true, now, ctx));
  ({ s, now } = step(s, "right", false, now, ctx));
  assert.equal(s.winner, "left");
});

test("lava: her yanlış lava yaklaştırır; 5. yanlışta takım lava düşer ve rakip kazanır", () => {
  const { s: s0, ctx } = setup("lava");
  assert.equal(s0.settings.target, LAVA_LIVES);
  assert.equal(LAVA_LIVES, 5);
  let s = s0;
  let now = 0;
  for (let i = 0; i < 4; i++) ({ s, now } = step(s, "left", false, now, ctx));
  ({ s, now } = step(s, "left", true, now, ctx));
  assert.equal(s.winner, null);
  assert.equal(s.teams.left.wrong, 4);
  ({ s, now } = step(s, "left", false, now, ctx));
  assert.equal(s.winner, "right", "lava düşen takım elenir");
});

test("lava: sorular bitince daha az yanlış yapan kazanır; berabere ise uzatma", () => {
  const { s: s0, ctx } = setup("lava", { questionLimit: 3 });
  let s = s0;
  let now = 0;
  for (const c of [true, false, true]) ({ s, now } = step(s, "left", c, now, ctx));
  for (const c of [false, true, true]) ({ s, now } = step(s, "right", c, now, ctx));
  assert.equal(s.overtime, true);
  ({ s, now } = step(s, "left", false, now, ctx));
  ({ s, now } = step(s, "right", true, now, ctx));
  assert.equal(s.winner, "right");
});

test("lava soru havuzu: Kur'an harfleri, üstünlü ve cezimli harflerden karışık", () => {
  const units = new Set(LAVA_POOL.map((q) => q.id.split("-")[0]));
  assert.deepEqual([...units].sort(), ["u1", "u3", "u4"]);
  assert.ok(LAVA_POOL.length >= 30);
});
