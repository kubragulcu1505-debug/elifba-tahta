// Türkçe okunuş çevirisi ve okunuş soruları. Çalıştırma: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readArabic } from "../src/content/reading.ts";
import { questionsForLesson } from "../src/content/index.ts";

const n = (s: string) => s.normalize("NFC");

test("geleneksel elifba hecelemesine göre Türkçe okunuş", () => {
  const cases: [string, string][] = [
    ["فَتَحَ", "feteha"], // öğretmenin örneği
    ["ظَهَرَ", "zahera"],
    ["قُلْ", "kul"],
    ["اِنَّ", "inne"],
    ["ثُمَّ", "sümme"],
    ["رَبِّ", "rabbi"],
    ["عَلَّمَ", "alleme"],
    ["كُنْتُمْ", "küntüm"],
    ["اَبْ", "eb"],
    ["اُقْ", "uk"],
    ["اِسْتَكْبَرَ", "istekbera"],
    ["جَهَنَّمَ", "cehenneme"],
    ["هَـ", "he"],
    ["صِ", "sı"],
    ["حِ", "hi"],
    ["بُ", "bü"],
  ];
  for (const [ar, tr] of cases) assert.equal(readArabic(n(ar)), tr, ar);
});

test("hareke, cezm ve şedde oyunlarında şıklar Türkçe okunuştur ve doğru şık uyaranın okunuşudur", () => {
  for (const id of ["u3-l1", "u3-l2", "u3-l3", "u3-l4", "u3-l5", "u4-l1", "u4-l2", "u5-l1", "u5-l2"]) {
    for (const q of questionsForLesson(id)) {
      assert.equal(q.type, "reading", q.id);
      const correct = q.options.find((o) => o.id === q.correctOptionId)!.label;
      assert.equal(correct, readArabic(q.stimulus!), q.id);
      assert.ok(q.options.every((o) => o.kind === "text" && !/[؀-ۿ]/.test(o.label)), `${q.id}: şıkta Arapça harf`);
      assert.equal(new Set(q.options.map((o) => o.label)).size, q.options.length, `${q.id}: aynı okunuşlu iki şık`);
    }
  }
});
