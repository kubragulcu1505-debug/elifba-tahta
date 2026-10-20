// Takım oyunu soruları: ekranda Arapça (harf, hece, kelime) gösterilir, şıklar Türkçedir.
// Öğretmen kararı: az harfli derslerde aynı harf birkaç kez sorulabilir; her seferinde şık kümesi farklıdır.
// Eski biçimler (harfi bul, benzer harfi bul, heceyi Arapça şıklardan seç) ders sayfasındaki alıştırmada kalır.
import type { Question, QuestionType, ReviewStatus, SourceRef } from "./types.ts";
import { FATHA, KASRA, DAMMA, SUKUN, SHADDA, FATHATAN, SUP_ALEF, MADDAH, ALEF_MADDA, clusters, canonical } from "./arabic.ts";
import { LETTERS, GROUPS, NON_CONNECTORS, forms, dotsText, letterByChar, type Letter } from "./letters.ts";
import { makeQuestion, takeDistinct, spellWord, VOWEL_NAME, ar } from "./build.ts";
import {
  K1, K2, T, VOWELS, diffFrom, upToGroup, family, soundMates, others, names, syl, longSyl, tanSyl, TANWEEN_NAME, TANWEENS,
  vowelOfTanween, MADD_LETTER_NAME, byMode, capital, POS_NAME, formFamily, spell1, VOWEL_EXPLAIN, wordSpellingQ,
  SYLLABLE_LETTERS, elifV, countMark, lettersOfWord, countQ, maddLetters, lastCluster, tanweenOf, tanName, VOWEL_KEY,
  genZamir, genLafza, genElifLam, genRa,
  type Pos,
} from "./generators.ts";
import {
  PLAIN_WORDS, HARAKA_WORDS, SUKUN_WORDS, SHADDA_WORDS, MADD_WORDS, ASAR_WORDS, MADDAH_WORDS, TANWEEN_WORDS,
  VAKF_WORDS, TRANSITION_PAIRS,
} from "./words.ts";

interface GSpec {
  id: string;
  lessonId: string;
  objectiveId: string;
  type: QuestionType;
  prompt: string;
  stimulus: string;
  correct: string;
  /** Anlamlı karışıklık yaratan çeldiriciler (zorluğu belirler). */
  confusers: string[];
  /** Diğer çeldiriciler. */
  plain: string[];
  mode: number;
  explanation: string;
  source: SourceRef;
  reviewStatus?: ReviewStatus;
  audioId?: string;
  /** Sabit zorluk (verilmezse karışık çeldirici sayısından hesaplanır). */
  difficulty?: 1 | 2 | 3;
}

const renumber = (q: Question, id: string): Question => ({
  ...q,
  id,
  options: q.options.map((o, k) => ({ ...o, id: `${id}:${k}` })),
  correctOptionId: `${id}:${q.options.findIndex((o) => o.id === q.correctOptionId)}`,
});

/** Türkçe şıklı soru havuzu. Aynı uyaran + aynı şık kümesi ikinci kez eklenmez. */
class GamePool {
  qs: Question[] = [];
  private seen = new Set<string>();
  add(g: GSpec): boolean {
    const confusers = g.confusers.filter((x) => x !== g.correct);
    const plain = g.plain.filter((x) => x !== g.correct && !confusers.includes(x));
    const ds = takeDistinct(g.correct, byMode(g.mode, confusers, plain), 3, g.id);
    if (ds.length < 2) return false;
    const key = `${g.prompt}|${canonical(g.stimulus)}|${[g.correct, ...ds].sort().join("/")}`;
    if (this.seen.has(key)) return false;
    this.seen.add(key);
    const conf = ds.filter((d) => confusers.includes(d)).length;
    this.qs.push(
      makeQuestion({
        id: g.id, lessonId: g.lessonId, objectiveId: g.objectiveId, type: g.type, prompt: g.prompt, stimulus: g.stimulus,
        correct: T(g.correct), distractors: ds.map(T), explanation: g.explanation,
        difficulty: g.difficulty ?? diffFrom(conf), source: g.source, reviewStatus: g.reviewStatus, audioId: g.audioId,
      }),
    );
    return true;
  }
  push(...qs: (Question | undefined)[]) {
    for (const q of qs) if (q) this.qs.push(q);
  }
}

