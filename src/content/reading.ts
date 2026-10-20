// Arapça hece/kelimenin Türkçe harflerle yaklaşık okunuşu (öğretmen kararı, 2026-10).
// Geleneksel Türkçe elifba hecelemesine göre: "Be üstün be, Ha üstün ha, Sad üstün sa…".
// UYARI: Türkçe harfler Arapça sesleri tam karşılamaz (ör. ث ve س ikisi de "s"); doğru ses öğretmenden dinlenmelidir.
// Bu tablo öğretmen/uzman incelemesi bekler ve gerekirse buradan düzeltilebilir.
import { FATHA, KASRA, DAMMA, SUKUN, SHADDA, SUB_ALEF, TATWEEL, clusters } from "./arabic.ts";

/** Harfin Türkçe ünsüzü. Elif ve ayn harekeyle yalnızca ünlü verir; ayn cezmde ‘ olarak yazılır. */
const CONSONANT: Record<string, string> = {
  "ا": "", "ب": "b", "ت": "t", "ث": "s", "ج": "c", "ح": "h", "خ": "h", "د": "d", "ذ": "z", "ر": "r",
  "ز": "z", "س": "s", "ش": "ş", "ص": "s", "ض": "d", "ط": "t", "ظ": "z", "ع": "", "غ": "ğ", "ف": "f",
  "ق": "k", "ك": "k", "ل": "l", "م": "m", "ن": "n", "و": "v", "ه": "h", "ي": "y", "ى": "y",
};

/**
 * Ünlü sınıfı: kalın harfler (خ ص ض ط ظ غ ق) a/ı/u; ح ع ر a/i/u; diğerleri e/i/ü.
 * Örn. Sad üstün "sa", Sad esre "sı"; Ha üstün "ha", Ha esre "hi"; Be üstün "be", Be ötre "bü".
 */
const THICK = new Set(["خ", "ص", "ض", "ط", "ظ", "غ", "ق"]);
const SEMI = new Set(["ح", "ع", "ر"]);

function vowel(base: string, mark: string): string {
  const thick = THICK.has(base);
  const semi = SEMI.has(base);
  if (mark === FATHA) return thick || semi ? "a" : "e";
  if (mark === KASRA || mark === SUB_ALEF) return thick ? "ı" : "i";
  if (mark === DAMMA) return thick || semi ? "u" : "ü";
  return "";
}

/** Bir harfin tek başına okunuşu (ör. هَـ → "he"). */
export function readCluster(base: string, marks: string[]): string {
  const cons = base === "ع" ? "‘" : CONSONANT[base];
  if (cons === undefined) throw new Error(`Okunuşu tanımlı olmayan harf: ${base}`);
  const v = marks.map((m) => vowel(base, m)).find((x) => x) ?? "";
  const shadda = marks.includes(SHADDA);
  const sukun = marks.includes(SUKUN);
  // Elif ve ayn harekeyle yalnızca ünlü verir.
  const head = base === "ا" || (base === "ع" && v) ? "" : cons;
  if (base === "ع" && shadda) return "‘" + v;
  if (shadda) return head + head + v;
  if (sukun || !v) return head;
  return head + v;
}

/** Hece ya da kelimenin Türkçe okunuşu: فَتَحَ → "feteha", اِنَّ → "inne", قُلْ → "kul". */
export function readArabic(text: string): string {
  const cl = clusters(text).filter((c) => c.base !== TATWEEL);
  return cl
    .map((c, i) => {
      if (c.base === " ") return " ";
      // Harekeli elif, kendinden sonraki harf kalınsa kalın okunur: اُقْ → "uk", اَصْ → "as".
      const next = cl[i + 1]?.base;
      if (c.base === "ا" && next && THICK.has(next)) return readCluster("ق", c.marks).slice(1);
      return readCluster(c.base, c.marks);
    })
    .join("");
}
