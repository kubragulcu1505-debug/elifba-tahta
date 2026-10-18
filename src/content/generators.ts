// Ders başına soru havuzu üreticileri. Çeldiriciler anlamlı hatalara göre seçilir:
// nokta benzerliği, Türkçede aynı sese karşılık gelen harf, yanlış hareke, soldan sağa okuma,
// cezm yerine hareke, şeddeyi atlama, tenvini medle karıştırma.
import type { Difficulty, Question, SourceRef } from "./types.ts";
import {
  FATHA, KASRA, DAMMA, SUKUN, SHADDA, FATHATAN, KASRATAN, DAMMATAN, SUP_ALEF, SUB_ALEF, TATWEEL,
  ALEF, WAW, ALEF_MAKSURA, YEH, HEH, MADDAH, clusters, type Cluster, canonical,
} from "./arabic.ts";
import { LETTERS, GROUPS, NON_CONNECTORS, forms, wrongConnectedForm, dotsText, dotsQuestionText, sameDots, letterByChar, type Letter } from "./letters.ts";
import { makeQuestion, takeDistinct, spellWord, VOWEL_NAME, ar, stableSort, type OptSpec } from "./build.ts";
import {
  PLAIN_WORDS, HARAKA_WORDS, SUKUN_WORDS, SHADDA_WORDS, MADD_WORDS, ASAR_WORDS, MADDAH_WORDS, TANWEEN_WORDS,
  ZAMIR_WORDS, LAFZA_PHRASES, ELIF_LAM_WORDS, RA_WORDS, VAKF_WORDS, TRANSITION_PAIRS,
} from "./words.ts";

const K1 = (locator: string): SourceRef => ({ id: "K1", locator });
const K2 = (locator: string): SourceRef => ({ id: "K2", locator });

const A = (label: string): OptSpec => ({ label, kind: "arabic" });
const T = (label: string): OptSpec => ({ label, kind: "text" });

const VOWELS = [FATHA, KASRA, DAMMA];
const diffFrom = (confusable: number): Difficulty => (confusable >= 2 ? 3 : confusable === 1 ? 2 : 1);

// ───────────────────────── harf yardımcıları ─────────────────────────
const upToGroup = (g: number) => LETTERS.filter((l) => l.group <= g);
const family = (l: Letter, pool: Letter[]) => pool.filter((x) => x.id !== l.id && l.family && x.family === l.family);
const soundMates = (l: Letter, pool: Letter[]) => pool.filter((x) => x.id !== l.id && l.soundGroup && x.soundGroup === l.soundGroup);
const others = (l: Letter, pool: Letter[]) => pool.filter((x) => x.id !== l.id);
const disp = (ls: Letter[]) => ls.map((l) => l.display);
const names = (ls: Letter[]) => ls.map((l) => l.name);

/** Harekeli tek hece. He harfi K1 s.9'daki gibi tatvil ile yazılır (هَـ). */
function syl(l: Letter, v: string): string {
  if (l.id === "he") return canonical(HEH + v + TATWEEL);
  return canonical(l.base + v);
}
/** Med harfiyle uzatılmış hece: بَا بٖى بُو */
function longSyl(l: Letter, v: string): string {
  if (v === FATHA) return canonical(l.base + FATHA + ALEF);
  if (v === KASRA) return canonical(l.base + SUB_ALEF + ALEF_MAKSURA);
  return canonical(l.base + DAMMA + WAW);
}
/** Tenvinli hece: بًا بٍ بٌ (K1 s.19) */
function tanSyl(l: Letter, t: string): string {
  if (t === FATHATAN) return canonical(l.base + FATHATAN + ALEF);
  if (l.id === "he") return canonical(HEH + t + TATWEEL);
  return canonical(l.base + t);
}
const TANWEEN_NAME: Record<string, string> = { [FATHATAN]: "iki üstün", [KASRATAN]: "iki esre", [DAMMATAN]: "iki ötre" };
const TANWEENS = [FATHATAN, KASRATAN, DAMMATAN];
const vowelOfTanween: Record<string, string> = { [FATHATAN]: FATHA, [KASRATAN]: KASRA, [DAMMATAN]: DAMMA };
const MADD_LETTER_OF: Record<string, string> = { [FATHA]: ALEF, [KASRA]: ALEF_MAKSURA, [DAMMA]: WAW };
const MADD_LETTER_NAME: Record<string, string> = { [FATHA]: "Elif", [KASRA]: "Ye", [DAMMA]: "Vav" };

const join = (cl: Cluster[]) => canonical(cl.map((c) => c.base + c.marks.join("")).join(""));

/** Kelimedeki ilk benzer (aile/ses) harfi değiştirir. */
function swapLetter(word: string, seed: string): string | undefined {
  const cl = clusters(word);
  for (let i = 0; i < cl.length; i++) {
    const l = letterByChar(cl[i].base);
    if (!l || l.id === "ye" || l.id === "he") continue;
    const mates = [...family(l, LETTERS), ...soundMates(l, LETTERS)].filter((m) => m.id !== "ye" && m.id !== "he");
    if (mates.length === 0) continue;
    const m = stableSort(mates, (x) => seed + x.id)[0];
    const copy = cl.map((c) => ({ ...c, marks: [...c.marks] }));
    copy[i].base = m.base;
    return join(copy);
  }
  return undefined;
}
/** n'inci harekeli kümenin harekesini değiştirir. */
function changeVowel(word: string, nth: number): string | undefined {
  const cl = clusters(word).map((c) => ({ ...c, marks: [...c.marks] }));
  let k = 0;
  for (const c of cl) {
    const idx = c.marks.findIndex((m) => VOWELS.includes(m));
    if (idx < 0) continue;
    if (k === nth) {
      const v = c.marks[idx];
      c.marks[idx] = VOWELS[(VOWELS.indexOf(v) + 1) % 3];
      return join(cl);
    }
    k++;
  }
  return undefined;
}
function reversedSpelling(word: string): string {
  return clusters(word).filter((c) => c.base !== " ").reverse().map((c) => spellWord(c.base + c.marks.join(""))).join(" · ");
}

// ───────────────────────── Ünite 1: harfler ─────────────────────────
function letterQuestions(lessonId: string, targets: Letter[], pool: Letter[], src: SourceRef, opts: { order?: boolean; dots?: boolean; similar?: boolean; find?: boolean; name?: boolean }): Question[] {
  const qs: Question[] = [];
  const o = (n: number) => `${lessonId}-o${n}`;
  for (const l of targets) {
    if (opts.find !== false) {
      const conf0 = [...soundMates(l, pool), ...family(l, pool)];
      const tiers = byMode(l.order % 3, disp(conf0), disp(others(l, pool).filter((x) => !conf0.includes(x))));
      const ds = takeDistinct(l.display, tiers, 3, l.id);
      const conf = ds.filter((d) => [...soundMates(l, pool), ...family(l, pool)].some((x) => x.display === d)).length;
      qs.push(makeQuestion({
        id: `${lessonId}-find-${l.id}`, lessonId, objectiveId: o(1), type: "find-letter-by-name",
        prompt: `“${l.name}” harfini bul.`, correct: A(l.display), distractors: ds.map(A),
        explanation: `${l.name}: ${ar(l.display)} — ${dotsText(l)}.`, difficulty: diffFrom(conf), source: src,
      }));
    }
    if (opts.name !== false) {
      const conf0 = [...family(l, pool), ...soundMates(l, pool)];
      const tiers = byMode((l.order + 1) % 3, names(conf0), names(others(l, pool).filter((x) => !conf0.includes(x))));
      const ds = takeDistinct(l.name, tiers, 3, l.id + "n");
      const conf = ds.filter((d) => [...family(l, pool), ...soundMates(l, pool)].some((x) => x.name === d)).length;
      qs.push(makeQuestion({
        id: `${lessonId}-name-${l.id}`, lessonId, objectiveId: o(2), type: "name-of-letter",
        prompt: "Bu harfin adı ne?", stimulus: l.display, correct: T(l.name), distractors: ds.map(T),
        explanation: `${ar(l.display)} harfinin adı ${l.name}. ${capital(dotsText(l))}.`, difficulty: diffFrom(conf), source: src,
      }));
    }
    if (opts.similar) {
      const fam = family(l, pool);
      const ds = takeDistinct(l.display, byMode((l.order + 2) % 3, disp(fam), disp(others(l, pool).filter((x) => !fam.includes(x)))), 3, l.id + "s");
      const conf = ds.filter((d) => fam.some((x) => x.display === d)).length;
      qs.push(makeQuestion({
        id: `${lessonId}-same-${l.id}`, lessonId, objectiveId: opts.order === undefined ? o(1) : o(3), type: "similar-letter",
        prompt: "Bu harfin aynısını bul.", stimulus: l.display, correct: A(l.display), distractors: ds.map(A),
        explanation: `${ar(l.display)} (${l.name}): ${dotsText(l)}.${fam.length ? " Benzerleri: " + fam.map((f) => `${ar(f.display)} ${f.name}`).join(", ") + "." : ""}`,
        difficulty: diffFrom(conf), source: src,
      }));
    }
    if (opts.dots && l.id !== "ye") {
      const differ = (xs: Letter[]) => xs.filter((x) => x.id !== "ye" && !sameDots(l, x));
      const ds = takeDistinct(l.display, [disp(differ(family(l, pool))), disp(differ(others(l, pool)))], 3, l.id + "d");
      if (ds.length === 3) {
        const conf = ds.filter((d) => family(l, pool).some((x) => x.display === d)).length;
        qs.push(makeQuestion({
          id: `${lessonId}-dots-${l.id}`, lessonId, objectiveId: opts.order === undefined ? o(2) : o(3), type: "dots",
          prompt: dotsQuestionText(l), correct: A(l.display), distractors: ds.map(A),
          explanation: `${ar(l.display)} (${l.name}): ${dotsText(l)}.`, difficulty: diffFrom(conf), source: K2("Harfler > Pekiştirme"),
        }));
      }
    }
    if (opts.order) {
      const next = pool.find((x) => x.order === l.order + 1);
      if (next) {
        const near = pool.filter((x) => x.id !== next.id && x.id !== l.id && Math.abs(x.order - l.order) <= 3);
        const ds = takeDistinct(next.display, [disp(near), disp(others(next, pool).filter((x) => x.id !== l.id))], 3, l.id + "o");
        qs.push(makeQuestion({
          id: `${lessonId}-order-${l.id}`, lessonId, objectiveId: o(4), type: "letter-order",
          prompt: `Elifba sırasında ${ar(l.display)} harfinden sonra hangi harf gelir?`, correct: A(next.display), distractors: ds.map(A),
          explanation: `Sıra: ${ar(l.display)} ${l.name}, sonra ${ar(next.display)} ${next.name}.`, difficulty: 2, source: K1("s.6"),
        }));
      }
    }
  }
  return qs;
}