// ───────────────────────── Ünite 1: harfi gör, adını seç ─────────────────────────
function nameQuestions(p: GamePool, lessonId: string, objectiveId: string, targets: Letter[], pool: Letter[], variants: number, src: SourceRef, onlyFamily = false) {
  for (const l of targets) {
    const conf = onlyFamily ? family(l, pool) : [...family(l, pool), ...soundMates(l, pool)];
    const plain = others(l, pool).filter((x) => !conf.includes(x));
    for (let k = 0; k < variants; k++) {
      p.add({
        id: `${lessonId}-g-name-${l.id}-${k}`, lessonId, objectiveId, type: "name-of-letter",
        prompt: "Bu harfin adı ne?", stimulus: l.display, correct: l.name,
        confusers: names(conf), plain: names(plain), mode: onlyFamily ? 2 - (k % 2) : (l.order + k) % 3,
        explanation: `${ar(l.display)} harfinin adı ${l.name}. ${capital(dotsText(l))}.`, source: src, audioId: `name-${l.id}`,
      });
    }
  }
}

export function gameLetterGroup(lessonId: string, g: 1 | 2 | 3 | 4): Question[] {
  const p = new GamePool();
  nameQuestions(p, lessonId, `${lessonId}-o2`, GROUPS[g], upToGroup(g), 6, K1("s.6–7"));
  return p.qs;
}
export function gameSimilar(lessonId: string): Question[] {
  const p = new GamePool();
  nameQuestions(p, lessonId, `${lessonId}-o1`, LETTERS.filter((l) => family(l, LETTERS).length > 0), LETTERS, 2, K2("Harfler > Pekiştirme"), true);
  return p.qs;
}
export function gameLetterMix(lessonId: string): Question[] {
  const p = new GamePool();
  nameQuestions(p, lessonId, `${lessonId}-o2`, LETTERS, LETTERS, 2, K1("s.7"));
  return p.qs;
}

// ───────────────────────── Ünite 2: yazılışı gör, harfin adını seç ─────────────────────────
function formNameQ(p: GamePool, lessonId: string, objectiveId: string, l: Letter, pos: Pos, k: number) {
  const shape = pos === "isolated" ? forms(l).isolated : forms(l)[pos];
  if (canonical(shape) === canonical(l.display)) return;
  const conf = [...formFamily(l, pos), ...soundMates(l, LETTERS)];
  p.add({
    id: `${lessonId}-g-form-${l.id}-${pos}-${k}`, lessonId, objectiveId, type: "form-to-letter",
    prompt: `Bu ${POS_NAME[pos]} yazılış hangi harfin?`, stimulus: shape, correct: l.name,
    confusers: names(conf), plain: names(others(l, LETTERS).filter((x) => !conf.includes(x))), mode: (l.order + k) % 3,
    explanation: `${ar(shape)} → ${ar(l.display)} ${l.name}, ${POS_NAME[pos]} yazılışı. ${capital(dotsText(l))}.`, source: K1("s.8"),
  });
}

export function gameForms(lessonId: string, pos: "initial" | "medial" | "final"): Question[] {
  const p = new GamePool();
  for (const l of LETTERS) for (let k = 0; k < 2; k++) formNameQ(p, lessonId, `${lessonId}-o2`, l, pos, k);
  return p.qs;
}

export function gameJoining(lessonId: string): Question[] {
  const p = new GamePool();
  const posNames = ["ilk", "ortadaki", "son"] as const;
  PLAIN_WORDS.forEach((word, i) => {
    const chars = [...word];
    for (let pIdx = 0; pIdx < 3; pIdx++) {
      const idx = pIdx === 0 ? 0 : pIdx === 1 ? 1 : chars.length - 1;
      const target = letterByChar(chars[idx])!;
      const mirror = letterByChar(chars[chars.length - 1 - idx])!;
      const inWord = chars.map((c) => letterByChar(c)!).filter((x) => x.id !== target.id);
      const conf = [...(pIdx !== 1 ? [mirror] : []), ...family(target, LETTERS)];
      p.add({
        id: `${lessonId}-g-inword-${i}-${pIdx}`, lessonId, objectiveId: `${lessonId}-o2`, type: "letter-in-word",
        prompt: `Bu kelimenin ${posNames[pIdx]} harfi hangisi? Sağdan sola okuyun.`, stimulus: word, correct: target.name,
        confusers: names(conf), plain: [...names(inWord), ...names(others(target, LETTERS))], mode: (i + pIdx) % 3,
        explanation: `${ar(word)} sağdan sola: ${chars.map((c) => letterByChar(c)!.name).join(", ")}. ${capital(posNames[pIdx])} harf ${target.name}.`,
        source: K2("Harfler ve Şekilleri"), reviewStatus: "needs-teacher-review",
      });
    }
  });
  const joinLabels = ["İki yandan bağlanır", "Kendinden sonraki harfe bağlanmaz"];
  const connectors = LETTERS.filter((l) => l.joining === "dual").slice(0, 8);
  for (const l of [...NON_CONNECTORS, ...connectors]) {
    const right = l.joining === "right";
    p.push(
      makeQuestion({
        id: `${lessonId}-g-join-${l.id}`, lessonId, objectiveId: `${lessonId}-o1`, type: "joining",
        prompt: "Bu harf kendinden sonraki harfe bağlanır mı?", stimulus: l.display,
        correct: T(right ? joinLabels[1] : joinLabels[0]), distractors: [T(right ? joinLabels[0] : joinLabels[1]), T("Hiçbir harfe bağlanmaz")],
        explanation: `${ar("ا د ذ ر ز و")} kendinden sonraki harfe bağlanmaz; diğer harfler iki yandan bağlanır. ${ar(l.display)} ${l.name}: ${right ? "bağlanmaz" : "bağlanır"}.`,
        difficulty: right ? 2 : 1, source: K1("s.8"),
      }),
    );
  }
  p.push(
    makeQuestion({
      id: `${lessonId}-g-lamalif`, lessonId, objectiveId: `${lessonId}-o3`, type: "letter-in-word",
      prompt: "Bu yazılış sağdan sola hangi harflerden oluşur?", stimulus: "لا",
      correct: T("Önce Lam, sonra Elif"), distractors: [T("Önce Elif, sonra Lam"), T("Önce Kef, sonra Elif"), T("Önce Lam, sonra Vav")],
      explanation: `${ar("لا")} ayrı bir harf değildir; Lam ile Elif'in birlikte yazılışıdır.`, difficulty: 2, source: K1("s.6 notu"),
    }),
  );
  return p.qs;
}

