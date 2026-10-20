// Oyun motoru testleri. Çalıştırma: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame, spreadSameStimulus, reduce, computeResult, snapshotForSave, restoreFromSave, liveTotalMs, currentItem, DEFAULT_SETTINGS, type GameState, type QuestionLite, type Side } from "../src/lib/game.ts";
import { questionsForLesson } from "../src/content/index.ts";

const qs: QuestionLite[] = questionsForLesson("u3-l1").map((q) => ({
  id: q.id, objectiveId: q.objectiveId, correctOptionId: q.correctOptionId, optionIds: q.options.map((o) => o.id), difficulty: q.difficulty, stimulus: q.stimulus,
}));
const byId = new Map(qs.map((q) => [q.id, q]));
const lookup = (id: string) => byId.get(id);
const G = DEFAULT_SETTINGS.inputGuardMs;

function newGame(seed = "test-seed"): GameState {
  return createGame({ lessonId: "u3-l1", mode: "competition", seed, questions: qs });
}
function cur(s: GameState, side: Side) {
  const item = currentItem(s.teams[side])!;
  return { item, q: byId.get(item.questionId)! };
}
/** Bir takıma görünür → (bekle) → cevap → devam akışı uygular. */
function play(s: GameState, side: Side, correct: boolean, startNow: number, thinkMs: number): { s: GameState; now: number } {
  let now = startNow;
  s = reduce(s, { type: "QUESTION_VISIBLE", side, now }, lookup);
  now += thinkMs;
  const { item, q } = cur(s, side);
  const opt = correct ? q.correctOptionId : item.optionOrder.find((o) => o !== q.correctOptionId)!;
  s = reduce(s, { type: "ANSWER", side, questionId: q.id, optionId: opt, now }, lookup);
  now += correct ? DEFAULT_SETTINGS.correctFeedbackMs : DEFAULT_SETTINGS.wrongFeedbackMs;
  s = reduce(s, { type: "NEXT", side, now }, lookup);
  return { s, now };
}

test("iki takım aynı 30 soru kümesini farklı sırada alıyor", () => {
  const s = newGame();
  const L = s.teams.left.queue.map((x) => x.questionId);
  const R = s.teams.right.queue.map((x) => x.questionId);
  assert.equal(L.length, 30);
  assert.deepEqual([...L].sort(), [...R].sort());
  assert.notDeepEqual(L, R);
  assert.equal(new Set(L).size, 30);
});

test("aynı harf iki takımın sırasında da arka arkaya gelmiyor", () => {
  const letters: QuestionLite[] = questionsForLesson("u1-l6").map((q) => ({
    id: q.id, objectiveId: q.objectiveId, correctOptionId: q.correctOptionId, optionIds: q.options.map((o) => o.id), difficulty: q.difficulty, stimulus: q.stimulus,
  }));
  for (const seed of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
    const s = createGame({ lessonId: "u1-l6", mode: "competition", seed, questions: letters });
    for (const side of ["left", "right"] as Side[]) {
      const stim = s.teams[side].queue.map((x) => letters.find((q) => q.id === x.questionId)!.stimulus);
      for (let i = 1; i < stim.length; i++) assert.notEqual(stim[i], stim[i - 1], `${seed}/${side}: ${i}. sırada aynı harf`);
    }
  }
  const one = spreadSameStimulus([{ id: "x", objectiveId: "o", correctOptionId: "c", optionIds: ["c"], difficulty: 1, stimulus: "ا" }]);
  assert.equal(one.length, 1);
});

test("şık sırası değişse de doğru cevap eşlemesi korunuyor", () => {
  const s = newGame();
  for (const side of ["left", "right"] as Side[]) {
    for (const item of s.teams[side].queue) {
      const q = byId.get(item.questionId)!;
      assert.deepEqual([...item.optionOrder].sort(), [...q.optionIds].sort());
      assert.ok(item.optionOrder.includes(q.correctOptionId));
    }
  }
});