/** Zorluk kipi: 0 = benzer olmayan çeldiriciler önce, 1 = bir karışık çeldirici, 2 = hepsi karışık. */
function byMode<T>(mode: number, confusers: T[], plain: T[]): T[][] {
  if (mode === 0) return [plain, confusers];
  if (mode === 1) return [confusers.slice(0, 1), plain, confusers];
  return [confusers, plain];
}

function capital(s: string) {
  return s.charAt(0).toLocaleUpperCase("tr") + s.slice(1);
}

export function genLetterGroup(lessonId: string, g: 1 | 2 | 3 | 4): Question[] {
  return letterQuestions(lessonId, GROUPS[g], upToGroup(g), K1("s.6–7"), { order: true, dots: true, similar: true });
}
export function genSimilar(lessonId: string): Question[] {
  return letterQuestions(lessonId, LETTERS, LETTERS, K2("Harfler > Pekiştirme"), { similar: true, dots: true, find: false, name: false });
}
export function genLetterMix(lessonId: string): Question[] {
  return letterQuestions(lessonId, LETTERS, LETTERS, K1("s.7"), {});
}

// ───────────────────────── Ünite 2: yazılışlar ─────────────────────────
type Pos = "initial" | "medial" | "final" | "isolated";
const POS_NAME: Record<Pos, string> = { initial: "başta", medial: "ortada", final: "sonda", isolated: "ayrı" };
/** Yazılışta şekil ailesi: başta/ortada yâ da ب ailesine benzer. */
function formFamily(l: Letter, pos: Pos): Letter[] {
  const fam = family(l, LETTERS);
  if ((pos === "initial" || pos === "medial") && (l.family === "beh" || l.id === "ye")) {
    const beh = LETTERS.filter((x) => (x.family === "beh" || x.id === "ye") && x.id !== l.id);
    return beh;
  }
  return fam;
}

export function genForms(lessonId: string, pos: "initial" | "medial" | "final"): Question[] {
  const qs: Question[] = [];
  for (const l of LETTERS) {
    const f = forms(l);
    const correct = f[pos];
    const fam = formFamily(l, pos);
    const wrong = wrongConnectedForm(l, pos === "final" ? "medial" : pos);
    const otherPos = (["initial", "medial", "final"] as const).filter((p) => p !== pos).map((p) => f[p]);
    const tiers = [fam.map((x) => forms(x)[pos]), wrong ? [wrong] : [], otherPos, others(l, LETTERS).map((x) => forms(x)[pos])];
    const ds = takeDistinct(correct, tiers, 3, l.id + pos);
    const conf = ds.filter((d) => fam.some((x) => forms(x)[pos] === d) || d === wrong || otherPos.includes(d)).length;
    const joinNote = l.joining === "right"
      ? `${ar(f.isolated)} kendinden sonraki harfe bağlanmaz.`
      : `${ar(f.isolated)} iki yandan bağlanabilir.`;
    qs.push(makeQuestion({
      id: `${lessonId}-form-${l.id}`, lessonId, objectiveId: `${lessonId}-o1`, type: "letter-form",
      prompt: `${ar(f.isolated)} (${l.name}) harfinin ${POS_NAME[pos]} yazılışı hangisi?`, stimulus: f.isolated,
      correct: A(correct), distractors: ds.map(A),
      explanation: `${l.name} ${POS_NAME[pos]}: ${ar(correct)}. ${joinNote}`, difficulty: diffFrom(conf), source: K1("s.8"),
    }));
    // Yazılış, harf tablosundaki biçimle aynıysa (ör. başta د, هـ) bu soru bir şey ölçmez; atla.
    if (canonical(correct) === canonical(l.display)) continue;
    const tiers2 = [disp(formFamily(l, pos)), disp(soundMates(l, LETTERS)), disp(others(l, LETTERS))];
    const ds2 = takeDistinct(l.display, tiers2, 3, l.id + pos + "r");
    const conf2 = ds2.filter((d) => formFamily(l, pos).some((x) => x.display === d)).length;
    qs.push(makeQuestion({
      id: `${lessonId}-which-${l.id}`, lessonId, objectiveId: `${lessonId}-o2`, type: "form-to-letter",
      prompt: `Bu ${POS_NAME[pos]} yazılış hangi harfe ait?`, stimulus: correct, correct: A(l.display), distractors: ds2.map(A),
      explanation: `${ar(correct)} → ${ar(l.display)} (${l.name}). ${capital(dotsText(l))}.`, difficulty: diffFrom(conf2), source: K1("s.8"),
    }));
  }
  return qs;
}

function lamAlifQuestions(lessonId: string, objectiveId: string): Question[] {
  return [
    makeQuestion({
      id: `${lessonId}-lamalif-parts`, lessonId, objectiveId, type: "letter-in-word",
      prompt: "Bu yazılış sağdan sola hangi harflerden oluşur?", stimulus: "لا",
      correct: T("Önce Lam, sonra Elif"), distractors: [T("Önce Elif, sonra Lam"), T("Önce Kef, sonra Elif"), T("Önce Lam, sonra Vav")],
      explanation: `${ar("لا")} ayrı bir harf değildir; ${ar("ل")} Lam ile ${ar("ا")} Elif'in birlikte yazılışıdır.`,
      difficulty: 2, source: K1("s.6 notu"),
    }),
    makeQuestion({
      id: `${lessonId}-lamalif-shape`, lessonId, objectiveId, type: "letter-form",
      prompt: "Lam ile Elif yan yana gelince nasıl yazılır?", correct: A("لا"), distractors: [A("ال"), A("لو"), A("كا")],
      explanation: `Lam + Elif = ${ar("لا")}. ${ar("ال")} ise önce Elif sonra Lam'dır.`, difficulty: 2, source: K2("Harfler notu"),
    }),
  ];
}