export function gameFormsMix(lessonId: string): Question[] {
  const p = new GamePool();
  const order: Pos[] = ["initial", "medial", "final", "isolated"];
  for (const l of LETTERS) {
    formNameQ(p, lessonId, `${lessonId}-o1`, l, order[l.order % 4], 0);
    formNameQ(p, lessonId, `${lessonId}-o1`, l, order[(l.order + 2) % 4], 1);
  }
  return p.qs;
}

// ───────────────────────── Ünite 3: heceyi gör, hecelenişini seç ─────────────────────────
export function gameVowel(lessonId: string, v: string, allowed: string[], src: SourceRef): Question[] {
  const p = new GamePool();
  const otherV = allowed.filter((x) => x !== v);
  for (const l of LETTERS) {
    const conf = [...otherV.map((x) => spell1(l, x)), ...family(l, LETTERS).map((x) => spell1(x, v)), ...soundMates(l, LETTERS).map((x) => spell1(x, v))];
    const plain = others(l, LETTERS).map((x) => spell1(x, v));
    for (let k = 0; k < 2; k++) {
      p.add({
        id: `${lessonId}-g-syl-${l.id}-${k}`, lessonId, objectiveId: `${lessonId}-o2`, type: "shape-to-spell",
        prompt: "Bu hece nasıl hecelenir?", stimulus: syl(l, v), correct: spell1(l, v), confusers: conf, plain, mode: (l.order + k) % 3,
        explanation: `${ar(syl(l, v))}: harf ${l.name}, hareke ${VOWEL_NAME[v]}. ${VOWEL_EXPLAIN[v]}`, source: src, audioId: `syl-${l.id}-${VOWEL_KEY[v]}`,
      });
    }
  }
  return p.qs;
}

export function gameVowelCompare(lessonId: string): Question[] {
  const p = new GamePool();
  for (const l of LETTERS) {
    const v = VOWELS[l.order % 3];
    p.push(
      makeQuestion({
        id: `${lessonId}-g-id-${l.id}`, lessonId, objectiveId: `${lessonId}-o1`, type: "identify-hareke",
        prompt: "Bu harfin harekesi hangisi?", stimulus: syl(l, v), correct: T(capital(VOWEL_NAME[v])),
        distractors: VOWELS.filter((x) => x !== v).map((x) => T(capital(VOWEL_NAME[x]))),
        explanation: `${ar(syl(l, v))}: ${VOWEL_NAME[v]}. ${VOWEL_EXPLAIN[v]}`, difficulty: 1, source: K1("s.9"),
      }),
    );
    const v2 = VOWELS[(l.order + 1) % 3];
    const conf = [...VOWELS.filter((x) => x !== v2).map((x) => spell1(l, x)), ...family(l, LETTERS).map((x) => spell1(x, v2)), ...soundMates(l, LETTERS).map((x) => spell1(x, v2))];
    p.add({
      id: `${lessonId}-g-syl-${l.id}`, lessonId, objectiveId: `${lessonId}-o2`, type: "shape-to-spell",
      prompt: "Bu hece nasıl hecelenir?", stimulus: syl(l, v2), correct: spell1(l, v2), confusers: conf,
      plain: others(l, LETTERS).map((x) => spell1(x, v2)), mode: 1 + (l.order % 2),
      explanation: `${ar(VOWELS.map((x) => syl(l, x)).join(" "))}: ${VOWELS.map((x) => spell1(l, x)).join(" • ")}.`, source: K1("s.9"),
    });
  }
  return p.qs;
}