test("soru kümesi bir kez oluşur; aynı tohum aynı oyunu verir (render'da yeniden karışmaz)", () => {
  const a = newGame("x");
  const b = newGame("x");
  assert.deepEqual(a.teams.left.queue, b.teams.left.queue);
  assert.deepEqual(a.teams.right.queue, b.teams.right.queue);
  const c = newGame("y");
  assert.notDeepEqual(a.teams.left.queue, c.teams.left.queue);
});

test("sırayla zorluk: her uyaranın bir kez geçtiği derste kolaydan zora bantlar", () => {
  const uniq: QuestionLite[] = questionsForLesson("u4-l1").map((q) => ({
    id: q.id, objectiveId: q.objectiveId, correctOptionId: q.correctOptionId, optionIds: q.options.map((o) => o.id), difficulty: q.difficulty, stimulus: q.stimulus,
  }));
  const s = createGame({ lessonId: "u4-l1", mode: "competition", seed: "z", questions: uniq });
  for (const side of ["left", "right"] as Side[]) {
    const d = s.teams[side].queue.map((x) => uniq.find((q) => q.id === x.questionId)!.difficulty);
    assert.deepEqual(d, [...d].sort((a, b) => a - b));
  }
});

test("harfler oyununda önce 28 harfin hepsi birer kez karışık sorulur, sonra tekrar başlar", () => {
  const letters: QuestionLite[] = questionsForLesson("u1-l6").map((q) => ({
    id: q.id, objectiveId: q.objectiveId, correctOptionId: q.correctOptionId, optionIds: q.options.map((o) => o.id), difficulty: q.difficulty, stimulus: q.stimulus,
  }));
  const distinct = new Set(letters.map((q) => q.stimulus)).size;
  assert.equal(distinct, 28);
  const firstOrders = new Set<string>();
  for (const seed of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
    const s = createGame({ lessonId: "u1-l6", mode: "competition", seed, questions: letters });
    for (const side of ["left", "right"] as Side[]) {
      const stim = s.teams[side].queue.map((x) => letters.find((q) => q.id === x.questionId)!.stimulus!);
      assert.equal(new Set(stim.slice(0, distinct)).size, distinct, `${seed}/${side}: ilk ${distinct} soruda bütün harfler yok`);
      for (let k = 1; k * distinct <= stim.length; k++) {
        const counts = new Map<string, number>();
        for (const x of stim.slice(0, k * distinct)) counts.set(x, (counts.get(x) ?? 0) + 1);
        assert.ok([...counts.values()].every((c) => c === k), `${seed}/${side}: ${k}. tur dengesiz`);
      }
      firstOrders.add(stim.slice(0, distinct).join(""));
    }
  }
  assert.ok(firstOrders.size > 4, "ilk turun sırası karışık olmalı");
});

test("bir taraftaki cevap diğer tarafı etkilemiyor", () => {
  let s = newGame();
  s = reduce(s, { type: "QUESTION_VISIBLE", side: "left", now: 0 }, lookup);
  s = reduce(s, { type: "QUESTION_VISIBLE", side: "right", now: 0 }, lookup);
  const rightBefore = s.teams.right;
  const { q } = cur(s, "left");
  s = reduce(s, { type: "ANSWER", side: "left", questionId: q.id, optionId: q.correctOptionId, now: 1000 }, lookup);
  assert.equal(s.teams.left.phase, "feedback");
  assert.equal(s.teams.right, rightBefore, "sağ takımın durumu hiç değişmemeli");
  // Sol takımın sorusunu sağ takım adına cevaplamak kabul edilmez.
  const s2 = reduce(s, { type: "ANSWER", side: "right", questionId: q.id, optionId: q.correctOptionId, now: 1200 }, lookup);
  if (cur(s, "right").q.id !== q.id) assert.equal(s2, s);
});

test("eşzamanlı dokunuşlar: iki takım aynı anda cevap verebiliyor", () => {
  let s = newGame();
  s = reduce(s, { type: "QUESTION_VISIBLE", side: "left", now: 0 }, lookup);
  s = reduce(s, { type: "QUESTION_VISIBLE", side: "right", now: 0 }, lookup);
  const l = cur(s, "left").q;
  const r = cur(s, "right").q;
  s = reduce(s, { type: "ANSWER", side: "left", questionId: l.id, optionId: l.correctOptionId, now: 900 }, lookup);
  s = reduce(s, { type: "ANSWER", side: "right", questionId: r.id, optionId: r.correctOptionId, now: 900 }, lookup);
  assert.equal(s.teams.left.correctCount, 1);
  assert.equal(s.teams.right.correctCount, 1);
});

