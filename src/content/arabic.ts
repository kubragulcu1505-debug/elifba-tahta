// Arapça yazım yardımcıları: işaret sabitleri, özellik tespiti ve karakter denetimi.
import type { Feature } from "./types.ts";

export const FATHA = "َ";
export const DAMMA = "ُ";
export const KASRA = "ِ";
export const SUKUN = "ْ";
export const SHADDA = "ّ";
export const FATHATAN = "ً";
export const DAMMATAN = "ٌ";
export const KASRATAN = "ٍ";
/** Âsar / dikey üstün */
export const SUP_ALEF = "ٰ";
/** Dikey kesra (Türk mushaf yazımındaki ۪ için, bkz. docs/ARASTIRMA.md §4) */
export const SUB_ALEF = "ٖ";
/** Dört elif uzatma işareti */
export const MADDAH = "ٓ";
export const TATWEEL = "ـ";

export const ALEF = "ا";
export const WAW = "و";
export const YEH = "ي"; // noktalı yâ (baş/orta)
export const ALEF_MAKSURA = "ى"; // noktasız yâ (ayrı/son)
export const HEH = "ه";
export const LAM = "ل";

export const VOWELS = [FATHA, KASRA, DAMMA] as const;
export type Vowel = (typeof VOWELS)[number];

export const MARKS = new Set([
  FATHA,
  DAMMA,
  KASRA,
  SUKUN,
  SHADDA,
  FATHATAN,
  DAMMATAN,
  KASRATAN,
  SUP_ALEF,
  SUB_ALEF,
  MADDAH,
]);

const HAMZA_CHARS = new Set(["ء", "أ", "إ", "ؤ", "ئ"]);
/** Med işaretli elif (ا + ٓ, NFC ile birleşir). */
export const ALEF_MADDA = "آ";

/** İçerikte izin verilen temel harfler (28 harf + noktalı yâ + hemze biçimleri). */
export const BASE_LETTERS = new Set(
  "ابتثجحخدذرزسشصضطظعغفقكلمنهوىي".split("").concat([...HAMZA_CHARS, "آ"]),
);

/** İçerikte kesinlikle kullanılmaması gereken karakterler. */
export const FORBIDDEN = new Map<string, string>([
  ["۪", "U+06EA fontlarda halka olarak çiziliyor; dikey kesra için U+0656 kullanın"],
  ["۫", "U+06EB mushafa özgü med işareti açık fontlarda doğru çizilmiyor"],
  ["۬", "U+06EC mushafa özgü kasr işareti açık fontlarda doğru çizilmiyor"],
  ["ة", "ة (yuvarlak te) öğretilmiyor"],
  ["ٱ", "ٱ (vasla işareti) Türk elifbasında kullanılmıyor"],
  ["ی", "Farsça yâ"],
  ["ک", "Farsça kef"],
  ["‌", "ZWNJ birleşimi bozar"],
  ["‍", "ZWJ"],
]);

export function isMark(ch: string): boolean {
  return MARKS.has(ch);
}

/** Bir dizgeyi [harf, işaretler[]] kümelerine ayırır. Boşluk ve tatvil de küme olur. */
export interface Cluster {
  base: string;
  marks: string[];
}

export function clusters(s: string): Cluster[] {
  const out: Cluster[] = [];
  for (const ch of s) {
    if (isMark(ch) && out.length > 0) {
      out[out.length - 1].marks.push(ch);
    } else {
      out.push({ base: ch, marks: [] });
    }
  }
  return out;
}

/** İşaretsiz iskelet. */
export function skeleton(s: string): string {
  return [...s].filter((c) => !isMark(c) && c !== TATWEEL).join("");
}

export function tokens(s: string): string[] {
  return s.split(/\s+/).filter(Boolean);
}

function isLafzatullahToken(tok: string): boolean {
  const sk = skeleton(tok);
  return /^(ا|وا|فا|با)?لله$/.test(sk) || /^(ل|ول|فل)له$/.test(sk) || sk === "اللهم";
}

/**
 * Elif lâm takısı: (و/ف/ب ön eki olabilir) harekesiz ya da üstünlü elif + cezmli ya da işaretsiz lâm.
 * اِلٰهَ, اِلَيْهِ, اَلَمْ gibi kelimeler takı değildir.
 */
