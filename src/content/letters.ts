// 28 harf. Sıra: K1 s.6 ve s.8 (… ن و هـ ى). Lâmelif ayrı harf değildir (K1 s.6 notu).
import { TATWEEL, YEH, ALEF_MAKSURA } from "./arabic.ts";

export type Joining = "dual" | "right";
export type DotPos = "none" | "above" | "below" | "inside";

export interface Letter {
  id: string;
  /** Elifba sırası (1–28). */
  order: number;
  /** Harf tablosunda gösterilen biçim (K1 s.6). */
  display: string;
  /** Harekeli hece kurarken kullanılan temel karakter. */
  base: string;
  /** Türkçe adı (sınıfta yaygın kullanılan adlandırma, bkz. docs/ARASTIRMA.md). */
  name: string;
  joining: Joining;
  dots: { count: 0 | 1 | 2 | 3; pos: DotPos };
  /** Şekil ailesi (noktalarla ayrılan harfler). */
  family?: string;
  /** Türkçede ad/ses karışıklığı grubu. */
  soundGroup?: string;
  /** Kalın (isti'lâ) harf mi? Açıklamalarda kullanılır. */
  group: 1 | 2 | 3 | 4;
}

const L = (
  order: number,
  id: string,
  display: string,
  name: string,
  joining: Joining,
  count: 0 | 1 | 2 | 3,
  pos: DotPos,
  family: string | undefined,
  soundGroup: string | undefined,
  base?: string,
): Letter => ({
  id,
  order,
  display,
  base: base ?? display,
  name,
  joining,
  dots: { count, pos },
  family,
  soundGroup,
  group: (order <= 7 ? 1 : order <= 14 ? 2 : order <= 21 ? 3 : 4) as 1 | 2 | 3 | 4,
});

export const LETTERS: Letter[] = [
  L(1, "elif", "ا", "Elif", "right", 0, "none", undefined, undefined),
  L(2, "be", "ب", "Be", "dual", 1, "below", "beh", undefined),
  L(3, "te", "ت", "Te", "dual", 2, "above", "beh", "t"),
  L(4, "se", "ث", "Se", "dual", 3, "above", "beh", "s"),
  L(5, "cim", "ج", "Cim", "dual", 1, "inside", "jim", undefined),
  L(6, "ha", "ح", "Ha", "dual", 0, "none", "jim", "h"),
  L(7, "hi", "خ", "Hı", "dual", 1, "above", "jim", "h"),
  L(8, "dal", "د", "Dal", "right", 0, "none", "dal", "d"),
  L(9, "zel", "ذ", "Zel", "right", 1, "above", "dal", "z"),
  L(10, "ra", "ر", "Ra", "right", 0, "none", "ra", undefined),
  L(11, "ze", "ز", "Ze", "right", 1, "above", "ra", "z"),
  L(12, "sin", "س", "Sin", "dual", 0, "none", "sin", "s"),
  L(13, "sin2", "ش", "Şın", "dual", 3, "above", "sin", undefined),
  L(14, "sad", "ص", "Sad", "dual", 0, "none", "sad", "s"),
  L(15, "dad", "ض", "Dad", "dual", 1, "above", "sad", "d"),
  L(16, "ti", "ط", "Tı", "dual", 0, "none", "ta", "t"),
  L(17, "zi", "ظ", "Zı", "dual", 1, "above", "ta", "z"),
  L(18, "ayn", "ع", "Ayn", "dual", 0, "none", "ayn", "ayn"),
  L(19, "gayn", "غ", "Ğayn", "dual", 1, "above", "ayn", "ayn"),
  L(20, "fe", "ف", "Fe", "dual", 1, "above", "fa", undefined),
  L(21, "kaf", "ق", "Kaf", "dual", 2, "above", "fa", "k"),
  L(22, "kef", "ك", "Kef", "dual", 0, "none", undefined, "k"),
  L(23, "lam", "ل", "Lam", "dual", 0, "none", undefined, undefined),
  L(24, "mim", "م", "Mim", "dual", 0, "none", undefined, undefined),
  L(25, "nun", "ن", "Nun", "dual", 1, "above", "beh", undefined),
  L(26, "vav", "و", "Vav", "right", 0, "none", undefined, undefined),
  // K1 s.6 harf tablosunda He harfi "هـ" biçiminde gösterilir.
  L(27, "he", "هـ", "He", "dual", 0, "none", undefined, "h", "ه"),
  // K1 s.6: ayrı yazılışta noktasız ى; başta/ortada noktalı يـ (s.8).
  L(28, "ye", "ى", "Ye", "dual", 2, "below", undefined, undefined, YEH),
];

