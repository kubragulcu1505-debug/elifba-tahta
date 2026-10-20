// İçerik doğrulama testleri. Çalıştırma: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { LESSONS, LESSON_BY_ID, UNITS } from "../src/content/lessons.ts";
import { LESSON_QUESTION_IDS, QUESTION_BY_ID, questionsForLesson, LESSON_POOLS, PRACTICE_POOLS, AUDIO_CATALOG, GAME_LESSONS, gameLessonOf } from "../src/content/index.ts";
import { checkArabicChars, detectFeatures, canonical, skeleton } from "../src/content/arabic.ts";
import { LETTERS, forms } from "../src/content/letters.ts";
import { TANZIL_EXCERPT } from "../src/content/quran.ts";
import type { Question } from "../src/content/types.ts";

const arabicSegments = (s: string) => [...s.matchAll(/⟪([^⟫]*)⟫/g)].map((m) => m[1]);

function arabicStringsOf(q: Question): string[] {
  const xs: string[] = [];
  if (q.stimulus) xs.push(q.stimulus);
  for (const o of q.options) if (o.kind === "arabic") xs.push(...o.label.split(" + "));
  xs.push(...arabicSegments(q.prompt));
  return xs;
}

test("28 harf var, lâmelif harf listesinde yok", () => {
  assert.equal(LETTERS.length, 28);
  assert.ok(!LETTERS.some((l) => l.display.includes("لا")));
  assert.deepEqual(LETTERS.map((l) => l.order), Array.from({ length: 28 }, (_, i) => i + 1));
});

test("bağlanmayan harflerin başta yazılışı tatvil almaz", () => {
  for (const l of LETTERS.filter((x) => x.joining === "right")) {
    assert.ok(!forms(l).initial.includes("ـ"), l.id);
  }
  assert.deepEqual(
    LETTERS.filter((x) => x.joining === "right").map((x) => x.display).join(""),
    "ادذرزو",
  );
});

test("harfler ünitesinde tek takım oyunu var ve 28 harfin hepsini içeriyor", () => {
  const unit1 = LESSONS.filter((l) => l.unitId === "u1");
  const games = new Set(unit1.map((l) => gameLessonOf(l.id)));
  assert.deepEqual([...games], ["u1-l6"]);
  for (const l of unit1) assert.equal(LESSON_QUESTION_IDS[l.id] !== undefined, l.id === "u1-l6", l.id);
  const stimuli = new Set(questionsForLesson("u1-l6").map((q) => q.stimulus));
  assert.equal(stimuli.size, 28);
  assert.deepEqual([...stimuli].sort(), LETTERS.map((l) => l.display).sort());
});

test("kendi oyunu olmayan ders, var olan bir oyuna yönlendiriyor", () => {
  for (const l of LESSONS.filter((x) => x.gameLessonId)) {
    assert.ok(LESSON_QUESTION_IDS[l.gameLessonId!], `${l.id} → ${l.gameLessonId} oyunu yok`);
    assert.equal(LESSON_BY_ID.get(l.gameLessonId!)!.gameLessonId, undefined, "yönlendirme zinciri olmamalı");
  }
});

test("her oyunun tam 30 benzersiz sorusu var", () => {
  for (const lesson of GAME_LESSONS) {
    const ids = LESSON_QUESTION_IDS[lesson.id];
    assert.ok(ids, `${lesson.id} için soru yok`);
    assert.equal(ids.length, 30, `${lesson.id}: ${ids.length} soru`);
    assert.equal(new Set(ids).size, 30, `${lesson.id}: yinelenen kimlik`);
    for (const id of ids) assert.ok(QUESTION_BY_ID.has(id), `${lesson.id}: ${id} bulunamadı`);
  }
});

test("her sorunun zorunlu alanları ve tek doğru cevabı var", () => {
  for (const q of QUESTION_BY_ID.values()) {
    for (const k of ["id", "lessonId", "objectiveId", "type", "prompt", "options", "correctOptionId", "explanation", "difficulty", "source", "reviewStatus"] as const) {
      assert.ok(q[k] !== undefined && q[k] !== "", `${q.id}: ${k} eksik`);
    }
    assert.ok(q.options.length >= 2 && q.options.length <= 4, `${q.id}: şık sayısı ${q.options.length}`);
    assert.equal(q.options.filter((o) => o.id === q.correctOptionId).length, 1, `${q.id}: doğru şık tek değil`);
    assert.equal(new Set(q.options.map((o) => o.id)).size, q.options.length, `${q.id}: şık kimliği yineleniyor`);
    const labels = q.options.map((o) => (o.kind === "arabic" ? canonical(o.label) : o.label));
    assert.equal(new Set(labels).size, labels.length, `${q.id}: aynı görünen şık: ${labels.join(" | ")}`);
    assert.ok([1, 2, 3].includes(q.difficulty), `${q.id}: zorluk`);
  }
});

const ALL_WITH_PRACTICE = () => [...QUESTION_BY_ID.values(), ...Object.values(PRACTICE_POOLS).flat()];

test("takım oyununda ekranda Arapça gösterilir, şıkların hepsi Türkçedir", () => {
  for (const q of QUESTION_BY_ID.values()) {
    assert.ok(q.stimulus && q.stimulus.trim().length > 0, `${q.id}: Arapça uyaran yok`);
    assert.ok(q.options.every((o) => o.kind === "text"), `${q.id}: Arapça şık var`);
  }
});