export function gameHarakaWords(lessonId: string): Question[] {
  return HARAKA_WORDS.map((w, i) => renumber(wordSpellingQ(lessonId, `${lessonId}-o1`, w, i, K1("s.10–11")), `${lessonId}-g-spell-${i}`));
}

// ───────────────────────── Ünite 4–5: cezm ve şedde ─────────────────────────
export function gameSukunSyllables(lessonId: string): Question[] {
  const p = new GamePool();
  for (const l of SYLLABLE_LETTERS) {
    const mates = [...family(l, SYLLABLE_LETTERS), ...soundMates(l, SYLLABLE_LETTERS)];
    for (let k = 0; k < 2; k++) {
      const v = VOWELS[(l.order + k) % 3];
      const s = canonical(elifV(v) + l.base + SUKUN);
      const correct = `Elif ${VOWEL_NAME[v]} · ${l.name} cezm`;
      const conf = [
        `Elif ${VOWEL_NAME[v]} · ${l.name} ${VOWEL_NAME[v]}`,
        ...VOWELS.filter((x) => x !== v).map((x) => `Elif ${VOWEL_NAME[x]} · ${l.name} cezm`),
        ...mates.map((m) => `Elif ${VOWEL_NAME[v]} · ${m.name} cezm`),
      ];
      p.add({
        id: `${lessonId}-g-syl-${l.id}-${k}`, lessonId, objectiveId: `${lessonId}-o2`, type: "shape-to-spell",
        prompt: "Bu hece nasıl hecelenir?", stimulus: s, correct, confusers: conf,
        plain: others(l, SYLLABLE_LETTERS).map((x) => `Elif ${VOWEL_NAME[v]} · ${x.name} cezm`), mode: (l.order + k) % 3,
        explanation: `${ar(s)} → ${correct}. Cezmli harf önceki harekeyle birleşir; ona hareke sesi verilmez.`, source: K1("s.12"),
      });
    }
  }
  return p.qs;
}

/** Kelimede işareti taşıyan harfin adını sorar (tek işaret varsa). */
function whichLetterNameQ(p: GamePool, lessonId: string, objectiveId: string, word: string, i: number, mark: string, markName: string, src: SourceRef) {
  const hits = clusters(word).filter((c) => c.marks.includes(mark));
  if (hits.length !== 1) return;
  const target = letterByChar(hits[0].base);
  if (!target) return;
  const inWord = lettersOfWord(word).filter((l) => l.id !== target.id);
  p.add({
    id: `${lessonId}-g-which-${i}`, lessonId, objectiveId, type: "which-letter-has-mark",
    prompt: `Bu kelimede ${markName} hangi harfin üstünde?`, stimulus: word, correct: target.name,
    confusers: names([...inWord, ...family(target, LETTERS)]), plain: names(others(target, LETTERS)), mode: 2,
    explanation: `${ar(word)} kelimesinde ${markName} ${target.name} harfinin üstünde.`, source: src, reviewStatus: "needs-teacher-review", difficulty: 2,
  });
}


export function gameSukunWords(lessonId: string): Question[] {
  const p = new GamePool();
  const src = K1("s.13");
  SUKUN_WORDS.forEach((w, i) => {
    p.push(renumber(wordSpellingQ(lessonId, `${lessonId}-o2`, w, i, src, [spellWord(canonical(w.replace(SUKUN, FATHA)))]), `${lessonId}-g-spell-${i}`));
    whichLetterNameQ(p, lessonId, `${lessonId}-o1`, w, i, SUKUN, "cezm", src);
    if (i % 2 === 0) p.push(renumber(countQ(lessonId, `${lessonId}-o3`, w, i, SUKUN, "cezm", src), `${lessonId}-g-count-${i}`));
  });
  return p.qs;
}

