// Soru üretim yardımcıları. Tamamen deterministiktir: aynı veri her zaman aynı soruları üretir.
import type { Difficulty, OptionKind, Question, QuestionType, ReviewStatus, SourceRef } from "./types.ts";
import { FATHA, KASRA, DAMMA, SUKUN, SHADDA, FATHATAN, KASRATAN, DAMMATAN, SUP_ALEF, SUB_ALEF, MADDAH, clusters, canonical, ALEF, WAW, YEH, ALEF_MAKSURA } from "./arabic.ts";
import { letterByChar } from "./letters.ts";

export const QUESTIONS_PER_GAME = 30;

/** FNV-1a 32 bit. */
export function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function stableSort<T>(items: T[], key: (t: T) => string): T[] {
  return [...items].sort((a, b) => hash(key(a)) - hash(key(b)) || key(a).localeCompare(key(b)));
}

export interface OptSpec {
  label: string;
  kind: OptionKind;
}

export interface QSpec {
  id: string;
  lessonId: string;
  objectiveId: string;
  type: QuestionType;
  prompt: string;
  stimulus?: string;
  correct: OptSpec;
  distractors: OptSpec[];
  explanation: string;
  difficulty: Difficulty;
  source: SourceRef;
  reviewStatus?: ReviewStatus;
  audioId?: string;
}

/** Şıkları kararlı biçimde sıralar ve kimlik verir. Aynı etiketli şık olursa hata verir. */
export function makeQuestion(s: QSpec): Question {
  const all = [s.correct, ...s.distractors].map((o) => ({
    ...o,
    label: o.kind === "arabic" ? canonical(o.label) : o.label,
  }));
  const seen = new Set<string>();
  for (const o of all) {
    if (seen.has(o.label)) throw new Error(`${s.id}: aynı şık iki kez: ${o.label}`);
    seen.add(o.label);
  }
  const ordered = stableSort(all, (o) => s.id + "|" + o.label);
  const options = ordered.map((o, i) => ({ id: `${s.id}:${i}`, label: o.label, kind: o.kind }));
  const correctIdx = ordered.findIndex((o) => o.label === canonical(s.correct.label) || o.label === s.correct.label);
  return {
    id: s.id,
    lessonId: s.lessonId,
    objectiveId: s.objectiveId,
    type: s.type,
    prompt: s.prompt,
    stimulus: s.stimulus ? canonical(s.stimulus) : undefined,
    options,
    correctOptionId: options[correctIdx].id,
    explanation: s.explanation,
    difficulty: s.difficulty,
    source: s.source,
    audioId: s.audioId,
    reviewStatus: s.reviewStatus ?? "auto-validated",
  };
}

/** Adaylardan, etiketi doğru cevaptan ve birbirinden farklı n tane çeldirici seçer (öncelik sırasına göre). */
export function takeDistinct(correct: string, prioritized: string[][], n: number, seed: string): string[] {
  const out: string[] = [];
  const used = new Set([canonical(correct)]);
  for (const tier of prioritized) {
    const sorted = stableSort(tier, (x) => seed + x);
    for (const x of sorted) {
      const c = canonical(x);
      if (out.length >= n) break;
      if (!used.has(c)) {
        used.add(c);
        out.push(x);
      }
    }
  }
  return out;
}

/**
 * Havuzdan 30 soru seçer.
 * 1) Uyaranlar (harf, hece, kelime) arasında denge: tur tur seçilir; önce her uyaranın bir sorusu,
 *    sonra ikinci sorusu… Bir uyaranın ilk sorusu en kolay olanıdır.
 * 2) Bir tur 30'u aşarsa, zorluk hedefine (kolay 10, orta 12, zor 8) en çok ihtiyaç duyulan ve
 *    en az seçilmiş türdeki sorular önce alınır.
 */