export function genJoining(lessonId: string): Question[] {
  const qs: Question[] = [];
  const connectors = LETTERS.filter((l) => l.joining === "dual");
  for (const n of NON_CONNECTORS) {
    const ds = takeDistinct(n.display, [disp(stableSort(connectors, (x) => n.id + x.id).slice(0, 6))], 3, n.id);
    qs.push(makeQuestion({
      id: `${lessonId}-nojoin-${n.id}`, lessonId, objectiveId: `${lessonId}-o1`, type: "joining",
      prompt: "Hangi harf kendinden sonra gelen harfe bağlanmaz?", correct: A(n.display), distractors: ds.map(A),
      explanation: `${ar("ا د ذ ر ز و")} harfleri kendinden sonraki harfe bağlanmaz. ${ar(n.display)} bunlardan biri.`, difficulty: 2, source: K1("s.8"),
    }));
  }
  for (const c of stableSort(connectors, (x) => "join" + x.id).slice(0, 8)) {
    const ds = takeDistinct(c.display, [disp(NON_CONNECTORS)], 3, c.id);
    qs.push(makeQuestion({
      id: `${lessonId}-join-${c.id}`, lessonId, objectiveId: `${lessonId}-o1`, type: "joining",
      prompt: "Hangi harf iki yandan da bağlanabilir?", correct: A(c.display), distractors: ds.map(A),
      explanation: `${ar(c.display)} (${c.name}) iki yandan bağlanır. ${ar("ا د ذ ر ز و")} ise kendinden sonrakine bağlanmaz.`, difficulty: 2, source: K1("s.8"),
    }));
  }
  qs.push(...lamAlifQuestions(lessonId, `${lessonId}-o3`));
  const posNames = ["ilk", "ortadaki", "son"] as const;
  PLAIN_WORDS.forEach((word, i) => {
    const chars = [...word];
    const p = i % 3;
    const idx = p === 0 ? 0 : p === 1 ? 1 : chars.length - 1;
    const target = letterByChar(chars[idx])!;
    const mirror = letterByChar(chars[chars.length - 1 - idx])!;
    const inWord = chars.map((c) => letterByChar(c)!).filter((l) => l.id !== target.id);
    const tiers = [p !== 1 ? [mirror.display] : [], disp(family(target, LETTERS)), disp(inWord), disp(soundMates(target, LETTERS)), disp(others(target, LETTERS))];
    const ds = takeDistinct(target.display, tiers, 3, word);
    const conf = (p !== 1 && ds.includes(mirror.display) ? 1 : 0) + ds.filter((d) => family(target, LETTERS).some((x) => x.display === d)).length;
    qs.push(makeQuestion({
      id: `${lessonId}-inword-${i}`, lessonId, objectiveId: `${lessonId}-o2`, type: "letter-in-word",
      prompt: `Bu kelimenin ${posNames[p]} harfi hangisi? Sağdan sola okuyun.`, stimulus: word,
      correct: A(target.display), distractors: ds.map(A),
      explanation: `${ar(word)} sağdan sola: ${chars.map((c) => letterByChar(c)!.name).join(", ")}. ${capital(posNames[p])} harf ${target.name}.`,
      difficulty: diffFrom(conf), source: K2("Harfler ve Şekilleri"), reviewStatus: "needs-teacher-review",
    }));
  });
  return qs;
}

export function genFormsMix(lessonId: string): Question[] {
  const qs: Question[] = [];
  const order: Pos[] = ["initial", "medial", "final", "isolated"];
  for (const l of LETTERS) {
    let pos = order[l.order % 4];
    // Sağdan bağlanan harflerin başta ve ayrı yazılışı aynıdır; daha öğretici olan "ortada"yı seç.
    if (l.joining === "right" && (pos === "initial" || pos === "isolated")) pos = "medial";
    const shape = pos === "isolated" ? forms(l).isolated : forms(l)[pos];
    const fam = formFamily(l, pos);
    const ds = takeDistinct(l.display, [disp(fam), disp(soundMates(l, LETTERS)), disp(others(l, LETTERS))], 3, l.id + "mix");
    const conf = ds.filter((d) => fam.some((x) => x.display === d)).length;
    qs.push(makeQuestion({
      id: `${lessonId}-which-${l.id}`, lessonId, objectiveId: `${lessonId}-o1`, type: "form-to-letter",
      prompt: `Bu yazılış (${POS_NAME[pos]}) hangi harfe ait?`, stimulus: shape, correct: A(l.display), distractors: ds.map(A),
      explanation: `${ar(shape)} → ${ar(l.display)} (${l.name}).`, difficulty: diffFrom(conf), source: K1("s.8"),
    }));
  }
  for (const l of stableSort(LETTERS, (x) => "mixform" + x.id).slice(0, 6)) {
    const pos: "initial" | "medial" | "final" = (["initial", "medial", "final"] as const)[l.order % 3];
    const f = forms(l);
    const fam = formFamily(l, pos);
    const ds = takeDistinct(f[pos], [fam.map((x) => forms(x)[pos]), others(l, LETTERS).map((x) => forms(x)[pos])], 3, l.id + "mf");
    qs.push(makeQuestion({
      id: `${lessonId}-form-${l.id}`, lessonId, objectiveId: `${lessonId}-o1`, type: "letter-form",
      prompt: `${ar(f.isolated)} (${l.name}) harfinin ${POS_NAME[pos]} yazılışı hangisi?`, stimulus: f.isolated, correct: A(f[pos]), distractors: ds.map(A),
      explanation: `${l.name} ${POS_NAME[pos]}: ${ar(f[pos])}.`, difficulty: 2, source: K1("s.8"),
    }));
  }
  qs.push(...lamAlifQuestions(lessonId, `${lessonId}-o1`));
  return qs;
}

// ───────────────────────── Ünite 3: harekeler ─────────────────────────
const spell1 = (l: Letter, v: string) => `${l.name} ${VOWEL_NAME[v]}`;

export function genVowel(lessonId: string, v: string, allowed: string[], src: SourceRef): Question[] {
  const qs: Question[] = [];
  const otherV = allowed.filter((x) => x !== v);
  for (const l of LETTERS) {
    const fam = family(l, LETTERS);
    const snd = soundMates(l, LETTERS);
    const plain = others(l, LETTERS).filter((x) => !fam.includes(x) && !snd.includes(x)).map((x) => syl(x, v));
    // Zorluk karışımı: harf sırasına göre kolay (benzer olmayan harfler), orta (bir karışık çeldirici), zor (hepsi karışık).
    const mode = l.order % 3;
    const confusers = [...otherV.map((x) => syl(l, x)), ...fam.map((x) => syl(x, v)), ...snd.map((x) => syl(x, v))];
    const tiers = mode === 0 ? [plain] : mode === 1 ? [confusers.slice(0, 1), plain] : [otherV.map((x) => syl(l, x)), fam.map((x) => syl(x, v)), snd.map((x) => syl(x, v)), plain];
    const ds = takeDistinct(syl(l, v), tiers, 3, l.id + v);
    const confSet = new Set([...otherV.map((x) => syl(l, x)), ...fam.map((x) => syl(x, v)), ...snd.map((x) => syl(x, v))]);
    qs.push(makeQuestion({
      id: `${lessonId}-s2s-${l.id}`, lessonId, objectiveId: `${lessonId}-o1`, type: "spell-to-shape",
      prompt: `“${spell1(l, v)}” hangisi?`, correct: A(syl(l, v)), distractors: ds.map(A),
      explanation: `${ar(syl(l, v))} = ${spell1(l, v)}. ${VOWEL_EXPLAIN[v]}`, difficulty: diffFrom(ds.filter((d) => confSet.has(canonical(d))).length), source: src,
      audioId: `syl-${l.id}-${VOWEL_KEY[v]}`,
    }));
    const plain2 = others(l, LETTERS).filter((x) => !fam.includes(x) && !snd.includes(x)).map((x) => spell1(x, v));
    const confusers2 = [...otherV.map((x) => spell1(l, x)), ...fam.map((x) => spell1(x, v)), ...snd.map((x) => spell1(x, v))];
    const mode2 = (l.order + 1) % 3;
    const tiers2 = mode2 === 0 ? [plain2] : mode2 === 1 ? [confusers2.slice(0, 1), plain2] : [confusers2, plain2];
    const ds2 = takeDistinct(spell1(l, v), tiers2, 3, l.id + v + "r");
    const confSet2 = new Set([...otherV.map((x) => spell1(l, x)), ...fam.map((x) => spell1(x, v)), ...snd.map((x) => spell1(x, v))]);
    qs.push(makeQuestion({
      id: `${lessonId}-sh2s-${l.id}`, lessonId, objectiveId: `${lessonId}-o2`, type: "shape-to-spell",
      prompt: "Bu hece nasıl hecelenir?", stimulus: syl(l, v), correct: T(spell1(l, v)), distractors: ds2.map(T),
      explanation: `${ar(syl(l, v))}: harf ${l.name}, hareke ${VOWEL_NAME[v]}.`, difficulty: diffFrom(ds2.filter((d) => confSet2.has(d)).length), source: src,
    }));
  }
  return qs;
}
const VOWEL_KEY: Record<string, string> = { [FATHA]: "fatha", [KASRA]: "kasra", [DAMMA]: "damma" };
const VOWEL_EXPLAIN: Record<string, string> = {
  [FATHA]: "Üstün harfin üstündeki eğik çizgidir.",
  [KASRA]: "Esre harfin altındaki eğik çizgidir.",
  [DAMMA]: "Ötre harfin üstündeki küçük vav biçimli işarettir.",
};

