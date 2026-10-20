// İçeriğin tek giriş noktası: her dersin 30 sorusu, soru sözlüğü, ses kataloğu.
import type { AudioItem, Question } from "./types.ts";
import { LESSONS, LESSON_BY_ID } from "./lessons.ts";
import { select30, stableSort, QUESTIONS_PER_GAME } from "./build.ts";
import { LETTERS } from "./letters.ts";
import { FATHA, KASRA, DAMMA, HEH, TATWEEL, canonical } from "./arabic.ts";
import * as G from "./generators.ts";
import * as GG from "./game-generators.ts";

/** Ders sayfasındaki puansız alıştırma: çeşitli etkinlik türleri (harfi bul, benzer harf, Arapça şıklar…). */
const PRACTICE_BUILDERS: Record<string, (id: string) => Question[]> = {
  "u1-l1": (id) => G.genLetterGroup(id, 1),
  "u1-l2": (id) => G.genLetterGroup(id, 2),
  "u1-l3": (id) => G.genLetterGroup(id, 3),
  "u1-l4": (id) => G.genLetterGroup(id, 4),
  "u1-l5": G.genSimilar,
  "u1-l6": G.genLetterMix,
  "u2-l1": (id) => G.genForms(id, "initial"),
  "u2-l2": (id) => G.genForms(id, "medial"),
  "u2-l3": (id) => G.genForms(id, "final"),
  "u2-l4": G.genJoining,
  "u2-l5": G.genFormsMix,
  "u3-l1": (id) => G.genVowel(id, FATHA, [FATHA], { id: "K1", locator: "s.9" }),
  "u3-l2": (id) => G.genVowel(id, KASRA, [FATHA, KASRA], { id: "K1", locator: "s.9" }),
  "u3-l3": (id) => G.genVowel(id, DAMMA, [FATHA, KASRA, DAMMA], { id: "K1", locator: "s.9" }),
  "u3-l4": G.genVowelCompare,
  "u3-l5": G.genHarakaWords,
  "u4-l1": G.genSukunSyllables,
  "u4-l2": G.genSukunWords,
  "u5-l1": G.genShaddaSyllables,
  "u5-l2": G.genShaddaWords,
  "u6-l1": G.genMaddSyllables,
  "u6-l2": G.genMaddWords,
  "u7-l1": G.genAsar,
  "u8-l1": G.genTanweenSyllables,
  "u8-l2": G.genTanweenWords,
  "u9-l1": G.genZamir,
  "u9-l2": G.genLafza,
  "u10-l1": G.genElifLam,
  "u10-l2": G.genRa,
  "u11-l1": G.genVakf,
};

/**
 * Takım oyunu: ekranda Arapça (harf, hece, kelime) görünür, şıklar Türkçedir (öğretmen kararı, 2026-10).
 * Az harfli derslerde aynı harf farklı şık kümeleriyle birden fazla kez sorulabilir.
 */
const GAME_BUILDERS: Record<string, (id: string) => Question[]> = {
  // Harfler ünitesinde tek oyun: 28 harfin hepsi (u1-l1…u1-l5 buraya yönlendirir).
  "u1-l6": GG.gameLetterMix,
  "u2-l1": (id) => GG.gameForms(id, "initial"),
  "u2-l2": (id) => GG.gameForms(id, "medial"),
  "u2-l3": (id) => GG.gameForms(id, "final"),
  "u2-l4": GG.gameJoining,
  "u2-l5": GG.gameFormsMix,
  // Hareke, cezm ve şedde: Arapça hece/kelime gösterilir, şıklar Türkçe okunuştur (öğretmen kararı).
  "u3-l1": (id) => GG.gameReadVowel(id, FATHA, [FATHA], { id: "K1", locator: "s.9" }),
  "u3-l2": (id) => GG.gameReadVowel(id, KASRA, [FATHA, KASRA], { id: "K1", locator: "s.9" }),
  "u3-l3": (id) => GG.gameReadVowel(id, DAMMA, [FATHA, KASRA, DAMMA], { id: "K1", locator: "s.9" }),
  "u3-l4": GG.gameReadVowelCompare,
  "u3-l5": GG.gameReadHarakaWords,
  "u4-l1": GG.gameReadSukunSyllables,
  "u4-l2": GG.gameReadSukunWords,
  "u5-l1": GG.gameReadShaddaSyllables,
  "u5-l2": GG.gameReadShaddaWords,
  "u6-l1": GG.gameMaddSyllables,
  "u6-l2": GG.gameMaddWords,
  "u7-l1": GG.gameAsar,
  "u8-l1": GG.gameTanweenSyllables,
  "u8-l2": GG.gameTanweenWords,
  "u9-l1": GG.gameZamir,
  "u9-l2": GG.gameLafza,
  "u10-l1": GG.gameElifLam,
  "u10-l2": GG.gameRa,
  "u11-l1": GG.gameVakf,
};

/** Takım oyunu havuzları (seçimden önceki bütün sorular). */
export const LESSON_POOLS: Record<string, Question[]> = {};
/** Alıştırma havuzları. */
export const PRACTICE_POOLS: Record<string, Question[]> = {};
/** Her dersin oyun sorusu kimlikleri (tam 30). */
export const LESSON_QUESTION_IDS: Record<string, string[]> = {};
export const QUESTION_BY_ID = new Map<string, Question>();

