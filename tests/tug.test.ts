// Halat çekme oyunu testleri. Çalıştırma: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { createTug, reduceTug, currentTugItem, snapshotTug, restoreTug, TUG_DEFAULTS, SIEGE_TARGET, type TugState } from "../src/lib/tug.ts";
import type { QuestionLite, Side } from "../src/lib/game.ts";
import { TUG_POOLS, getAnyQuestion } from "../src/content/index.ts";
import { LESSONS, LESSON_BY_ID } from "../src/content/lessons.ts";
import { detectFeatures, checkArabicChars } from "../src/content/arabic.ts";
import { ANGLE_MAX, ANGLE_MIN, AUTO_POWER, launchFromAngle, launchFromPull, previewPath, simulateShot } from "../src/lib/ballistics.ts";

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

/** Kale: doğru cevap verdirir, nişan aldırır, atışı isabet/ıska olarak indirir ve sıradaki soruya geçer. */
function shoot(s: TugState, side: Side, hit: boolean, now: number, ctx: ReturnType<typeof setup>["ctx"]) {
  s = reduceTug(s, { type: "QUESTION_VISIBLE", side, now }, ctx);
  const item = currentTugItem(s.teams[side])!;
  const q = ctx.lookup(item.questionId)!;
  s = reduceTug(s, { type: "ANSWER", side, questionId: q.id, optionId: q.correctOptionId, now: now + G + 10 }, ctx);
  assert.equal(s.teams[side].phase, "aim");
  s = reduceTug(s, { type: "FIRE", side, now: now + G + 500 }, ctx);
  assert.equal(s.teams[side].phase, "flying");
  s = reduceTug(s, { type: "LAND", side, hit, now: now + G + 1500 }, ctx);
  if (!s.winner) s = reduceTug(s, { type: "NEXT", side, now: now + G + 1500 + TUG_DEFAULTS.landFeedbackMs }, ctx);
  return { s, now: now + G + 2500 };
}

test("kale yıkma: doğru cevaptan sonra nişan alınır; yalnızca isabet eden taş sayılır, 15 isabette rakip kale yıkılır", () => {
  const pool = lite("u1-l6");
  const byId = new Map(pool.map((q) => [q.id, q]));
  const ctx = { pool, lookup: (id: string) => byId.get(id) };
  let s = createTug({ lessonId: "u1-l6", seed: "kale", pool, kind: "siege" });
  assert.equal(s.kind, "siege");
  assert.equal(s.settings.target, SIEGE_TARGET);
  assert.equal(SIEGE_TARGET, 15);
  let now = 0;
  // Sol 14, sağ 14 isabet; araya ıskalar: kimse kazanmaz (halattaki gibi birbirini götürmez).
  for (let i = 0; i < 14; i++) {
    ({ s, now } = shoot(s, "left", true, now, ctx));
    ({ s, now } = shoot(s, "right", true, now, ctx));
  }
  ({ s, now } = shoot(s, "left", false, now, ctx));
  ({ s, now } = step(s, "right", false, now, ctx));
  assert.equal(s.winner, null);
  assert.equal(s.rope, 0, "kale oyununda halat kullanılmaz");
  assert.equal(s.teams.left.correct, 15, "ıskalanan atışın doğru cevabı yine sayılır (puan için)");
  assert.equal(s.teams.left.hits, 14);
  assert.equal(s.teams.right.wrong, 1);
  ({ s, now } = shoot(s, "left", true, now, ctx));
  assert.equal(s.winner, "left");
  assert.equal(s.teams.left.hits, 15);
  assert.equal(s.teams.right.phase, "finished");
});