export const LETTER_BY_ID = new Map(LETTERS.map((l) => [l.id, l]));

export function letter(id: string): Letter {
  const l = LETTER_BY_ID.get(id);
  if (!l) throw new Error(`Bilinmeyen harf: ${id}`);
  return l;
}

/** Bir harfi temel karakterinden bulur (ي ve ى ikisi de Ye'dir). */
export function letterByChar(ch: string): Letter | undefined {
  if (ch === YEH || ch === ALEF_MAKSURA) return LETTER_BY_ID.get("ye");
  return LETTERS.find((l) => l.base === ch || l.display === ch);
}

export const GROUPS: Record<1 | 2 | 3 | 4, Letter[]> = {
  1: LETTERS.filter((l) => l.group === 1),
  2: LETTERS.filter((l) => l.group === 2),
  3: LETTERS.filter((l) => l.group === 3),
  4: LETTERS.filter((l) => l.group === 4),
};

export const NON_CONNECTORS = LETTERS.filter((l) => l.joining === "right");

export interface Forms {
  isolated: string;
  initial: string;
  medial: string;
  final: string;
}

/**
 * Harfin dört yazılışı. Sağdan bağlanan (ا د ذ ر ز و) harfler sonraki harfe bağlanmaz:
 * başta ayrı biçimle, ortada ve sonda yalnızca sağdan bağlı biçimle yazılır (K1 s.8).
 */
export function forms(l: Letter): Forms {
  if (l.id === "ye") {
    return { isolated: ALEF_MAKSURA, initial: YEH + TATWEEL, medial: TATWEEL + YEH + TATWEEL, final: TATWEEL + ALEF_MAKSURA };
  }
  const c = l.base;
  if (l.joining === "right") {
    return { isolated: c, initial: c, medial: TATWEEL + c, final: TATWEEL + c };
  }
  return { isolated: c, initial: c + TATWEEL, medial: TATWEEL + c + TATWEEL, final: TATWEEL + c };
}

/** Bir harfin "yanlış" bağlanma biçimi: sağdan bağlanan harfi iki yandan bağlıymış gibi gösterir. */
export function wrongConnectedForm(l: Letter, position: "initial" | "medial"): string | undefined {
  if (l.joining !== "right") return undefined;
  return position === "initial" ? l.base + TATWEEL : TATWEEL + l.base + TATWEEL;
}

export function dotsText(l: Letter): string {
  const { count, pos } = l.dots;
  if (count === 0) return "noktası yok";
  const n = ["", "bir", "iki", "üç"][count];
  const where = pos === "above" ? "üstünde" : pos === "below" ? "altında" : "karnında";
  return `${where} ${n} nokta var`;
}

export function dotsQuestionText(l: Letter): string {
  const { count, pos } = l.dots;
  if (count === 0) return "Noktası olmayan harf hangisi?";
  const n = ["", "bir", "iki", "üç"][count];
  const where = pos === "above" ? "Üstünde" : pos === "below" ? "Altında" : "Karnında";
  return `${where} ${n} nokta olan harf hangisi?`;
}

export function sameDots(a: Letter, b: Letter): boolean {
  return a.dots.count === b.dots.count && (a.dots.count === 0 || a.dots.pos === b.dots.pos);
}