export function genVowelCompare(lessonId: string): Question[] {
  const qs: Question[] = [];
  for (const l of LETTERS) {
    const v = VOWELS[l.order % 3];
    qs.push(makeQuestion({
      id: `${lessonId}-id-${l.id}`, lessonId, objectiveId: `${lessonId}-o1`, type: "identify-hareke",
      prompt: "Bu harfin harekesi hangisi?", stimulus: syl(l, v), correct: T(cap(VOWEL_NAME[v])),
      distractors: VOWELS.filter((x) => x !== v).map((x) => T(cap(VOWEL_NAME[x]))),
      explanation: `${ar(syl(l, v))}: ${VOWEL_NAME[v]}. ${VOWEL_EXPLAIN[v]}`, difficulty: 1, source: K1("s.9"),
    }));
    const v2 = VOWELS[(l.order + 1) % 3];
    const mate = [...family(l, LETTERS), ...soundMates(l, LETTERS)][0];
    const ds = takeDistinct(syl(l, v2), [VOWELS.filter((x) => x !== v2).map((x) => syl(l, x)), mate ? [syl(mate, v2)] : [], others(l, LETTERS).map((x) => syl(x, v2))], 3, l.id + "cmp");
    qs.push(makeQuestion({
      id: `${lessonId}-cmp-${l.id}`, lessonId, objectiveId: `${lessonId}-o2`, type: "spell-to-shape",
      prompt: `“${spell1(l, v2)}” hangisi?`, correct: A(syl(l, v2)), distractors: ds.map(A),
      explanation: `${ar(VOWELS.map((x) => syl(l, x)).join(" "))}: ${VOWELS.map((x) => spell1(l, x)).join(" • ")}.`, difficulty: mate ? 3 : 2, source: K1("s.9"),
    }));
  }
  return qs;
}
const cap = (s: string) => capital(s);

/** Kelime heceleme soruları (Ünite 3–5). */
function wordSpellingQ(lessonId: string, objectiveId: string, word: string, i: number, src: SourceRef, extra: string[] = []): Question {
  const correct = spellWord(word);
  const variants = [reversedSpelling(word), ...extra, changeVowel(word, 1) && spellWord(changeVowel(word, 1)!), swapLetter(word, word) && spellWord(swapLetter(word, word)!), changeVowel(word, 0) && spellWord(changeVowel(word, 0)!)]
    .filter((x): x is string => !!x && x !== correct);
  // Kolay kipte önce ters sıra ve harf değişikliği; diğerlerinde hareke farkları da var.
  const ds = takeDistinct(correct, i % 3 === 0 ? [[variants[0]], variants.slice(-2), variants] : [variants], 3, word);
  return makeQuestion({
    id: `${lessonId}-spell-${i}`, lessonId, objectiveId, type: "word-spelling",
    prompt: "Bu kelime sağdan sola nasıl hecelenir?", stimulus: word, correct: T(correct), distractors: ds.map(T),
    explanation: `${ar(word)} → ${correct}.`, difficulty: i % 3 === 0 ? 1 : 3, source: src, reviewStatus: "needs-teacher-review",
  });
}
function spellingToWordQ(lessonId: string, objectiveId: string, word: string, i: number, src: SourceRef, extra: string[] = []): Question {
  const variants = [...extra, changeVowel(word, 0), swapLetter(word, word + "x"), changeVowel(word, 2), changeVowel(word, 1)].filter((x): x is string => !!x && canonical(x) !== canonical(word));
  const ds = takeDistinct(word, [variants], 3, word + "w");
  return makeQuestion({
    id: `${lessonId}-word-${i}`, lessonId, objectiveId, type: "spelling-to-word",
    prompt: `“${spellWord(word)}” hangisi?`, correct: A(word), distractors: ds.map(A),
    explanation: `${spellWord(word)} → ${ar(word)}. Diğer şıklarda bir harf veya bir işaret farklı.`, difficulty: 2, source: src, reviewStatus: "needs-teacher-review",
  });
}

export function genHarakaWords(lessonId: string): Question[] {
  return HARAKA_WORDS.map((w, i) =>
    i % 2 === 0 ? wordSpellingQ(lessonId, `${lessonId}-o1`, w, i, K1("s.10–11")) : spellingToWordQ(lessonId, `${lessonId}-o2`, w, i, K1("s.10–11")),
  );
}

// ───────────────────────── Ünite 4: cezm ─────────────────────────
const SYLLABLE_LETTERS = LETTERS.filter((l) => !["elif", "vav", "ye"].includes(l.id));
const elifV = (v: string) => canonical(ALEF + v);

export function genSukunSyllables(lessonId: string): Question[] {
  const qs: Question[] = [];
  for (const l of SYLLABLE_LETTERS) {
    const v = VOWELS[l.order % 3];
    const s = canonical(elifV(v) + l.base + SUKUN);
    const mate = [...family(l, SYLLABLE_LETTERS), ...soundMates(l, SYLLABLE_LETTERS)][0];
    const vOther = VOWELS[(l.order + 1) % 3];
    const mode = l.order % 3;
    const farLetters = stableSort(SYLLABLE_LETTERS.filter((x) => x.id !== l.id && x !== mate), (x) => l.id + x.id).slice(0, 3).map((x) => canonical(elifV(v) + x.base + SUKUN));
    const structural = [canonical(elifV(v) + l.base + v), canonical(elifV(vOther) + l.base + SUKUN)];
    const tiersSk = mode === 0 ? [farLetters] : mode === 1 ? [structural.slice(0, 1), farLetters] : [structural, mate ? [canonical(elifV(v) + mate.base + SUKUN)] : [], [canonical(elifV(v) + l.base + VOWELS[(l.order + 2) % 3])]];
    const ds = takeDistinct(s, tiersSk, 3, l.id + "sk");
    qs.push(makeQuestion({
      id: `${lessonId}-s2s-${l.id}`, lessonId, objectiveId: `${lessonId}-o1`, type: "spell-to-shape",
      prompt: `“Elif ${VOWEL_NAME[v]} · ${l.name} cezm” hangisi?`, correct: A(s), distractors: ds.map(A),
      explanation: `${ar(s)}: cezmli ${l.name} önceki harekeyle birleşir; ona hareke sesi verilmez.`, difficulty: (mode + 1) as Difficulty, source: K1("s.12"),
    }));
    const v3 = VOWELS[(l.order + 2) % 3];
    const s3 = canonical(elifV(v3) + l.base + SUKUN);
    const correct = `Elif ${VOWEL_NAME[v3]} · ${l.name} cezm`;
    const ds2 = takeDistinct(correct, [[`Elif ${VOWEL_NAME[v3]} · ${l.name} ${VOWEL_NAME[v3]}`, `Elif ${VOWEL_NAME[VOWELS[(l.order) % 3]]} · ${l.name} cezm`], mate ? [`Elif ${VOWEL_NAME[v3]} · ${mate.name} cezm`] : [], [`Elif ${VOWEL_NAME[VOWELS[(l.order + 1) % 3]]} · ${l.name} cezm`]], 3, l.id + "sk2");
    qs.push(makeQuestion({
      id: `${lessonId}-sh2s-${l.id}`, lessonId, objectiveId: `${lessonId}-o2`, type: "shape-to-spell",
      prompt: "Bu hece nasıl hecelenir?", stimulus: s3, correct: T(correct), distractors: ds2.map(T),
      explanation: `${ar(s3)} → ${correct}. Cezm harfin üstündeki küçük yuvarlaktır.`, difficulty: mate ? 3 : 2, source: K1("s.12"),
    }));
  }
  return qs;
}

function countMark(word: string, mark: string): number {
  return [...word].filter((c) => c === mark).length;
}
function lettersOfWord(word: string): Letter[] {
  const seen = new Set<string>();
  const out: Letter[] = [];
  for (const c of clusters(word)) {
    const l = letterByChar(c.base);
    if (l && !seen.has(l.id)) {
      seen.add(l.id);
      out.push(l);
    }
  }
  return out;
}
const COUNT_TEXT = (n: number, what: string) => (n === 0 ? `${cap(what)} yok` : `${n} ${what}`);