export function gameShaddaSyllables(lessonId: string): Question[] {
  const p = new GamePool();
  for (const l of SYLLABLE_LETTERS) {
    const mates = [...family(l, SYLLABLE_LETTERS), ...soundMates(l, SYLLABLE_LETTERS)];
    for (let k = 0; k < 2; k++) {
      const v1 = VOWELS[(l.order + k) % 3];
      const v2 = VOWELS[(l.order + k + 1) % 3];
      const s = canonical(elifV(v1) + l.base + SHADDA + v2);
      const correct = `Elif ${VOWEL_NAME[v1]} · ${l.name} şeddeli ${VOWEL_NAME[v2]}`;
      const conf = [
        `Elif ${VOWEL_NAME[v1]} · ${l.name} cezm`,
        `Elif ${VOWEL_NAME[v1]} · ${l.name} ${VOWEL_NAME[v2]}`,
        `Elif ${VOWEL_NAME[v2]} · ${l.name} şeddeli ${VOWEL_NAME[v1]}`,
        ...mates.map((m) => `Elif ${VOWEL_NAME[v1]} · ${m.name} şeddeli ${VOWEL_NAME[v2]}`),
      ];
      p.add({
        id: `${lessonId}-g-syl-${l.id}-${k}`, lessonId, objectiveId: `${lessonId}-o1`, type: "shape-to-spell",
        prompt: "Bu hece nasıl hecelenir?", stimulus: s, correct, confusers: conf,
        plain: others(l, SYLLABLE_LETTERS).map((x) => `Elif ${VOWEL_NAME[v1]} · ${x.name} şeddeli ${VOWEL_NAME[v2]}`), mode: (l.order + k) % 3,
        explanation: `${ar(s)} = ${ar(canonical(elifV(v1) + l.base + SUKUN))} + ${ar(syl(l, v2))}. Şedde harfi iki kez okutur: önce cezmli, sonra ${VOWEL_NAME[v2]}.`,
        source: K1("s.14"),
      });
    }
  }
  return p.qs;
}

export function gameShaddaWords(lessonId: string): Question[] {
  const p = new GamePool();
  const src = K1("s.15");
  SHADDA_WORDS.forEach((w, i) => {
    whichLetterNameQ(p, lessonId, `${lessonId}-o1`, w, i, SHADDA, "şedde", src);
    p.push(renumber(wordSpellingQ(lessonId, `${lessonId}-o2`, w, i, src, [spellWord(canonical(w.replace(SHADDA, "")))]), `${lessonId}-g-spell-${i}`));
    if (countMark(w, SHADDA) > 1) p.push(renumber(countQ(lessonId, `${lessonId}-o1`, w, i, SHADDA, "şedde", src), `${lessonId}-g-count-${i}`));
  });
  return p.qs;
}

// ───────────────────────── Ünite 6: med ─────────────────────────
const longSpell = (l: Letter, v: string) => `${l.name} ${VOWEL_NAME[v]}, ${MADD_LETTER_NAME[v]} ile uzatılır`;

export function gameMaddSyllables(lessonId: string): Question[] {
  const p = new GamePool();
  for (const l of SYLLABLE_LETTERS) {
    const mates = [...family(l, SYLLABLE_LETTERS), ...soundMates(l, SYLLABLE_LETTERS)];
    for (let k = 0; k < 2; k++) {
      const v = VOWELS[(l.order + k) % 3];
      const conf = [`${l.name} ${VOWEL_NAME[v]}, uzatılmaz`, ...VOWELS.filter((x) => x !== v).map((x) => longSpell(l, x)), ...mates.map((m) => longSpell(m, v))];
      p.add({
        id: `${lessonId}-g-long-${l.id}-${k}`, lessonId, objectiveId: `${lessonId}-o1`, type: "shape-to-spell",
        prompt: "Bu hece nasıl okunur?", stimulus: longSyl(l, v), correct: longSpell(l, v), confusers: conf,
        plain: others(l, SYLLABLE_LETTERS).map((x) => longSpell(x, v)), mode: (l.order + k) % 3,
        explanation: `${ar(longSyl(l, v))}: ${VOWEL_NAME[v]}den sonra harekesiz ${MADD_LETTER_NAME[v]} gelir; bir elif miktarı uzatılır.`, source: K1("s.16"),
      });
    }
    const v2 = VOWELS[(l.order + 2) % 3];
    p.add({
      id: `${lessonId}-g-maddletter-${l.id}`, lessonId, objectiveId: `${lessonId}-o2`, type: "madd-letter",
      prompt: "Bu hecede uzatmayı sağlayan harf hangisi?", stimulus: longSyl(l, v2), correct: MADD_LETTER_NAME[v2],
      confusers: ["Elif", "Vav", "Ye", l.name], plain: [], mode: 2,
      explanation: `${ar(longSyl(l, v2))}: ${VOWEL_NAME[v2]}den sonra gelen harekesiz ${MADD_LETTER_NAME[v2]} med harfidir.`, source: K1("s.16"), difficulty: 2,
    });
  }
  return p.qs;
}