function isElifLamToken(tok: string): boolean {
  const cl = clusters(tok);
  let i = 0;
  if (cl.length > 0 && ["و", "ف", "ب"].includes(cl[0].base) && cl[1]?.base === ALEF) i = 1;
  const a = cl[i];
  const l = cl[i + 1];
  if (!a || !l || a.base !== ALEF || l.base !== LAM || cl.length < i + 3) return false;
  if (!a.marks.every((m) => m === FATHA)) return false;
  return l.marks.length === 0 || (l.marks.length === 1 && l.marks[0] === SUKUN);
}

/** Yazım özelliklerini tespit eder (öğretilmemiş kural denetimi için). */
export function detectFeatures(s: string): Set<Feature> {
  const f = new Set<Feature>();
  const cl = clusters(s);
  for (const ch of s) {
    if (ch === FATHA) f.add("fatha");
    else if (ch === KASRA) f.add("kasra");
    else if (ch === DAMMA) f.add("damma");
    else if (ch === SUKUN) f.add("sukun");
    else if (ch === SHADDA) f.add("shadda");
    else if (ch === FATHATAN || ch === DAMMATAN || ch === KASRATAN) f.add("tanween");
    else if (ch === SUP_ALEF) f.add("asar");
    else if (ch === SUB_ALEF) {
      f.add("dikeyKesra");
      f.add("madd");
    } else if (ch === MADDAH || ch === ALEF_MADDA) f.add("maddah");
    else if (ch === TATWEEL) f.add("tatweel");
    else if (HAMZA_CHARS.has(ch)) f.add("hamza");
  }
  for (let i = 0; i < cl.length; i++) {
    const c = cl[i];
    if (BASE_LETTERS.has(c.base)) f.add("letters");
    const next = cl[i + 1];
    if (c.base === LAM && next && next.base === ALEF) f.add("lamAlif");
    if (next && next.marks.length === 0) {
      const v = c.marks;
      if (v.includes(FATHA) && next.base === ALEF) f.add("madd");
      if (v.includes(DAMMA) && next.base === WAW) f.add("madd");
      if ((v.includes(KASRA) || v.includes(SUB_ALEF)) && (next.base === YEH || next.base === ALEF_MAKSURA))
        f.add("madd");
    }
  }
  for (const tok of tokens(s)) {
    const sk = skeleton(tok);
    if (isLafzatullahToken(tok)) {
      f.add("lafzatullah");
      continue;
    }
    if (isElifLamToken(tok)) f.add("elifLam");
    const first = clusters(tok)[0];
    const tokHasMarks = [...tok].some(isMark);
    if (
      tokHasMarks &&
      first &&
      first.base === ALEF &&
      first.marks.length === 0 &&
      sk.length > 1 &&
      !/^(ال)/.test(sk)
    )
      f.add("wasla");
    // Kelime sonundaki zamir (هُ / هِ / هٖ)
    const tc = clusters(tok);
    const last = tc[tc.length - 1];
    if (
      tc.length >= 3 &&
      last.base === HEH &&
      (last.marks.includes(DAMMA) || last.marks.includes(KASRA) || last.marks.includes(SUB_ALEF))
    )
      f.add("zamir");
  }
  return f;
}

export interface CharIssue {
  char: string;
  code: string;
  reason: string;
}

/** Arapça dizgede yasak ya da beklenmeyen karakterleri bulur. */
export function checkArabicChars(s: string): CharIssue[] {
  const issues: CharIssue[] = [];
  for (const ch of s) {
    const code = "U+" + ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0");
    if (FORBIDDEN.has(ch)) {
      issues.push({ char: ch, code, reason: FORBIDDEN.get(ch)! });
    } else if (!(BASE_LETTERS.has(ch) || MARKS.has(ch) || ch === TATWEEL || ch === " " || ch === "+")) {
      issues.push({ char: ch, code, reason: "beklenmeyen karakter" });
    }
  }
  if (s !== s.normalize("NFC")) {
    // NFC farkı yalnızca işaret sırasından kaynaklanıyorsa sorun değildir; yine de raporlanır.
    issues.push({ char: "", code: "NFC", reason: "dizge NFC biçiminde değil" });
  }
  return issues;
}

/** Aynı küme içindeki işaret sırasını standartlaştırır (görsel eşitlik karşılaştırması için). */
export function canonical(s: string): string {
  return s.normalize("NFC");
}

/** Bir harfin ardına hareke koyar. */
export function withMark(letter: string, ...marks: string[]): string {
  return (letter + marks.join("")).normalize("NFC");
}