function whichLetterQ(lessonId: string, objectiveId: string, word: string, i: number, mark: string, markName: string, src: SourceRef): Question | undefined {
  const cl = clusters(word);
  const hits = cl.filter((c) => c.marks.includes(mark));
  if (hits.length !== 1) return undefined;
  const target = letterByChar(hits[0].base);
  if (!target) return undefined;
  const inWord = lettersOfWord(word).filter((l) => l.id !== target.id);
  const ds = takeDistinct(target.display, [disp(inWord), disp(family(target, LETTERS)), disp(others(target, LETTERS))], 3, word + mark);
  return makeQuestion({
    id: `${lessonId}-which-${i}`, lessonId, objectiveId, type: "which-letter-has-mark",
    prompt: `Bu kelimede ${markName} olan harf hangisi?`, stimulus: word, correct: A(target.display), distractors: ds.map(A),
    explanation: `${ar(word)} kelimesinde ${markName} ${target.name} harfinin üstünde.`, difficulty: 2, source: src, reviewStatus: "needs-teacher-review",
  });
}
function countQ(lessonId: string, objectiveId: string, word: string, i: number, mark: string, what: string, src: SourceRef): Question {
  const n = countMark(word, mark);
  const opts = [0, 1, 2, 3].map((k) => COUNT_TEXT(k, what));
  return makeQuestion({
    id: `${lessonId}-count-${i}`, lessonId, objectiveId, type: "mark-count",
    prompt: `Bu kelimede kaç ${what} var?`, stimulus: word, correct: T(COUNT_TEXT(n, what)), distractors: opts.filter((o) => o !== COUNT_TEXT(n, what)).map(T),
    explanation: `${ar(word)} kelimesinde ${COUNT_TEXT(n, what).toLocaleLowerCase("tr")}.`, difficulty: n >= 2 ? 2 : 1, source: src, reviewStatus: "needs-teacher-review",
  });
}

export function genSukunWords(lessonId: string): Question[] {
  const qs: Question[] = [];
  SUKUN_WORDS.forEach((w, i) => {
    const src = K1("s.13");
    if (i % 3 === 0) {
      const sukunAsVowel = canonical(w.replace(SUKUN, FATHA));
      qs.push(wordSpellingQ(lessonId, `${lessonId}-o2`, w, i, src, [spellWord(sukunAsVowel)]));
    } else if (i % 3 === 1) {
      qs.push(whichLetterQ(lessonId, `${lessonId}-o1`, w, i, SUKUN, "cezm", src) ?? countQ(lessonId, `${lessonId}-o3`, w, i, SUKUN, "cezm", src));
    } else {
      qs.push(countQ(lessonId, `${lessonId}-o3`, w, i, SUKUN, "cezm", src));
    }
  });
  return qs;
}

// ───────────────────────── Ünite 5: şedde ─────────────────────────
export function genShaddaSyllables(lessonId: string): Question[] {
  const qs: Question[] = [];
  for (const l of SYLLABLE_LETTERS) {
    const v1 = VOWELS[l.order % 3];
    const v2 = VOWELS[(l.order + 1) % 3];
    const s = canonical(elifV(v1) + l.base + SHADDA + v2);
    const mate = [...family(l, SYLLABLE_LETTERS), ...soundMates(l, SYLLABLE_LETTERS)][0];
    const modeSh = l.order % 3;
    const farSh = stableSort(SYLLABLE_LETTERS.filter((x) => x.id !== l.id && x !== mate), (x) => l.id + x.id + "sh").slice(0, 3).map((x) => canonical(elifV(v1) + x.base + SHADDA + v2));
    const structSh = [canonical(elifV(v1) + l.base + SUKUN), canonical(elifV(v1) + l.base + v2)];
    const tiersSh = modeSh === 0 ? [farSh] : modeSh === 1 ? [structSh.slice(0, 1), farSh] : [structSh, mate ? [canonical(elifV(v1) + mate.base + SHADDA + v2)] : [canonical(elifV(v2) + l.base + SHADDA + v2)]];
    const ds = takeDistinct(s, tiersSh, 3, l.id + "sh");
    qs.push(makeQuestion({
      id: `${lessonId}-s2s-${l.id}`, lessonId, objectiveId: `${lessonId}-o1`, type: "spell-to-shape",
      prompt: `“Elif ${VOWEL_NAME[v1]} · ${l.name} şeddeli ${VOWEL_NAME[v2]}” hangisi?`, correct: A(s), distractors: ds.map(A),
      explanation: `${ar(s)} = ${ar(canonical(elifV(v1) + l.base + SUKUN))} + ${ar(syl(l, v2))}. Şedde harfi iki kez okutur.`, difficulty: (modeSh + 1) as Difficulty, source: K1("s.14"),
    }));
    const w1 = VOWELS[(l.order + 2) % 3];
    const w2 = VOWELS[l.order % 3];
    const s2 = canonical(elifV(w1) + l.base + SHADDA + w2);
    const part1 = canonical(elifV(w1) + l.base + SUKUN);
    const part2 = canonical(l.base + w2);
    const correct = `${part1} + ${part2}`;
    const wrongV = VOWELS.find((x) => x !== w2)!;
    const wrongV1 = VOWELS.find((x) => x !== w1)!;
    const ds2 = takeDistinct(correct, [[`${elifV(w1)} + ${part2}`, `${part1} + ${canonical(l.base + wrongV)}`, `${canonical(elifV(wrongV1) + l.base + SUKUN)} + ${part2}`]], 3, l.id + "split");
    qs.push(makeQuestion({
      id: `${lessonId}-split-${l.id}`, lessonId, objectiveId: `${lessonId}-o2`, type: "shadda-split",
      prompt: "Bu şeddeli hece hangi iki parçadan oluşur?", stimulus: s2, correct: A(correct), distractors: ds2.map(A),
      explanation: `${ar(s2)}: önce cezmli ${ar(part1)}, sonra harekeli ${ar(part2)}.`, difficulty: l.order % 2 === 0 ? 2 : 3, source: K1("s.14"),
    }));
  }
  return qs;
}

/** Kelimedeki ilk şeddeyi iki parçaya böler: عَلَّمَ → عَلْ + لَمَ */
function splitShaddaWord(word: string): { correct: string; wrong: string[] } | undefined {
  const cl = clusters(word);
  const i = cl.findIndex((c) => c.marks.includes(SHADDA));
  if (i <= 0) return undefined;
  const c = cl[i];
  const vowel = c.marks.find((m) => VOWELS.includes(m));
  if (!vowel) return undefined;
  const before = join(cl.slice(0, i));
  const after = join(cl.slice(i + 1));
  const p1 = canonical(before + c.base + SUKUN);
  const p2 = canonical(c.base + vowel + after);
  const otherV = VOWELS.find((x) => x !== vowel)!;
  return {
    correct: `${p1} + ${p2}`,
    wrong: [`${before} + ${canonical(c.base + vowel + after)}`, `${p1} + ${canonical(c.base + otherV + after)}`, `${canonical(before + c.base + vowel)} + ${p2}`],
  };
}

export function genShaddaWords(lessonId: string): Question[] {
  const qs: Question[] = [];
  const src = K1("s.15");
  SHADDA_WORDS.forEach((w, i) => {
    if (countMark(w, SHADDA) > 1) {
      qs.push(countQ(lessonId, `${lessonId}-o1`, w, i, SHADDA, "şedde", src));
    } else if (i % 2 === 0) {
      qs.push(whichLetterQ(lessonId, `${lessonId}-o1`, w, i, SHADDA, "şedde", src)!);
    } else {
      const noShadda = canonical(w.replace(SHADDA, ""));
      qs.push(wordSpellingQ(lessonId, `${lessonId}-o2`, w, i, src, [spellWord(noShadda)]));
    }
  });
  SHADDA_WORDS.slice(0, 10).forEach((w, i) => {
    const sp = splitShaddaWord(w);
    if (!sp) return;
    const ds = takeDistinct(sp.correct, [sp.wrong], 3, w + "split");
    qs.push(makeQuestion({
      id: `${lessonId}-split-${i}`, lessonId, objectiveId: `${lessonId}-o1`, type: "shadda-split",
      prompt: "Bu kelimedeki şeddeli harf nasıl okunur?", stimulus: w, correct: A(sp.correct), distractors: ds.map(A),
      explanation: `${ar(w)} = ${ar(sp.correct)}: şeddeli harf önce cezmli, sonra harekeli okunur.`, difficulty: 3, source: src, reviewStatus: "needs-teacher-review",
    }));
  });
  return qs;
}

