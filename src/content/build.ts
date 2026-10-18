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
 * Havuzdan dengeli 30 soru seçer: kolay 10, orta 12, zor 8 hedeflenir. Her zorluk içinde
 * soru türleri sırayla (round-robin) seçilir. Eksik zorluk komşudan tamamlanır.
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
  const byDiff = (d: Difficulty) => pool.filter((q) => q.difficulty === d);
  const counts: Record<Difficulty, number> = { 1: byDiff(1).length, 2: byDiff(2).length, 3: byDiff(3).length };
  // Eksikleri dağıt
  const take: Record<Difficulty, number> = { 1: Math.min(quota[1], counts[1]), 2: Math.min(quota[2], counts[2]), 3: Math.min(quota[3], counts[3]) };
  let missing = QUESTIONS_PER_GAME - (take[1] + take[2] + take[3]);
  for (const d of [2, 1, 3] as Difficulty[]) {
    if (missing <= 0) break;
    const extra = Math.min(missing, counts[d] - take[d]);
    take[d] += extra;
    missing -= extra;
  }
  if (missing > 0) throw new Error(`${lessonId}: 30 soru seçilemedi`);
  const chosen: Question[] = [];
  for (const d of [1, 2, 3] as Difficulty[]) {
    const items = byDiff(d);
    const types = [...new Set(items.map((q) => q.type))].sort();
    const queues = types.map((t) => stableSort(items.filter((q) => q.type === t), (q) => q.id));
    let picked = 0;
    while (picked < take[d]) {
      let progressed = false;
      for (const qu of queues) {
        if (picked >= take[d]) break;
        const q = qu.shift();
        if (q) {
          chosen.push(q);
          picked++;
          progressed = true;
        }
      }
      if (!progressed) break;
    }
  }
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