test("Arapça metinlerde yasak/beklenmeyen karakter yok", () => {
  const problems: string[] = [];
  for (const q of ALL_WITH_PRACTICE()) {
    for (const s of [...arabicStringsOf(q), ...arabicSegments(q.explanation)]) {
      const issues = checkArabicChars(s);
      if (issues.length) problems.push(`${q.id}: "${s}" → ${issues.map((i) => i.code + " " + i.reason).join(", ")}`);
    }
  }
  for (const l of LESSONS) {
    for (const e of l.examples) {
      const issues = checkArabicChars(e.arabic);
      if (issues.length) problems.push(`${l.id} örnek "${e.arabic}" → ${issues.map((i) => i.code).join(", ")}`);
    }
  }
  assert.deepEqual(problems, []);
});

test("henüz öğretilmemiş kural önceki derslerin sorularına girmiyor", () => {
  const problems: string[] = [];
  for (const q of ALL_WITH_PRACTICE()) {
    const lesson = LESSON_BY_ID.get(q.lessonId)!;
    const allowed = new Set(lesson.allowedFeatures);
    for (const s of arabicStringsOf(q)) {
      for (const f of detectFeatures(s)) {
        if (!allowed.has(f)) problems.push(`${q.id} (${lesson.id}): "${s}" içinde öğretilmemiş "${f}"`);
      }
    }
  }
  for (const l of LESSONS) {
    const allowed = new Set(l.allowedFeatures);
    for (const e of l.examples) for (const f of detectFeatures(e.arabic)) if (!allowed.has(f)) problems.push(`${l.id} örnek "${e.arabic}": ${f}`);
  }
  assert.deepEqual(problems, []);
});

test("bir oyunun 30 sorusu kendi içinde farklı; tekrar eden harf farklı şıklarla ve en fazla 5 kez sorulur", () => {
  // Öğretmen kararı: az harfli derslerde aynı harf birden fazla kez sorulabilir.
  for (const lesson of GAME_LESSONS) {
    const qs = questionsForLesson(lesson.id);
    const sigs = qs.map((q) => `${q.type}|${q.prompt}|${q.stimulus ?? ""}|${q.options.map((o) => o.label).sort().join("/")}`);
    const dup = sigs.filter((s, i) => sigs.indexOf(s) !== i);
    assert.deepEqual(dup, [], `${lesson.id}: aynı şık kümesiyle tekrar eden soru`);
    const perStim = new Map<string, number>();
    for (const q of qs) perStim.set(q.stimulus ?? q.id, (perStim.get(q.stimulus ?? q.id) ?? 0) + 1);
    const max = Math.max(...perStim.values());
    assert.ok(max <= 5, `${lesson.id}: aynı uyaran ${max} kez`);
    const min = Math.min(...perStim.values());
    assert.ok(max - min <= 1, `${lesson.id}: harf dağılımı dengesiz (${min}–${max})`);
  }
});

test("sorular kendi dersinin kazanımına bağlı ve zorluk dengeli", () => {
  for (const lesson of GAME_LESSONS) {
    const qs = questionsForLesson(lesson.id);
    for (const q of qs) {
      const own = LESSON_BY_ID.get(q.lessonId)!;
      assert.ok(own.objectives.some((o) => o.id === q.objectiveId && o.assessedBy === "game"), `${q.id}: kazanım ${q.objectiveId}`);
    }
    const levels = new Set(qs.map((q) => q.difficulty));
    assert.ok(levels.size >= 2, `${lesson.id}: tek zorluk düzeyi`);
  }
});

test("her derste hedef, anlatım, kazanım ve öğretmen değerlendirmesi var", () => {
  for (const l of LESSONS) {
    assert.ok(l.goal.length > 10, l.id);
    assert.ok(l.explanation.length >= 1, l.id);
    assert.ok(l.objectives.some((o) => o.assessedBy === "game"), `${l.id}: oyun kazanımı yok`);
    assert.ok(l.objectives.some((o) => o.assessedBy === "teacher") || l.teacherChecklist.length > 0, `${l.id}: öğretmen değerlendirmesi yok`);
    assert.ok(l.teacherChecklist.length >= 1, l.id);
    assert.ok(UNITS.some((u) => u.id === l.unitId), l.id);
  }
});

test("havuz kimlikleri tüm derslerde benzersiz", () => {
  const all = [...Object.values(LESSON_POOLS).flat(), ...Object.values(PRACTICE_POOLS).flat()].map((q) => q.id);
  assert.equal(new Set(all).size, all.length);
});

test("ses kataloğu var, ama hiçbir soru doğrudan ses dosyasına bağımlı değil", () => {
  assert.ok(AUDIO_CATALOG.length > 0);
  for (const q of QUESTION_BY_ID.values()) assert.notEqual(q.type, "audio-choice");
});

test("Tanzil alıntısı bütün ve telif bildirimi korunmuş", () => {
  assert.match(TANZIL_EXCERPT.copyrightNotice, /PLEASE DO NOT REMOVE OR CHANGE THIS COPYRIGHT BLOCK/);
  assert.match(TANZIL_EXCERPT.copyrightNotice, /Creative Commons Attribution 3\.0/);
  const counts = Object.fromEntries(TANZIL_EXCERPT.suras.map((s) => [s.sura, s.ayas.length]));
  assert.deepEqual(counts, { 1: 7, 108: 3, 112: 4, 113: 5, 114: 6 });
  for (const s of TANZIL_EXCERPT.suras) {
    s.ayas.forEach((a, i) => assert.equal(a.aya, i + 1));
    if (s.sura !== 1) assert.ok(s.bismillah, `${s.sura} besmele alanı`);
    for (const a of s.ayas) assert.ok(skeleton(a.text).length > 3);
  }
});