// ───────────────────────── Ünite 6: med ─────────────────────────
export function genMaddSyllables(lessonId: string): Question[] {
  const qs: Question[] = [];
  for (const l of SYLLABLE_LETTERS) {
    const v = VOWELS[l.order % 3];
    const mate = [...family(l, SYLLABLE_LETTERS), ...soundMates(l, SYLLABLE_LETTERS)][0];
    const vOther = VOWELS[(l.order + 1) % 3];
    const ds = takeDistinct(longSyl(l, v), [[syl(l, v), longSyl(l, vOther)], mate ? [longSyl(mate, v)] : [syl(l, vOther)], [syl(l, VOWELS[(l.order + 2) % 3])]], 3, l.id + "md");
    qs.push(makeQuestion({
      id: `${lessonId}-s2s-${l.id}`, lessonId, objectiveId: `${lessonId}-o1`, type: "spell-to-shape",
      prompt: `Uzatılarak okunan “${spell1(l, v)}” hangisi?`, correct: A(longSyl(l, v)), distractors: ds.map(A),
      explanation: `${ar(longSyl(l, v))}: ${VOWEL_NAME[v]}den sonra harekesiz ${MADD_LETTER_NAME[v]} gelir, bir elif miktarı uzatılır.`, difficulty: mate ? 3 : 2, source: K1("s.16"),
    }));
    const v2 = VOWELS[(l.order + 1) % 3];
    const correctLetter = v2 === KASRA ? "ى" : MADD_LETTER_OF[v2];
    const maddOpts = ["ا", "و", "ى"].filter((x) => x !== correctLetter);
    qs.push(makeQuestion({
      id: `${lessonId}-letter-${l.id}`, lessonId, objectiveId: `${lessonId}-o2`, type: "madd-letter",
      prompt: "Bu hecede uzatmayı sağlayan harf hangisi?", stimulus: longSyl(l, v2), correct: A(correctLetter), distractors: [...maddOpts, l.display].map(A),
      explanation: `${ar(longSyl(l, v2))}: ${VOWEL_NAME[v2]}den sonra gelen harekesiz ${MADD_LETTER_NAME[v2]} (${ar(correctLetter)}) med harfidir.`, difficulty: 2, source: K1("s.16"),
    }));
    const v3 = VOWELS[(l.order + 2) % 3];
    const ds3 = takeDistinct(longSyl(l, v3), [[syl(l, v3), syl(l, VOWELS[(l.order) % 3])], mate ? [syl(mate, v3)] : [syl(l, VOWELS[(l.order + 1) % 3])]], 3, l.id + "det");
    qs.push(makeQuestion({
      id: `${lessonId}-detect-${l.id}`, lessonId, objectiveId: `${lessonId}-o1`, type: "madd-detect",
      prompt: "Hangisi uzatılarak okunur?", correct: A(longSyl(l, v3)), distractors: ds3.map(A),
      explanation: `${ar(longSyl(l, v3))}: harekesiz ${MADD_LETTER_NAME[v3]} uzatır. Diğerleri kısa okunur.`, difficulty: 1, source: K1("s.16"),
    }));
  }
  return qs;
}

/** Kelimedeki med harflerinin konumları. */
function maddLetters(word: string): string[] {
  const cl = clusters(word);
  const out: string[] = [];
  for (let i = 0; i < cl.length - 1; i++) {
    const c = cl[i];
    const n = cl[i + 1];
    if (n.marks.length > 0) continue;
    if (c.marks.includes(FATHA) && n.base === ALEF) out.push("ا");
    else if (c.marks.includes(DAMMA) && n.base === WAW) out.push("و");
    else if ((c.marks.includes(KASRA) || c.marks.includes(SUB_ALEF)) && (n.base === YEH || n.base === ALEF_MAKSURA)) out.push("ى");
  }
  return out;
}

const NON_MADD_POOL = [...HARAKA_WORDS, ...SUKUN_WORDS, ...SHADDA_WORDS];

export function genMaddWords(lessonId: string): Question[] {
  const qs: Question[] = [];
  const src = K1("s.17");
  MADD_WORDS.forEach((w, i) => {
    const m = maddLetters(w);
    if (i % 3 === 0) {
      const ds = stableSort(NON_MADD_POOL, (x) => w + x).slice(0, 3);
      qs.push(makeQuestion({
        id: `${lessonId}-detect-${i}`, lessonId, objectiveId: `${lessonId}-o1`, type: "madd-detect",
        prompt: "Hangi kelimede uzatma (med) vardır?", correct: A(w), distractors: ds.map(A),
        explanation: `${ar(w)} kelimesinde med harfi var: ${m.map(ar).join(" ")}.`, difficulty: 1, source: src, reviewStatus: "needs-teacher-review",
      }));
    } else if (i % 3 === 1 && new Set(m).size === 1) {
      const target = m[0];
      const inWord = lettersOfWord(w).map((l) => l.display).filter((d) => d !== target && d !== "ى" && d !== "ا" && d !== "و");
      const ds = takeDistinct(target, [["ا", "و", "ى"].filter((x) => x !== target), inWord], 3, w + "ml");
      qs.push(makeQuestion({
        id: `${lessonId}-letter-${i}`, lessonId, objectiveId: `${lessonId}-o2`, type: "madd-letter",
        prompt: "Bu kelimedeki med harfi hangisi?", stimulus: w, correct: A(target), distractors: ds.map(A),
        explanation: `${ar(w)}: harekesiz ${ar(target)} önceki harfi uzatır.`, difficulty: 2, source: src, reviewStatus: "needs-teacher-review",
      }));
    } else {
      const n = m.length;
      const opts = [0, 1, 2, 3].map((k) => COUNT_TEXT(k, "med harfi"));
      qs.push(makeQuestion({
        id: `${lessonId}-count-${i}`, lessonId, objectiveId: `${lessonId}-o2`, type: "mark-count",
        prompt: "Bu kelimede kaç med harfi var?", stimulus: w, correct: T(COUNT_TEXT(n, "med harfi")), distractors: opts.filter((o) => o !== COUNT_TEXT(n, "med harfi")).map(T),
        explanation: `${ar(w)}: ${m.map(ar).join(" ")} → ${COUNT_TEXT(n, "med harfi").toLocaleLowerCase("tr")}.`, difficulty: n >= 2 ? 3 : 2, source: src, reviewStatus: "needs-teacher-review",
      }));
    }
  });
  return qs;
}

// ───────────────────────── Ünite 7: âsar ve ٓ ─────────────────────────
export function genAsar(lessonId: string): Question[] {
  const qs: Question[] = [];
  const src = K1("s.18");
  ASAR_WORDS.forEach((w, i) => {
    const ds = stableSort(MADD_WORDS, (x) => w + x).slice(0, 3);
    qs.push(makeQuestion({
      id: `${lessonId}-has-${i}`, lessonId, objectiveId: `${lessonId}-o1`, type: "rule-compare",
      prompt: `Hangi kelimede dikey üstün (âsar ${ar(TATWEEL + SUP_ALEF)}) var?`, correct: A(w), distractors: ds.map(A),
      explanation: `${ar(w)} kelimesinde dikey üstün var; o harf uzatılarak okunur.`, difficulty: 1, source: src, reviewStatus: "needs-teacher-review",
    }));
    const q = whichLetterQ(lessonId, `${lessonId}-o2`, w, i, SUP_ALEF, "dikey üstün", src);
    if (q) qs.push({ ...q, difficulty: 3, explanation: q.explanation + " Bu harf bir elif miktarı uzatılır." });
  });
  MADDAH_WORDS.forEach((w, i) => {
    const ds = stableSort(MADD_WORDS, (x) => w + x).slice(0, 3);
    qs.push(makeQuestion({
      id: `${lessonId}-maddah-${i}`, lessonId, objectiveId: `${lessonId}-o3`, type: "rule-compare",
      prompt: `Hangi kelimede dört elif uzatma işareti (${ar(TATWEEL + MADDAH)}) var?`, correct: A(w), distractors: ds.map(A),
      explanation: `${ar(w)}: med harfinin üstündeki dalgalı işaret dört elif miktarı uzatmayı gösterir.`, difficulty: 2, source: src, reviewStatus: "needs-teacher-review",
    }));
  });
  MADDAH_WORDS.slice(0, 4).forEach((w, i) => {
    qs.push(makeQuestion({
      id: `${lessonId}-amount-${i}`, lessonId, objectiveId: `${lessonId}-o3`, type: "mark-meaning",
      prompt: "Bu kelimede dalgalı uzatma işaretinin olduğu yer ne kadar uzatılır?", stimulus: w,
      correct: T("Dört elif miktarı"), distractors: [T("Bir elif miktarı"), T("Hiç uzatılmaz"), T("İki elif miktarı")],
      explanation: "K1 s.18'e göre bu işaretin olduğu yerlerde dört elif miktarı uzatılır.", difficulty: 2, source: src,
    }));
  });
  return qs;
}