test("aynı soruda art arda dokunuş ek puan veya ikinci cevap üretmiyor", () => {
  let s = newGame();
  s = reduce(s, { type: "QUESTION_VISIBLE", side: "left", now: 0 }, lookup);
  const { q, item } = cur(s, "left");
  const wrong = item.optionOrder.find((o) => o !== q.correctOptionId)!;
  // Koruma süresi içinde dokunuş yok sayılır.
  const early = reduce(s, { type: "ANSWER", side: "left", questionId: q.id, optionId: q.correctOptionId, now: G - 1 }, lookup);
  assert.equal(early, s);
  s = reduce(s, { type: "ANSWER", side: "left", questionId: q.id, optionId: wrong, now: G + 10 }, lookup);
  const after = s;
  s = reduce(s, { type: "ANSWER", side: "left", questionId: q.id, optionId: q.correctOptionId, now: G + 20 }, lookup);
  s = reduce(s, { type: "ANSWER", side: "left", questionId: q.id, optionId: q.correctOptionId, now: G + 30 }, lookup);
  assert.equal(s, after);
  assert.equal(s.teams.left.answers.length, 1);
  assert.equal(s.teams.left.score, 0);
  assert.equal(s.teams.left.correctCount, 0);
});

test("yanlış cevaptan sonra zorunlu geri bildirim bitmeden geçilemiyor ve bu süre sayılmıyor", () => {
  let s = newGame();
  s = reduce(s, { type: "QUESTION_VISIBLE", side: "left", now: 0 }, lookup);
  const { q, item } = cur(s, "left");
  const wrong = item.optionOrder.find((o) => o !== q.correctOptionId)!;
  s = reduce(s, { type: "ANSWER", side: "left", questionId: q.id, optionId: wrong, now: 3000 }, lookup);
  const tooSoon = reduce(s, { type: "NEXT", side: "left", now: 3000 + DEFAULT_SETTINGS.wrongFeedbackMs - 1 }, lookup);
  assert.equal(tooSoon, s);
  s = reduce(s, { type: "NEXT", side: "left", now: 3000 + DEFAULT_SETTINGS.wrongFeedbackMs + 5000 }, lookup);
  assert.equal(s.teams.left.index, 1);
  assert.equal(s.teams.left.totalMs, 3000);
  // Yükleme aşaması da sayılmaz: soru görünene kadar saat işlemez.
  assert.equal(liveTotalMs(s.teams.left, 999999), 3000);
});

test("duraklatma süresi iki takım için de yarışma süresine eklenmiyor", () => {
  let s = newGame();
  s = reduce(s, { type: "QUESTION_VISIBLE", side: "left", now: 0 }, lookup);
  s = reduce(s, { type: "QUESTION_VISIBLE", side: "right", now: 0 }, lookup);
  s = reduce(s, { type: "PAUSE", now: 1000 }, lookup);
  // Duraklatılmışken cevap kabul edilmez.
  const l = cur(s, "left").q;
  assert.equal(reduce(s, { type: "ANSWER", side: "left", questionId: l.id, optionId: l.correctOptionId, now: 5000 }, lookup), s);
  assert.equal(liveTotalMs(s.teams.left, 60000), 1000);
  assert.equal(liveTotalMs(s.teams.right, 60000), 1000);
  s = reduce(s, { type: "RESUME", now: 61000 }, lookup);
  // Devam ettikten sonra koruma süresi yeniden uygulanır.
  s = reduce(s, { type: "ANSWER", side: "left", questionId: l.id, optionId: l.correctOptionId, now: 61000 + G + 500 }, lookup);
  assert.equal(s.teams.left.totalMs, 1000 + G + 500);
  assert.equal(liveTotalMs(s.teams.right, 61000 + 2000), 1000 + 2000);
});