test("kale yıkma: nişan süresi duraklatmada uzar; duraklatılmışken atış yapılmaz ama havadaki taş iner", () => {
  const pool = lite("u1-l1");
  const byId = new Map(pool.map((q) => [q.id, q]));
  const ctx = { pool, lookup: (id: string) => byId.get(id) };
  let s = createTug({ lessonId: "u1-l1", seed: "nisan", pool, kind: "siege" });
  s = reduceTug(s, { type: "QUESTION_VISIBLE", side: "left", now: 0 }, ctx);
  const q = ctx.lookup(currentTugItem(s.teams.left)!.questionId)!;
  s = reduceTug(s, { type: "ANSWER", side: "left", questionId: q.id, optionId: q.correctOptionId, now: 1000 }, ctx);
  assert.equal(s.teams.left.aimDeadline, 1000 + TUG_DEFAULTS.aimMs);
  s = reduceTug(s, { type: "PAUSE", now: 2000 }, ctx);
  assert.equal(reduceTug(s, { type: "FIRE", side: "left", now: 2500 }, ctx), s, "duraklatılmışken atış yok");
  s = reduceTug(s, { type: "RESUME", now: 5000 }, ctx);
  assert.equal(s.teams.left.aimDeadline, 1000 + TUG_DEFAULTS.aimMs + 3000);
  s = reduceTug(s, { type: "FIRE", side: "left", now: 5100 }, ctx);
  s = reduceTug(s, { type: "PAUSE", now: 5200 }, ctx);
  s = reduceTug(s, { type: "LAND", side: "left", hit: true, now: 5600 }, ctx);
  assert.equal(s.teams.left.hits, 1);
  assert.equal(s.teams.left.lastShot?.hit, true);
  // Kaydet/yükle: havadaki taş kaydedilmez, öğrenci yeniden nişan alır.
  let f = reduceTug(reduceTug(s, { type: "RESUME", now: 6000 }, ctx), { type: "NEXT", side: "left", now: 9000 }, ctx);
  f = reduceTug(f, { type: "QUESTION_VISIBLE", side: "left", now: 9000 }, ctx);
  const q2 = ctx.lookup(currentTugItem(f.teams.left)!.questionId)!;
  f = reduceTug(f, { type: "ANSWER", side: "left", questionId: q2.id, optionId: q2.correctOptionId, now: 9500 }, ctx);
  f = reduceTug(f, { type: "FIRE", side: "left", now: 9600 }, ctx);
  const r = restoreTug(JSON.parse(JSON.stringify(snapshotTug(f, 9700))), 100);
  assert.equal(r.teams.left.phase, "aim");
  assert.equal(r.teams.left.aimDeadline, 100 + TUG_DEFAULTS.aimMs);
});

test("mancınık fiziği: çekme yönü ve gücü atışı belirler; iyi atış isabet eder, zayıf atış kısa düşer", () => {
  const start = { x: 205, y: 100 };
  const target = { x0: 905, x1: 985, y0: 0, y1: 200 };
  // Sol takım sola-aşağı çeker → sağa-yukarı atar; sağ takım aynalanmıştır.
  const l = launchFromPull({ x: -100, y: 100 }, 141.4, "left");
  assert.ok(l.vx > 0 && l.vy > 0);
  assert.ok(Math.abs(l.angleDeg - 45) < 0.5);
  assert.ok(Math.abs(l.power - 1) < 0.01);
  const r = launchFromPull({ x: 100, y: 100 }, 141.4, "right");
  assert.ok(r.vx < 0 && r.vy > 0);
  // İleri doğru çekiş geri atmaz: açı sınırda kalır.
  assert.equal(launchFromPull({ x: 50, y: 50 }, 100, "left").angleDeg, ANGLE_MAX);
  assert.equal(launchFromPull({ x: -50, y: -50 }, 100, "left").angleDeg, ANGLE_MIN);
  assert.equal(simulateShot(start, launchFromAngle(0.8, 45, "left"), target).hit, true, "%80 güç 45°: isabet");
  const weak = simulateShot(start, launchFromAngle(AUTO_POWER, 45, "left"), target);
  assert.equal(weak.hit, false, "süre dolunca yapılan zayıf atış kısa düşer");
  assert.ok(weak.end.x < target.x0 && weak.end.y === 0);
  assert.equal(simulateShot(start, launchFromAngle(1, 45, "left"), target).hit, false, "tam güç 45°: kalenin üstünden aşar");
  // Kısa nişan çizgisi yalnızca uçuşun başını gösterir; kolay nişanda yol taşın düştüğü yere kadar uzanır.
  const shot = simulateShot(start, launchFromAngle(0.8, 45, "left"), target);
  const shortPath = previewPath(shot, false);
  const easyPath = previewPath(shot, true);
  assert.ok(shortPath[shortPath.length - 1].x < 450);
  assert.ok(easyPath[easyPath.length - 1].x > 880);
});

test("kale yıkma hedefi öğretmen ayarından gelir; eski kayıtlar halat çekme sayılır", () => {
  const pool = lite("u1-l1");
  const s = createTug({ lessonId: "u1-l1", seed: "k", pool, kind: "siege", settings: { target: 5 } });
  assert.equal(s.settings.target, 5);
  assert.ok(s.id.startsWith("siege-"));
  const old = { ...createTug({ lessonId: "u1-l1", seed: "k", pool }), kind: undefined };
  assert.ok(createTug({ lessonId: "u1-l1", seed: "k", pool }).id.startsWith("tug-"));
  const byId = new Map(pool.map((q) => [q.id, q]));
  const { s: after } = step(old, "left", true, 0, { pool, lookup: (id: string) => byId.get(id) });
  assert.equal(after.rope, -1);
});