// ───────────────────────── Ünite 8: tenvin ─────────────────────────
const tanName = (t: string) => cap(TANWEEN_NAME[t]);

export function genTanweenSyllables(lessonId: string): Question[] {
  const qs: Question[] = [];
  for (const l of SYLLABLE_LETTERS) {
    const t = TANWEENS[l.order % 3];
    const v = vowelOfTanween[t];
    const nextT = TANWEENS[(l.order + 1) % 3];
    const modeT = l.order % 3;
    const farT = stableSort(SYLLABLE_LETTERS.filter((x) => x.id !== l.id), (x) => l.id + x.id + "tn").slice(0, 3).map((x) => tanSyl(x, t));
    const ds = takeDistinct(tanSyl(l, t), modeT === 0 ? [farT] : modeT === 1 ? [[syl(l, v)], farT] : [[longSyl(l, v), syl(l, v), tanSyl(l, nextT)]], 3, l.id + "tn");
    qs.push(makeQuestion({
      id: `${lessonId}-s2s-${l.id}`, lessonId, objectiveId: `${lessonId}-o1`, type: "spell-to-shape",
      prompt: `“${l.name} ${TANWEEN_NAME[t]}” hangisi?`, correct: A(tanSyl(l, t)), distractors: ds.map(A),
      explanation: `${ar(tanSyl(l, t))}: ${TANWEEN_NAME[t]}, harekeye "n" sesi ekler.${t === FATHATAN ? ` Yanındaki elif uzatılmaz; ${ar(longSyl(l, FATHA))} ile karıştırmayın.` : ""}`,
      difficulty: (modeT + 1) as Difficulty, source: K1("s.19"),
    }));
    const t2 = TANWEENS[(l.order + 1) % 3];
    const v2 = vowelOfTanween[t2];
    qs.push(makeQuestion({
      id: `${lessonId}-id-${l.id}`, lessonId, objectiveId: `${lessonId}-o2`, type: "identify-hareke",
      prompt: "Bu hecedeki işaret hangisi?", stimulus: tanSyl(l, t2),
      correct: T(tanName(t2)), distractors: [...TANWEENS.filter((x) => x !== t2).map((x) => T(tanName(x))), T(`Tek ${VOWEL_NAME[v2]}`)],
      explanation: `${ar(tanSyl(l, t2))}: ${TANWEEN_NAME[t2]} (tenvin). Tek ${VOWEL_NAME[v2]} ${ar(syl(l, v2))} biçimindedir.`, difficulty: 2, source: K1("s.19"),
    }));
  }
  return qs;
}

function lastCluster(word: string) {
  const cl = clusters(word);
  return { cl, i: cl.length - 1, last: cl[cl.length - 1] };
}
/** Tenvinli kelimenin sonundaki tenvin (iki üstünde son küme elif olur). */
function tanweenOf(word: string): { t: string; idx: number } | undefined {
  const cl = clusters(word);
  for (let i = cl.length - 1; i >= 0; i--) {
    const t = cl[i].marks.find((m) => TANWEENS.includes(m));
    if (t) return { t, idx: i };
  }
  return undefined;
}

export function genTanweenWords(lessonId: string): Question[] {
  const qs: Question[] = [];
  const src = K1("s.20–21");
  TANWEEN_WORDS.forEach((w, i) => {
    const tw = tanweenOf(w)!;
    if (i % 2 === 0) {
      qs.push(makeQuestion({
        id: `${lessonId}-id-${i}`, lessonId, objectiveId: `${lessonId}-o1`, type: "identify-hareke",
        prompt: "Bu kelimenin sonundaki tenvin hangisi?", stimulus: w, correct: T(tanName(tw.t)),
        distractors: [...TANWEENS.filter((x) => x !== tw.t).map((x) => T(tanName(x))), T("Tenvin yok")],
        explanation: `${ar(w)}: ${TANWEEN_NAME[tw.t]}.`, difficulty: 1, source: src, reviewStatus: "needs-teacher-review",
      }));
    } else {
      const cl = clusters(w).map((c) => ({ ...c, marks: [...c.marks] }));
      const v = vowelOfTanween[tw.t];
      const single = cl.map((c, k) => (k === tw.idx ? { ...c, marks: c.marks.map((m) => (m === tw.t ? v : m)) } : c));
      const singleNoAlif = tw.t === FATHATAN ? single.slice(0, tw.idx + 1) : single;
      const sukun = cl.map((c, k) => (k === tw.idx ? { ...c, marks: c.marks.map((m) => (m === tw.t ? SUKUN : m)) } : c)).slice(0, tw.idx + 1);
      const madd = [...single.slice(0, tw.idx + 1), { base: MADD_LETTER_OF[v], marks: [] }];
      const variants = [join(singleNoAlif), join(madd), join(sukun)];
      const ds = takeDistinct(w, [variants], 3, w + "tw");
      qs.push(makeQuestion({
        id: `${lessonId}-which-${i}`, lessonId, objectiveId: `${lessonId}-o2`, type: "rule-compare",
        prompt: "Hangisi tenvinli yazılmış?", correct: A(w), distractors: ds.map(A),
        explanation: `${ar(w)}: son harfte ${TANWEEN_NAME[tw.t]} var. Tek hareke, cezm veya med harfi tenvin değildir.`, difficulty: tw.t === FATHATAN ? 3 : 2, source: src, reviewStatus: "needs-teacher-review",
      }));
    }
  });
  qs.push(makeQuestion({
    id: `${lessonId}-alif`, lessonId, objectiveId: `${lessonId}-o1`, type: "mark-meaning",
    prompt: "İki üstünün yanındaki elif uzatılır mı?", stimulus: "نُورًا",
    correct: T("Hayır, uzatılmaz"), distractors: [T("Evet, bir elif uzatılır"), T("Evet, dört elif uzatılır")],
    explanation: `${ar("نُورًا")}: iki üstünün yanındaki elif yazılır ama uzatılmaz.`, difficulty: 3, source: K1("s.19"),
  }));
  qs.push(makeQuestion({
    id: `${lessonId}-sound`, lessonId, objectiveId: `${lessonId}-o1`, type: "mark-meaning",
    prompt: "Tenvin harekeye hangi sesi ekler?", correct: T("“n” sesi"), distractors: [T("“m” sesi"), T("Uzatma"), T("Hiçbir ses")],
    explanation: "Tenvin, bulunduğu harfin harekesine \"n\" sesi verir (K1 s.19).", difficulty: 1, source: K1("s.19"),
  }));
  return qs;
}

// ───────────────────────── Ünite 9–10: kural yargıları ─────────────────────────
interface RuleSpec<R extends string> {
  lessonId: string;
  items: { text: string; reason: R }[];
  labels: Record<R, string>;
  prompt: string;
  explain: (text: string, reason: R) => string;
  difficulty: Record<R, Difficulty>;
  compare: { prompt: string; target: R }[];
  src: SourceRef;
}

function genRule<R extends string>(spec: RuleSpec<R>): Question[] {
  const qs: Question[] = [];
  const reasons = Object.keys(spec.labels) as R[];
  spec.items.forEach((it, i) => {
    qs.push(makeQuestion({
      id: `${spec.lessonId}-rule-${i}`, lessonId: spec.lessonId, objectiveId: `${spec.lessonId}-o1`, type: "rule-judgement",
      prompt: spec.prompt, stimulus: it.text, correct: T(spec.labels[it.reason]),
      distractors: reasons.filter((r) => r !== it.reason).map((r) => T(spec.labels[r])),
      explanation: spec.explain(it.text, it.reason), difficulty: spec.difficulty[it.reason], source: spec.src, reviewStatus: "needs-teacher-review",
    }));
  });
  const usedTargets = new Set<string>();
  spec.compare.forEach((c, k) => {
    const pos = stableSort(spec.items.filter((x) => x.reason === c.target && !usedTargets.has(x.text)), (x) => "c" + k + x.text);
    const neg = stableSort(spec.items.filter((x) => x.reason !== c.target), (x) => "n" + k + x.text);
    const target = pos[0];
    usedTargets.add(target.text);
    const ds = neg.slice(0, 3).map((x) => x.text);
    qs.push(makeQuestion({
      id: `${spec.lessonId}-cmp-${k}`, lessonId: spec.lessonId, objectiveId: `${spec.lessonId}-o1`, type: "rule-compare",
      prompt: c.prompt, correct: A(target.text), distractors: ds.map(A),
      explanation: spec.explain(target.text, target.reason), difficulty: 3, source: spec.src, reviewStatus: "needs-teacher-review",
    }));
  });
  return qs;
}

