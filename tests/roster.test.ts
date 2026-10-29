// Bireysel düello: maç kaydı ve genel puan tablosu testleri. Çalıştırma: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { leaderboard, makeDuelRecord, studentsOfClass, POINTS_PER_CORRECT, type Student } from "../src/lib/roster.ts";
import { createGame } from "../src/lib/game.ts";
import { createTug } from "../src/lib/tug.ts";

const st = (id: string, name: string, classId = "6a"): Student => ({ id, classId, name, createdAtEpoch: 0 });
const P = { left: { id: "a", name: "Ali" }, right: { id: "b", name: "Büşra" } };

test("maç kaydı: her doğru 10 puan; kazanan, kaybeden ve beraberlik", () => {
  const r = makeDuelRecord({ id: "g1", game: "letters", lessonId: "u1-l6", finishedAtEpoch: 1, players: P, stats: { left: { correct: 27, wrong: 3 }, right: { correct: 25, wrong: 5 } }, winner: "left" });
  assert.equal(POINTS_PER_CORRECT, 10);
  assert.deepEqual(
    [r.players.left.points, r.players.left.outcome, r.players.right.points, r.players.right.outcome],
    [270, "win", 250, "loss"],
  );
  const t = makeDuelRecord({ id: "g2", game: "siege", lessonId: "u1-l6", finishedAtEpoch: 2, players: P, stats: { left: { correct: 5, wrong: 0 }, right: { correct: 5, wrong: 0 } }, winner: "tie" });
  assert.equal(t.players.left.outcome, "tie");
  assert.equal(t.players.right.outcome, "tie");
});

test("genel tablo: puanlar toplanır, oyun türüne göre ayrılır, sıralama puan sonra galibiyet; eşitler aynı sırayı paylaşır", () => {
  const students = [st("a", "Ali"), st("b", "Büşra"), st("c", "Cem"), st("d", "Deniz")];
  const recs = [
    makeDuelRecord({ id: "1", game: "letters", lessonId: "u1-l6", finishedAtEpoch: 1, players: P, stats: { left: { correct: 20, wrong: 10 }, right: { correct: 25, wrong: 5 } }, winner: "right" }),
    makeDuelRecord({ id: "2", game: "siege", lessonId: "u3-l1", finishedAtEpoch: 2, players: { left: { id: "c", name: "Cem" }, right: { id: "a", name: "Ali" } }, stats: { left: { correct: 10, wrong: 2 }, right: { correct: 15, wrong: 1 } }, winner: "right" }),
    // Silinmiş öğrencinin kaydı: yalnızca rakibi (Deniz) sayılır.
    makeDuelRecord({ id: "3", game: "siege", lessonId: "u1-l6", finishedAtEpoch: 3, players: { left: { id: "x", name: "Silinen" }, right: { id: "d", name: "Deniz" } }, stats: { left: { correct: 15, wrong: 0 }, right: { correct: 25, wrong: 0 } }, winner: "right" }),
  ];
  const rows = leaderboard(students, recs);
  const by = Object.fromEntries(rows.map((r) => [r.student.id, r]));
  assert.equal(by.a.points, 350);
  assert.deepEqual(by.a.byGame, { letters: 200, siege: 150, penalty: 0, dart: 0 });
  assert.equal(by.a.matches, 2);
  assert.equal(by.a.wins, 1);
  assert.equal(by.b.points, 250);
  assert.equal(by.d.points, 250);
  assert.deepEqual(rows.map((r) => r.student.name), ["Ali", "Büşra", "Deniz", "Cem"]);
  assert.equal(by.a.rank, 1);
  assert.equal(by.b.rank, 2);
  assert.equal(by.d.rank, 2, "puan ve galibiyet eşit: aynı sıra");
  assert.equal(by.c.rank, 4);
  assert.equal(rows.length, 4, "silinmiş öğrenci tabloda yok");
});

test("sınıfın öğrencileri Türkçe alfabeye göre sıralanır", () => {
  const roster = { classes: [{ id: "6a", name: "6-A" }], students: [st("1", "Zeynep"), st("2", "Çağla"), st("3", "Can"), st("4", "Ömer", "6b")] };
  assert.deepEqual(studentsOfClass(roster, "6a").map((s) => s.name), ["Can", "Çağla", "Zeynep"]);
});

test("oyun durumları düellodaki iki öğrenciyi taşır; takım oyununda taşımaz", () => {
  const q = [{ id: "q1", objectiveId: "o", correctOptionId: "a", optionIds: ["a", "b"], difficulty: 1 as const }];
  assert.deepEqual(createGame({ lessonId: "u1-l6", mode: "competition", seed: "s", questions: q, players: P }).players, P);
  assert.equal(createGame({ lessonId: "u1-l6", mode: "competition", seed: "s", questions: q }).players, undefined);
  assert.deepEqual(createTug({ lessonId: "u1-l6", seed: "s", pool: q, kind: "siege", players: P }).players, P);
  assert.equal("players" in createTug({ lessonId: "u1-l6", seed: "s", pool: q }), false);
});