for (const lesson of LESSONS) {
  const practice = PRACTICE_BUILDERS[lesson.id];
  if (practice) PRACTICE_POOLS[lesson.id] = practice(lesson.id);
  // Kendi oyunu olmayan dersler (ör. Harfler 1–5) oyun için başka derse yönlendirir.
  if (lesson.gameLessonId) continue;
  const build = GAME_BUILDERS[lesson.id];
  if (!build) continue;
  const pool = build(lesson.id);
  LESSON_POOLS[lesson.id] = pool;
  const chosen = select30(pool, lesson.id);
  LESSON_QUESTION_IDS[lesson.id] = chosen.map((q) => q.id);
  for (const q of chosen) QUESTION_BY_ID.set(q.id, q);
}

// Ünite 12: genel tekrar — önceki derslerin oyun sorularından deterministik seçim.
const REVIEW_PLAN: [string, number][] = [
  ["u1-l6", 2], ["u2-l5", 2], ["u3-l4", 2], ["u3-l5", 2], ["u4-l2", 2], ["u5-l2", 2], ["u6-l1", 2],
  ["u6-l2", 2], ["u7-l1", 2], ["u8-l2", 2], ["u9-l1", 2], ["u9-l2", 2], ["u10-l1", 2], ["u10-l2", 2], ["u11-l1", 2],
];
{
  const ids: string[] = [];
  for (const [lessonId, n] of REVIEW_PLAN) {
    const qs = LESSON_QUESTION_IDS[lessonId].map((id) => QUESTION_BY_ID.get(id)!);
    const hard = stableSort(qs.filter((q) => q.difficulty >= 2), (q) => "review" + q.id);
    const pick = (hard.length >= n ? hard : stableSort(qs, (q) => "review" + q.id)).slice(0, n);
    ids.push(...pick.map((q) => q.id));
  }
  LESSON_QUESTION_IDS["u12-l1"] = ids;
}

/** Dersin takım oyununun bulunduğu ders (kendisi ya da yönlendirdiği ders). */
export function gameLessonOf(lessonId: string): string {
  return LESSON_BY_ID.get(lessonId)?.gameLessonId ?? lessonId;
}

/** Kendi takım oyunu olan dersler. */
export const GAME_LESSONS = LESSONS.filter((l) => !l.gameLessonId);

export function questionsForLesson(lessonId: string): Question[] {
  const ids = LESSON_QUESTION_IDS[lessonId];
  if (!ids) throw new Error(`Ders bulunamadı: ${lessonId}`);
  return ids.map((id) => QUESTION_BY_ID.get(id)!);
}

export function getQuestion(id: string): Question | undefined {
  return QUESTION_BY_ID.get(id);
}

export const ALL_GAME_QUESTIONS: Question[] = [...QUESTION_BY_ID.values()];

/**
 * Halat çekme oyunu soru havuzları (ders başına, sınırsız tekrar için).
 * Kendi oyunu olan derslerde oyun havuzunun tamamı kullanılır; Harfler 1–5'te yalnızca o dersin harfleri;
 * genel tekrar dersinde kendi 30 sorusu. Hepsi "Arapça göster, Türkçe seç" biçimindedir.
 */
const TUG_EXTRA: Record<string, (id: string) => Question[]> = {
  "u1-l1": (id) => GG.gameLetterGroup(id, 1),
  "u1-l2": (id) => GG.gameLetterGroup(id, 2),
  "u1-l3": (id) => GG.gameLetterGroup(id, 3),
  "u1-l4": (id) => GG.gameLetterGroup(id, 4),
  "u1-l5": GG.gameSimilar,
};
export const TUG_POOLS: Record<string, Question[]> = {};
for (const lesson of LESSONS) {
  const extra = TUG_EXTRA[lesson.id];
  if (extra) TUG_POOLS[lesson.id] = extra(lesson.id);
  else if (LESSON_POOLS[lesson.id]) TUG_POOLS[lesson.id] = LESSON_POOLS[lesson.id];
  else if (LESSON_QUESTION_IDS[lesson.id]) TUG_POOLS[lesson.id] = questionsForLesson(lesson.id);
}
const ANY_QUESTION = new Map<string, Question>();
for (const q of Object.values(TUG_POOLS).flat()) ANY_QUESTION.set(q.id, q);
for (const q of QUESTION_BY_ID.values()) ANY_QUESTION.set(q.id, q);

/** Oyun ya da halat çekme sorusunu kimliğinden bulur. */
export function getAnyQuestion(id: string): Question | undefined {
  return ANY_QUESTION.get(id);
}

/**
 * Ses kaydı kataloğu. Uygulamada hiçbir ses dosyası yoktur; öğretmen kaydı yükleyip onaylayana kadar
 * bu sesler "Ses kaydı gerekli" durumundadır ve hiçbir yerde çalınmaz.
 */
export const AUDIO_CATALOG: AudioItem[] = [
  ...LETTERS.map((l) => ({ id: `name-${l.id}`, arabic: l.display, label: `Harfin adı: ${l.name}`, lessonId: "u1-l6" })),
  ...LETTERS.flatMap((l) =>
    ([[FATHA, "fatha", "üstün", "u3-l1"], [KASRA, "kasra", "esre", "u3-l2"], [DAMMA, "damma", "ötre", "u3-l3"]] as const).map(([v, key, nm, lessonId]) => ({
      id: `syl-${l.id}-${key}`,
      arabic: l.id === "he" ? canonical(HEH + v + TATWEEL) : canonical(l.base + v),
      label: `${l.name} ${nm}`,
      lessonId,
    })),
  ),
];
export const AUDIO_BY_ID = new Map(AUDIO_CATALOG.map((a) => [a.id, a]));

export { LESSONS, LESSON_BY_ID, QUESTIONS_PER_GAME };