export function genZamir(lessonId: string): Question[] {
  return genRule({
    lessonId, items: ZAMIR_WORDS.map((x) => ({ text: x.word, reason: x.reason })),
    labels: { long: "Uzatılır — önceki harf harekeli", "short-sukun": "Uzatılmaz — önceki harf cezmli", "short-madd": "Uzatılmaz — önceki harf med harfi" },
    prompt: "Bu kelimenin sonundaki zamir nasıl okunur?",
    explain: (t, r) =>
      r === "long" ? `${ar(t)}: zamirden önceki harf harekeli, zamir uzatılır.` : r === "short-sukun" ? `${ar(t)}: zamirden önceki harf cezmli, zamir uzatılmaz.` : `${ar(t)}: zamirden önceki harf med harfi, zamir uzatılmaz.`,
    difficulty: { long: 1, "short-sukun": 2, "short-madd": 3 },
    compare: [
      { prompt: "Hangi kelimede zamir uzatılır?", target: "long" as ZamirR },
      { prompt: "Hangi kelimede zamir uzatılır?", target: "long" as ZamirR },
      { prompt: "Hangi kelimede zamir uzatılmaz?", target: "short-sukun" as ZamirR },
      { prompt: "Hangi kelimede zamir uzatılmaz?", target: "short-madd" as ZamirR },
    ],
    src: K1("s.22"),
  });
}
type ZamirR = "long" | "short-sukun" | "short-madd";

export function genLafza(lessonId: string): Question[] {
  return genRule({
    lessonId, items: LAFZA_PHRASES.map((x) => ({ text: x.phrase, reason: x.reason })),
    labels: { "thick-fatha": "Kalın — önceki hareke üstün", "thick-damma": "Kalın — önceki hareke ötre", "thin-kasra": "İnce — önceki hareke esre" },
    prompt: "Bu ifadede Allah lafzı nasıl okunur?",
    explain: (t, r) => `${ar(t)}: lafzatullahtan önceki hareke ${r === "thick-fatha" ? "üstün, kalın" : r === "thick-damma" ? "ötre, kalın" : "esre, ince"} okunur.`,
    difficulty: { "thick-fatha": 1, "thick-damma": 2, "thin-kasra": 2 },
    compare: [
      { prompt: "Hangisinde Allah lafzı ince okunur?", target: "thin-kasra" },
      { prompt: "Hangisinde Allah lafzı ince okunur?", target: "thin-kasra" },
      { prompt: "Hangisinde Allah lafzı kalın okunur?", target: "thick-damma" },
      { prompt: "Hangisinde Allah lafzı kalın okunur?", target: "thick-fatha" },
    ],
    src: K1("s.22"),
  });
}

export function genElifLam(lessonId: string): Question[] {
  return genRule({
    lessonId, items: ELIF_LAM_WORDS.map((x) => ({ text: x.word, reason: x.reason })),
    labels: { read: "Lâm okunur — lâmda cezm var", silent: "Lâm okunmaz — sonraki harf şeddeli" },
    prompt: "Bu kelimenin başındaki elif lâm takısında lâm okunur mu?",
    explain: (t, r) => (r === "read" ? `${ar(t)}: lâmda cezm var, lâm okunur.` : `${ar(t)}: lâmda cezm yok, sonraki harf şeddeli; lâm okunmaz.`),
    difficulty: { read: 1, silent: 2 },
    compare: [
      { prompt: "Hangi kelimede lâm okunmaz?", target: "silent" },
      { prompt: "Hangi kelimede lâm okunmaz?", target: "silent" },
      { prompt: "Hangi kelimede lâm okunur?", target: "read" },
      { prompt: "Hangi kelimede lâm okunur?", target: "read" },
    ],
    src: K1("s.23"),
  });
}

export function genRa(lessonId: string): Question[] {
  return genRule({
    lessonId, items: RA_WORDS.map((x) => ({ text: x.word, reason: x.reason })),
    labels: { "thick-fatha": "Kalın — râ üstünlü", "thick-damma": "Kalın — râ ötreli", "thin-kasra": "İnce — râ esreli" },
    prompt: "Bu kelimedeki râ harfi nasıl okunur?",
    explain: (t, r) => `${ar(t)}: râ harfi ${r === "thick-fatha" ? "üstünlü, kalın" : r === "thick-damma" ? "ötreli, kalın" : "esreli, ince"} okunur.`,
    difficulty: { "thick-fatha": 1, "thick-damma": 2, "thin-kasra": 2 },
    compare: [
      { prompt: "Hangi kelimede râ ince okunur?", target: "thin-kasra" },
      { prompt: "Hangi kelimede râ ince okunur?", target: "thin-kasra" },
      { prompt: "Hangi kelimede râ kalın okunur?", target: "thick-damma" },
      { prompt: "Hangi kelimede râ kalın okunur?", target: "thick-fatha" },
    ],
    src: K1("s.23"),
  });
}

// ───────────────────────── Ünite 11: vakf ve geçiş ─────────────────────────
export function genVakf(lessonId: string): Question[] {
  const qs: Question[] = [];
  VAKF_WORDS.forEach((w, i) => {
    const { cl, i: li, last } = lastCluster(w);
    const tan = last.marks.find((m) => TANWEENS.includes(m));
    const vowel = tan ? vowelOfTanween[tan] : last.marks.find((m) => VOWELS.includes(m))!;
    const head = join(cl.slice(0, li));
    const stop = canonical(head + last.base + SUKUN);
    const lengthened = canonical(head + last.base + vowel + MADD_LETTER_OF[vowel]);
    const variants = [w, lengthened];
    if (tan) variants.push(canonical(head + last.base + vowel + "ن" + SUKUN));
    else variants.push(canonical(head + last.base + VOWELS[(VOWELS.indexOf(vowel) + 1) % 3]));
    const ds = takeDistinct(stop, [variants], 3, w + "vk");
    qs.push(makeQuestion({
      id: `${lessonId}-vakf-${i}`, lessonId, objectiveId: `${lessonId}-o1`, type: "rule-judgement",
      prompt: "Bu kelimenin sonunda durursak nasıl okunur?", stimulus: w, correct: A(stop), distractors: ds.map(A),
      explanation: `Durulan kelimenin son harekesi ${tan ? TANWEEN_NAME[tan] : VOWEL_NAME[vowel]} ise cezme döner: ${ar(stop)}.`,
      difficulty: tan ? 2 : 1, source: K2("Ders 15 Vakfetme Kuralları"), reviewStatus: "needs-teacher-review",
    }));
  });
  TRANSITION_PAIRS.forEach(([a, b], i) => {
    const tw = tanweenOf(a)!;
    const v = vowelOfTanween[tw.t];
    const cl = clusters(a).slice(0, tw.idx + 1).map((c, k) => (k === tw.idx ? { ...c, marks: c.marks.map((m) => (m === tw.t ? v : m)) } : c));
    const head = join(cl);
    const nun = (x: string) => canonical("ن" + x);
    const correct = `${head}${nun(KASRA)} ${b}`;
    const stimulus = `${a} ${b}`;
    if (i < 3) {
      qs.push(makeQuestion({
        id: `${lessonId}-gecis-ses-${i}`, lessonId, objectiveId: `${lessonId}-o2`, type: "transition",
        prompt: "Bu iki kelime birleştirilerek okunurken araya hangi hece eklenir?", stimulus,
        correct: A(nun(KASRA)), distractors: [A(nun(FATHA)), A(nun(DAMMA)), A(nun(SUKUN))],
        explanation: `Tenvin kendi harekesine döner ve esreli nun eklenir: ${ar(correct)}.`, difficulty: 2, source: K2("Ders 29"), reviewStatus: "needs-teacher-review",
      }));
    } else {
      const wrongV = VOWELS.find((x) => x !== v)!;
      const wrongHead = join(cl.map((c, k) => (k === tw.idx ? { ...c, marks: c.marks.map((m) => (m === v ? wrongV : m)) } : c)));
      const ds = [`${head}${nun(FATHA === v ? DAMMA : FATHA)} ${b}`, `${wrongHead}${nun(KASRA)} ${b}`, stimulus];
      qs.push(makeQuestion({
        id: `${lessonId}-gecis-${i}`, lessonId, objectiveId: `${lessonId}-o2`, type: "transition",
        prompt: "Bu iki kelime birleştirilerek nasıl okunur?", stimulus, correct: A(correct), distractors: ds.map(A),
        explanation: `${ar(a)} kelimesindeki ${TANWEEN_NAME[tw.t]}, ${VOWEL_NAME[v]}ye döner ve araya ${ar(nun(KASRA))} girer: ${ar(correct)}.`,
        difficulty: 3, source: K2("Ders 29"), reviewStatus: "needs-teacher-review",
      }));
    }
  });
  return qs;
}