export function gameMaddWords(lessonId: string): Question[] {
  const p = new GamePool();
  const src = K1("s.17");
  MADD_WORDS.forEach((w, i) => {
    const cl = clusters(w);
    const m = maddLetters(w);
    if (m.length === 1) {
      // Uzatılan harf: med harfinden önceki harf.
      let idx = -1;
      for (let k = 0; k < cl.length - 1; k++) {
        const n = cl[k + 1];
        if (n.marks.length === 0 && ["ا", "و", "ى", "ي"].includes(n.base) && cl[k].marks.some((x) => x === FATHA || x === DAMMA || x === KASRA || x === "ٖ")) {
          idx = k;
          break;
        }
      }
      const target = idx >= 0 ? letterByChar(cl[idx].base) : undefined;
      if (target) {
        const inWord = lettersOfWord(w).filter((x) => x.id !== target.id);
        p.add({
          id: `${lessonId}-g-longletter-${i}`, lessonId, objectiveId: `${lessonId}-o1`, type: "madd-detect",
          prompt: "Bu kelimede hangi harf uzatılarak okunur?", stimulus: w, correct: target.name,
          confusers: names(inWord), plain: names(others(target, LETTERS)), mode: 2,
          explanation: `${ar(w)}: ${target.name} harfinden sonra harekesiz med harfi geliyor, ${target.name} uzatılır.`, source: src, reviewStatus: "needs-teacher-review", difficulty: 2,
        });
      }
      const maddName = { "ا": "Elif", "و": "Vav", "ى": "Ye" }[m[0]]!;
      p.add({
        id: `${lessonId}-g-maddletter-${i}`, lessonId, objectiveId: `${lessonId}-o2`, type: "madd-letter",
        prompt: "Bu kelimedeki med harfi hangisi?", stimulus: w, correct: maddName,
        confusers: ["Elif", "Vav", "Ye"], plain: names(lettersOfWord(w)), mode: 1,
        explanation: `${ar(w)}: harekesiz ${maddName} önceki harfi uzatır.`, source: src, reviewStatus: "needs-teacher-review", difficulty: 2,
      });
    }
    const want = m.length === 0 ? "Med harfi yok" : `${m.length} med harfi`;
    p.push(makeQuestion({
      id: `${lessonId}-g-count-${i}`, lessonId, objectiveId: `${lessonId}-o2`, type: "mark-count", prompt: "Bu kelimede kaç med harfi var?", stimulus: w,
      correct: T(want), distractors: ["Med harfi yok", "1 med harfi", "2 med harfi", "3 med harfi"].filter((x) => x !== want).map(T),
      explanation: `${ar(w)}: ${m.map(ar).join(" ")} → ${want.toLocaleLowerCase("tr")}.`, difficulty: m.length >= 2 ? 3 : 1, source: src, reviewStatus: "needs-teacher-review",
    }));
  });
  return p.qs;
}

// ───────────────────────── Ünite 7: âsar ve dalgalı med işareti ─────────────────────────
export function gameAsar(lessonId: string): Question[] {
  const p = new GamePool();
  const src = K1("s.18");
  const labels = ["Dikey üstün (âsar)", "Dalgalı med işareti", "Yalnızca med harfi", "Uzatma yok"];
  const kind = (w: string) =>
    w.includes(SUP_ALEF) ? 0 : w.includes(MADDAH) || w.includes(ALEF_MADDA) ? 1 : maddLetters(w).length > 0 ? 2 : 3;
  const items = [...ASAR_WORDS, ...MADDAH_WORDS, ...MADD_WORDS.slice(0, 8), ...HARAKA_WORDS.slice(0, 4)];
  items.forEach((w, i) => {
    const c = kind(w);
    p.push(
      makeQuestion({
        id: `${lessonId}-g-kind-${i}`, lessonId, objectiveId: c === 1 ? `${lessonId}-o3` : `${lessonId}-o1`, type: "mark-meaning",
        prompt: "Bu kelimede hangi uzatma işareti var?", stimulus: w, correct: T(labels[c]), distractors: labels.filter((_, k) => k !== c).map(T),
        explanation:
          c === 0 ? `${ar(w)}: dikey üstün (${ar("ـٰ")}) var; o harf bir elif miktarı uzatılır.`
          : c === 1 ? `${ar(w)}: dalgalı med işareti (${ar("ـٓ")}) var; dört elif miktarı uzatılır.`
          : c === 2 ? `${ar(w)}: yalnızca harekesiz med harfiyle uzatma var.`
          : `${ar(w)}: uzatma yok; harekeler kısa okunur.`,
        difficulty: c === 3 ? 1 : c === 2 ? 3 : 2, source: src, reviewStatus: "needs-teacher-review",
      }),
    );
  });
  ASAR_WORDS.forEach((w, i) => whichLetterNameQ(p, lessonId, `${lessonId}-o2`, w, i, SUP_ALEF, "dikey üstün", src));
  MADDAH_WORDS.slice(0, 4).forEach((w, i) => {
    p.push(
      makeQuestion({
        id: `${lessonId}-g-amount-${i}`, lessonId, objectiveId: `${lessonId}-o3`, type: "mark-meaning",
        prompt: "Dalgalı med işaretinin olduğu yer ne kadar uzatılır?", stimulus: w,
        correct: T("Dört elif miktarı"), distractors: [T("Bir elif miktarı"), T("Hiç uzatılmaz"), T("İki elif miktarı")],
        explanation: "K1 s.18'e göre bu işaretin olduğu yerlerde dört elif miktarı uzatılır.", difficulty: 2, source: src,
      }),
    );
  });
  return p.qs;
}