test("biten taraf diğer tarafı durdurmuyor", () => {
  let s = newGame();
  let now = 0;
  for (let i = 0; i < 30; i++) ({ s, now } = play(s, "left", true, now, 800));
  assert.equal(s.teams.left.phase, "finished");
  assert.equal(computeResult(s).winner, null, "diğer takım bitmeden kazanan yok");
  const r = s.teams.right;
  assert.equal(r.phase, "loading");
  ({ s } = play(s, "right", true, now, 800));
  assert.equal(s.teams.right.index, 1);
  assert.equal(s.teams.right.correctCount, 1);
});

test("sonuç: önce doğru sayısı, eşitse kısa süre kazanır; tam eşitlikte berabere", () => {
  // Sol 29 doğru, sağ 30 doğru ama yavaş → sağ kazanır (doğru sayısı).
  let s = newGame();
  let a = 0, b = 0;
  for (let i = 0; i < 30; i++) ({ s, now: a } = play(s, "left", i !== 0, a, 500));
  for (let i = 0; i < 30; i++) ({ s, now: b } = play(s, "right", true, b, 4000));
  let r = computeResult(s);
  assert.equal(r.teams.left.correct, 29);
  assert.equal(r.teams.left.score, 290);
  assert.equal(r.teams.right.score, 300);
  assert.equal(r.winner, "right");
  assert.equal(r.decidedBy, "correct");
  assert.deepEqual(r.teams.left.wrongQuestionIds.length, 1);

  // Eşit doğru → süre.
  s = newGame("t2");
  a = 0; b = 0;
  for (let i = 0; i < 30; i++) ({ s, now: a } = play(s, "left", true, a, 1000));
  for (let i = 0; i < 30; i++) ({ s, now: b } = play(s, "right", true, b, 900));
  r = computeResult(s);
  assert.equal(r.teams.left.totalMs, 30000);
  assert.equal(r.teams.right.totalMs, 27000);
  assert.equal(r.winner, "right");
  assert.equal(r.decidedBy, "time");

  // Tam eşitlik.
  s = newGame("t3");
  a = 0; b = 0;
  for (let i = 0; i < 30; i++) ({ s, now: a } = play(s, "left", true, a, 1000));
  for (let i = 0; i < 30; i++) ({ s, now: b } = play(s, "right", true, b, 1000));
  assert.equal(computeResult(s).winner, "tie");
});

test("tekrar (puansız) modu: her takım kendi yanlışlarını çözer, puan ve süre değişmez", () => {
  const leftWrong = qs.slice(0, 3);
  const s0 = createGame({ lessonId: "u3-l1", mode: "review", seed: "r", questions: qs, perTeam: { left: leftWrong, right: [] } });
  assert.equal(s0.teams.left.queue.length, 3);
  assert.equal(s0.teams.right.phase, "finished");
  let s = reduce(s0, { type: "QUESTION_VISIBLE", side: "left", now: 0 }, lookup);
  const { q } = cur(s, "left");
  s = reduce(s, { type: "ANSWER", side: "left", questionId: q.id, optionId: q.correctOptionId, now: 2000 }, lookup);
  assert.equal(s.teams.left.score, 0);
  assert.equal(s.teams.left.totalMs, 0);
  assert.equal(s.teams.left.answers.length, 1);
  assert.equal(computeResult(s).winner, null);
});

test("kaydet/yükle: sayfa yenilenince oyun duraklatılmış olarak ve süresi korunarak döner", () => {
  let s = newGame();
  s = reduce(s, { type: "QUESTION_VISIBLE", side: "left", now: 100 }, lookup);
  const saved = JSON.parse(JSON.stringify(snapshotForSave(s, 2100)));
  const restored = restoreFromSave(saved, 5);
  assert.equal(restored.paused, true);
  assert.equal(restored.teams.left.elapsedCurrent, 2000);
  let t = reduce(restored, { type: "QUESTION_VISIBLE", side: "left", now: 10 }, lookup);
  t = reduce(t, { type: "RESUME", now: 20 }, lookup);
  const { q } = cur(t, "left");
  t = reduce(t, { type: "ANSWER", side: "left", questionId: q.id, optionId: q.correctOptionId, now: 20 + G + 1000 }, lookup);
  assert.equal(t.teams.left.totalMs, 2000 + G + 1000);
});