export function select30(pool: Question[], lessonId: string): Question[] {
  const ids = new Set<string>();
  for (const q of pool) {
    if (ids.has(q.id)) throw new Error(`${lessonId}: yinelenen soru kimliği ${q.id}`);
    ids.add(q.id);
  }
  if (pool.length < QUESTIONS_PER_GAME) {
    throw new Error(`${lessonId}: havuzda yalnızca ${pool.length} soru var (30 gerekli)`);
  }
  const quota: Record<Difficulty, number> = { 1: 10, 2: 12, 3: 8 };
  const groups = new Map<string, Question[]>();
  for (const q of stableSort(pool, (x) => x.id)) {
    const k = q.stimulus ?? q.id;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(q);
  }
  const chosen: Question[] = [];
  const diffCount: Record<Difficulty, number> = { 1: 0, 2: 0, 3: 0 };
  const typeCount = new Map<string, number>();
  const need = (q: Question) => quota[q.difficulty] - diffCount[q.difficulty];
  const lists = [...groups.values()];
  while (chosen.length < QUESTIONS_PER_GAME && lists.some((g) => g.length > 0)) {
    // Bu turda her uyarandan en fazla bir soru. Her seçimden sonra zorluk ihtiyacı yeniden hesaplanır.
    const round = lists.filter((g) => g.length > 0);
    while (round.length > 0 && chosen.length < QUESTIONS_PER_GAME) {
      let best = -1;
      let bestQ: Question | undefined;
      const score = (q: Question) => need(q) * 100 - (typeCount.get(q.type) ?? 0);
      round.forEach((g, gi) => {
        for (const q of g) {
          if (!bestQ || score(q) > score(bestQ) || (score(q) === score(bestQ) && hash(q.id) < hash(bestQ.id))) {
            bestQ = q;
            best = gi;
          }
        }
      });
      const g = round.splice(best, 1)[0];
      g.splice(g.indexOf(bestQ!), 1);
      chosen.push(bestQ!);
      diffCount[bestQ!.difficulty]++;
      typeCount.set(bestQ!.type, (typeCount.get(bestQ!.type) ?? 0) + 1);
    }
  }
  if (chosen.length < QUESTIONS_PER_GAME) throw new Error(`${lessonId}: 30 soru seçilemedi`);
  return chosen;
}

export const VOWEL_NAME: Record<string, string> = {
  [FATHA]: "üstün",
  [KASRA]: "esre",
  [DAMMA]: "ötre",
};

const TANWEEN_NAME: Record<string, string> = {
  [FATHATAN]: "iki üstün",
  [KASRATAN]: "iki esre",
  [DAMMATAN]: "iki ötre",
};

/** Bir harf kümesinin hecelenişi: "Be üstün", "Lam cezm", "Be şeddeli esre". */
export function spellCluster(base: string, marks: string[]): string {
  const l = letterByChar(base);
  if (!l) throw new Error(`Hecelenemeyen karakter: ${base}`);
  const parts: string[] = [l.name];
  const hasShadda = marks.includes(SHADDA);
  for (const m of marks) {
    if (VOWEL_NAME[m]) parts.push(hasShadda ? `şeddeli ${VOWEL_NAME[m]}` : VOWEL_NAME[m]);
    else if (TANWEEN_NAME[m]) parts.push(TANWEEN_NAME[m]);
    else if (m === SUKUN) parts.push("cezm");
    else if (m === SUP_ALEF) parts.push("dikey üstün");
    else if (m === SUB_ALEF) parts.push("dikey esre");
    else if (m === MADDAH) parts.push("med işareti");
  }
  return parts.join(" ");
}

/** Kelimenin hecelenişi (sağdan sola, harf harf). */
export function spellWord(word: string): string {
  return clusters(word)
    .filter((c) => c.base !== " ")
    .map((c) => spellCluster(c.base, c.marks))
    .join(" · ");
}

export function isMaddLetter(base: string): boolean {
  return base === ALEF || base === WAW || base === YEH || base === ALEF_MAKSURA;
}

/** ⟪ ⟫ ile Arapça parçayı işaretler. */
export function ar(s: string): string {
  return `⟪${s}⟫`;
}