// ───────────────────────── Ünite 8: tenvin ─────────────────────────
export function gameTanweenSyllables(lessonId: string): Question[] {
  const p = new GamePool();
  for (const l of SYLLABLE_LETTERS) {
    const mates = [...family(l, SYLLABLE_LETTERS), ...soundMates(l, SYLLABLE_LETTERS)];
    for (let k = 0; k < 2; k++) {
      const t = TANWEENS[(l.order + k) % 3];
      const v = vowelOfTanween[t];
      const correct = `${l.name} ${TANWEEN_NAME[t]}`;
      const conf = [
        `${l.name} ${VOWEL_NAME[v]}`,
        ...(t === FATHATAN ? [longSpell(l, FATHA)] : []),
        ...TANWEENS.filter((x) => x !== t).map((x) => `${l.name} ${TANWEEN_NAME[x]}`),
        ...mates.map((m) => `${m.name} ${TANWEEN_NAME[t]}`),
      ];
      p.add({
        id: `${lessonId}-g-tan-${l.id}-${k}`, lessonId, objectiveId: `${lessonId}-o1`, type: "shape-to-spell",
        prompt: "Bu hece nasıl hecelenir?", stimulus: tanSyl(l, t), correct, confusers: conf,
        plain: others(l, SYLLABLE_LETTERS).map((x) => `${x.name} ${TANWEEN_NAME[t]}`), mode: (l.order + k) % 3,
        explanation: `${ar(tanSyl(l, t))}: ${TANWEEN_NAME[t]}; harekeye "n" sesi ekler.${t === FATHATAN ? " Yanındaki elif uzatılmaz." : ""}`, source: K1("s.19"),
      });
    }
    const t2 = TANWEENS[(l.order + 2) % 3];
    const v2 = vowelOfTanween[t2];
    p.push(
      makeQuestion({
        id: `${lessonId}-g-id-${l.id}`, lessonId, objectiveId: `${lessonId}-o2`, type: "identify-hareke",
        prompt: "Bu hecedeki işaret hangisi?", stimulus: tanSyl(l, t2),
        correct: T(tanName(t2)), distractors: [...TANWEENS.filter((x) => x !== t2).map((x) => T(tanName(x))), T(`Tek ${VOWEL_NAME[v2]}`)],
        explanation: `${ar(tanSyl(l, t2))}: ${TANWEEN_NAME[t2]} (tenvin). Tek ${VOWEL_NAME[v2]} ${ar(syl(l, v2))} biçimindedir.`, difficulty: 2, source: K1("s.19"),
      }),
    );
  }
  return p.qs;
}

export function gameTanweenWords(lessonId: string): Question[] {
  const p = new GamePool();
  const src = K1("s.20–21");
  TANWEEN_WORDS.forEach((w, i) => {
    const tw = tanweenOf(w)!;
    p.push(
      makeQuestion({
        id: `${lessonId}-g-id-${i}`, lessonId, objectiveId: `${lessonId}-o1`, type: "identify-hareke",
        prompt: "Bu kelimenin sonundaki tenvin hangisi?", stimulus: w, correct: T(tanName(tw.t)),
        distractors: [...TANWEENS.filter((x) => x !== tw.t).map((x) => T(tanName(x))), T(`Tek ${VOWEL_NAME[vowelOfTanween[tw.t]]}`)],
        explanation: `${ar(w)}: ${TANWEEN_NAME[tw.t]}. Tek hareke, tenvin değildir.`, difficulty: i % 3 === 0 ? 1 : 2, source: src, reviewStatus: "needs-teacher-review",
      }),
    );
  });
  p.push(
    makeQuestion({
      id: `${lessonId}-g-alif`, lessonId, objectiveId: `${lessonId}-o2`, type: "mark-meaning",
      prompt: "İki üstünün yanındaki elif uzatılır mı?", stimulus: "نُورًا",
      correct: T("Hayır, uzatılmaz"), distractors: [T("Evet, bir elif uzatılır"), T("Evet, dört elif uzatılır")],
      explanation: `${ar("نُورًا")}: iki üstünün yanındaki elif yazılır ama uzatılmaz.`, difficulty: 3, source: K1("s.19"),
    }),
    makeQuestion({
      id: `${lessonId}-g-sound`, lessonId, objectiveId: `${lessonId}-o2`, type: "mark-meaning",
      prompt: "Bu kelimenin sonundaki tenvin harekeye hangi sesi ekler?", stimulus: "كِتَابٌ",
      correct: T("“n” sesi"), distractors: [T("“m” sesi"), T("Uzatma"), T("Hiçbir ses")],
      explanation: "Tenvin, bulunduğu harfin harekesine \"n\" sesi verir (K1 s.19).", difficulty: 3, source: K1("s.19"),
    }),
  );
  return p.qs;
}

// ───────────────────────── Ünite 9–10: kural yargıları (karşılaştırma soruları alıştırmada) ─────────────────────────
const ruleOnly = (qs: Question[]) => qs.filter((q) => q.type === "rule-judgement").map((q) => renumber(q, q.id.replace("-rule-", "-g-rule-")));
export const gameZamir = (id: string) => ruleOnly(genZamir(id));
export const gameLafza = (id: string) => ruleOnly(genLafza(id));
export const gameElifLam = (id: string) => ruleOnly(genElifLam(id));
export const gameRa = (id: string) => ruleOnly(genRa(id));

// ───────────────────────── Ünite 11: duruş ve geçiş ─────────────────────────
export function gameVakf(lessonId: string): Question[] {
  const p = new GamePool();
  const vakfLabels = ["Son harf cezmli okunur", "Son harf harekesiyle okunur", "Son hece uzatılır", "Sonuna “n” sesi eklenir"];
  VAKF_WORDS.forEach((w, i) => {
    const { last } = lastCluster(w);
    const tan = last.marks.find((m) => TANWEENS.includes(m));
    p.push(
      makeQuestion({
        id: `${lessonId}-g-vakf-${i}`, lessonId, objectiveId: `${lessonId}-o1`, type: "rule-judgement",
        prompt: "Bu kelimenin sonunda durursak nasıl okunur?", stimulus: w, correct: T(vakfLabels[0]), distractors: vakfLabels.slice(1).map(T),
        explanation: `Durulan kelimenin son harekesi ${tan ? TANWEEN_NAME[tan] : "tek hareke"} ise cezme döner.`, difficulty: tan ? 2 : 1,
        source: K2("Ders 15 Vakfetme Kuralları"), reviewStatus: "needs-teacher-review",
      }),
    );
  });
  TRANSITION_PAIRS.forEach(([a, b], i) => {
    const tw = tanweenOf(a)!;
    const v = vowelOfTanween[tw.t];
    const stimulus = `${a} ${b}`;
    p.push(
      makeQuestion({
        id: `${lessonId}-g-gecis-nun-${i}`, lessonId, objectiveId: `${lessonId}-o2`, type: "transition",
        prompt: "Bu iki kelime birleştirilerek okunurken araya ne eklenir?", stimulus,
        correct: T("Esreli Nun"), distractors: [T("Üstünlü Nun"), T("Ötreli Nun"), T("Hiçbir şey eklenmez")],
        explanation: `Tenvinden sonra cezmli veya şeddeli harfle başlayan kelime gelince araya esreli nun ${ar("نِ")} eklenir.`, difficulty: 2,
        source: K2("Ders 29"), reviewStatus: "needs-teacher-review",
      }),
      makeQuestion({
        id: `${lessonId}-g-gecis-v-${i}`, lessonId, objectiveId: `${lessonId}-o2`, type: "transition",
        prompt: "Geçişte ilk kelimedeki tenvin hangi harekeye döner?", stimulus,
        correct: T(capital(VOWEL_NAME[v])), distractors: [...VOWELS.filter((x) => x !== v).map((x) => T(capital(VOWEL_NAME[x]))), T("Cezm")],
        explanation: `${ar(a)} kelimesindeki ${TANWEEN_NAME[tw.t]}, ${VOWEL_NAME[v]}ye döner.`, difficulty: 3, source: K2("Ders 29"), reviewStatus: "needs-teacher-review",
      }),
    );
  });
  return p.qs;
}

