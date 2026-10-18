// Elle hazırlanmış alıştırma kelimeleri. Kelimeler Kur'an'da geçen yaygın kelime biçimlerinden
// seçilmiştir, ancak âyet olarak sunulmaz ve sûre/âyet bilgisi verilmez.
// Bütün kelimeler öğretmen/uzman incelemesi bekler (reviewStatus: "needs-teacher-review").
// Yazım: Türk elifbası (harekeli elif اَ, dikey esre ٖ ile uzatılan esre, sonda noktasız ى).

/** NFC biçimine getirir. */
const w = (s: string) => s.normalize("NFC");
const list = (...xs: string[]) => xs.map(w);

/** Ünite 2: harekesiz kelimeler (harf bulma). Elif ile ve "ال" ile başlamaz. */
export const PLAIN_WORDS = list(
  "كتب", "قلم", "علم", "خلق", "رزق", "نصر", "شمس", "قمر", "سمع", "بصر", "حكم", "ذكر",
  "صبر", "شكر", "فتح", "عدل", "ظلم", "غفر", "ضرب", "طلب", "جعل", "نفس", "حسن", "وعد", "ملك",
);

/** Ünite 3: yalnızca üstün/esre/ötre içeren üç harfli kelimeler. */
export const HARAKA_WORDS = list(
  "رَزَقَ", "رَجَعَ", "ضَرَبَ", "ظَهَرَ", "رَفَعَ", "صَبَرَ", "عَمِلَ", "سَمِعَ", "حَمِدَ", "فَرِحَ",
  "رُسُلُ", "كُتُبُ", "قُتِلَ", "ذُكِرَ", "غُفِرَ", "كَذِبَ", "سُبُلَ", "شَجَرَ", "رَكِبَ", "كَسَبَ",
  "عُنُقَ", "صَدَقَ", "لَعِبَ", "حَسُنَ", "دَخَلَ", "وَسِعَ", "خَلَقَ", "نَصَرَ", "ذَهَبَ", "جَعَلَ",
  "كَتَبَ", "طَبَعَ", "ظَلَمَ", "بَعَثَ", "غَفَرَ", "بَلَغَ", "فَتَحَ", "نَظَرَ", "خُلِقَ", "جُمِعَ",
);

/** Ünite 4: cezm içeren kelimeler (med, şedde, tenvin yok). */
export const SUKUN_WORDS = list(
  "قُلْ", "لَمْ", "هُمْ", "مِنْ", "عَنْ", "قَبْلَ", "يَوْمَ", "كَيْفَ", "لَكُمْ", "كُنْتُمْ",
  "اَرْسَلَ", "اَكْبَرُ", "اَنْزَلَ", "نَعْبُدُ", "مَعَكُمْ", "رَبِحَتْ", "عَلَيْهِمْ", "قَوْلِهِمْ", "اِسْتَكْبَرَ", "يَعْلَمُ",
  "نَشْرَحْ", "صَدْرَكَ", "يَخْلُقُ", "اَنْتُمْ", "عَبْدُ", "قَلْبُ", "نَفْسُ", "هَلْ", "بَلْ", "قَدْ",
  "لَنْ", "يَلِدْ", "اَنْفُسَهُمْ", "مَثَلُهُمْ",
);

/** Ünite 5: şedde içeren kelimeler (med, tenvin yok). */
export const SHADDA_WORDS = list(
  "اِنَّ", "ثُمَّ", "رَبِّ", "عَلَّمَ", "نَزَّلَ", "كُلُّ", "حَقُّ", "يَظُنُّ", "جَهَنَّمَ", "قَدَّرَ",
  "فَصَّلَ", "صَدَّقَ", "كَذَّبَ", "اِتَّبَعَ", "يُبَشِّرُ", "تَوَكَّلْ", "لَعَلَّكُمْ", "يُبَيِّنُ", "وَجَّهْتُ", "اُمَّ",
  "شَرِّ", "سَبِّحْ", "مَسَّ", "ظَلَّ", "كَلَّمَ", "قَطَّعَ", "زُيِّنَ", "يُعَلِّمُ", "يُكَذِّبُ", "مُدَّثِّرُ",
);

/** Ünite 6: med harfli kelimeler. */
export const MADD_WORDS = list(
  "قَالَ", "كَانَ", "سُبْحَانَ", "كِتَابَ", "رَمَضَانَ", "جَوَابَ", "قَدٖيرُ", "عَظٖيمَ", "عَالَمٖينَ", "صَادِقٖينَ",
  "مُسْتَقٖيمَ", "اَعُوذُ", "رَسُولَ", "يَعْلَمُونَ", "يَشْكُرُونَ", "تَعْبُدُونَ", "عَابِدُونَ", "مُجَاهِدُونَ", "مُهَاجِرُونَ", "يَسْتَطٖيعُونَ",
  "نُورُ", "دٖينِ", "سَبٖيلِ", "كَرٖيمُ", "رَحٖيمُ", "عَلٖيمُ", "حَكٖيمُ", "يَقُولُ", "نَارُ", "قُلُوبُ",
  "صُدُورُ", "مَالِكِ",
);

/** Ünite 7: âsar (dikey üstün) içeren kelimeler. */
export const ASAR_WORDS = list(
  "رَحْمٰنُ", "اٰمَنَ", "مٰلِكِ", "هٰرُونَ", "هٰذَا", "مُوسٰى", "تَقْوٰى", "ذٰلِكَ", "لٰكِنْ", "اِلٰهَ",
  "عَلٰى", "سَمٰوَاتِ", "عٖيسٰى", "يَحْيٰى", "اُخْرٰى", "اَعْلٰى",
);

/** Ünite 7: dört elif uzatma işareti (ٓ) içeren kelimeler. İşaret med harfinin üstündedir. */
export const MADDAH_WORDS = list(
  "جَآءَ", "شَآءَ", "سَآءَ", "يَشَآءُ", "اِنَّآ", "يَآ", "بِمَآ", "لَآ", "تَشَآءُ", "اَوْلِيَآءَ",
);

/** Ünite 8: tenvinli kelimeler. */
export const TANWEEN_WORDS = list(
  "حَكٖيمًا", "نُورًا", "رِزْقًا", "مَالًا", "قَصَصًا", "سَكَنًا", "اَبَدًا", "عِوَجًا", "مَطَرًا", "سَفَرًا",
  "عَادٍ", "اَجْرٍ", "سَفَرٍ", "اَيَّامٍ", "سَبٖيلٍ", "شَمْسٍ", "فَضْلٍ", "قَوْمٍ", "نَارٍ", "يَوْمٍ",
  "اَحَدٌ", "رُسُلٌ", "كِتَابٌ", "عَدْلٌ", "كَثٖيرٌ", "صَبْرٌ", "عِلْمٌ", "حَقٌّ", "عَظٖيمٌ", "غَفُورٌ",
);

export type ZamirReason = "long" | "short-sukun" | "short-madd";
/** Ünite 9: zamir. long = önceki harf harekeli; short-sukun = önceki harf cezmli; short-madd = önceki harf med harfi. */
export const ZAMIR_WORDS: { word: string; reason: ZamirReason }[] = [
  ["لَهُ", "long"], ["بِهٖ", "long"], ["رَبَّهُ", "long"], ["رَبِّهٖ", "long"], ["كُتُبِهٖ", "long"],
  ["رُسُلِهٖ", "long"], ["نَفْسِهٖ", "long"], ["نُورِهٖ", "long"], ["كُلُّهُ", "long"], ["اَمْرِهٖ", "long"],
  ["قَلْبِهٖ", "long"], ["اَهْلِهٖ", "long"], ["عَمَلَهُ", "long"], ["خَلَقَهُ", "long"], ["اِنَّهُ", "long"],
  ["عَبْدَهُ", "long"], ["قَوْمِهٖ", "long"],
  ["عَنْهُ", "short-sukun"], ["مِنْهُ", "short-sukun"], ["فَسَبِّحْهُ", "short-sukun"], ["يَعْلَمْهُ", "short-sukun"],
  ["اِلَيْهِ", "short-sukun"], ["عَلَيْهِ", "short-sukun"], ["لَدَيْهِ", "short-sukun"],
  ["فٖيهِ", "short-madd"], ["اَخٖيهِ", "short-madd"], ["اَبٖيهِ", "short-madd"], ["عَلَّمْنَاهُ", "short-madd"],
  ["اَنْزَلْنَاهُ", "short-madd"], ["اَرْسَلْنَاهُ", "short-madd"], ["خَلَقْنَاهُ", "short-madd"], ["اَبُوهُ", "short-madd"],
].map(([word, reason]) => ({ word: w(word), reason: reason as ZamirReason }));

export type LafzaReason = "thick-fatha" | "thick-damma" | "thin-kasra";
/** Ünite 9: lafzatullah. Önceki harekeye göre kalın/ince. */
export const LAFZA_PHRASES: { phrase: string; reason: LafzaReason }[] = [
  ["اَللّٰهُ", "thick-fatha"], ["مِنَ اللّٰهِ", "thick-fatha"], ["قَالَ اللّٰهُ", "thick-fatha"], ["اِنَّ اللّٰهَ", "thick-fatha"],
  ["عِنْدَ اللّٰهِ", "thick-fatha"], ["خَلَقَ اللّٰهُ", "thick-fatha"], ["هُوَ اللّٰهُ", "thick-fatha"], ["شَهِدَ اللّٰهُ", "thick-fatha"],
  ["مَعَ اللّٰهِ", "thick-fatha"], ["وَاللّٰهُ", "thick-fatha"],
  ["رَسُولُ اللّٰهِ", "thick-damma"], ["نَصْرُ اللّٰهِ", "thick-damma"], ["عَبْدُ اللّٰهِ", "thick-damma"], ["يُرٖيدُ اللّٰهُ", "thick-damma"],
  ["يَعْلَمُ اللّٰهُ", "thick-damma"], ["وَعْدُ اللّٰهِ", "thick-damma"],
  ["بِسْمِ اللّٰهِ", "thin-kasra"], ["بِاللّٰهِ", "thin-kasra"], ["لِلّٰهِ", "thin-kasra"], ["خَلْقِ اللّٰهِ", "thin-kasra"],
  ["رَسُولِ اللّٰهِ", "thin-kasra"], ["سَبٖيلِ اللّٰهِ", "thin-kasra"], ["قُلِ اللّٰهُمَّ", "thin-kasra"], ["مِنْ دُونِ اللّٰهِ", "thin-kasra"],
  ["اَمْرِ اللّٰهِ", "thin-kasra"], ["فَضْلِ اللّٰهِ", "thin-kasra"], ["ذِكْرِ اللّٰهِ", "thin-kasra"], ["رَحْمَتِ اللّٰهِ", "thin-kasra"],
].map(([phrase, reason]) => ({ phrase: w(phrase), reason: reason as LafzaReason }));

export type ElifLamReason = "read" | "silent";
/** Ünite 10: elif lâm takısı. read = lâmda cezm var (okunur); silent = sonraki harf şeddeli (okunmaz). */
export const ELIF_LAM_WORDS: { word: string; reason: ElifLamReason }[] = [
  ["اَلْحَمْدُ", "read"], ["اَلْمَلِكُ", "read"], ["اَلْكِتَابُ", "read"], ["اَلْقَمَرُ", "read"], ["اَلْعِلْمُ", "read"],
  ["اَلْفَلَقُ", "read"], ["اَلْبَيْتُ", "read"], ["اَلْغَفُورُ", "read"], ["اَلْيَوْمَ", "read"], ["اَلْوَدُودُ", "read"],
  ["اَلْخَلْقُ", "read"], ["اَلْهُدٰى", "read"], ["اَلْعَصْرُ", "read"], ["اَلْجِبَالُ", "read"], ["اَلْحَقُّ", "read"],
  ["اَلرَّحٖيمُ", "silent"], ["اَلشَّمْسُ", "silent"], ["اَلنَّاسُ", "silent"], ["اَلصِّرَاطَ", "silent"], ["اَلتّٖينُ", "silent"],
  ["اَلزَّيْتُونُ", "silent"], ["اَلدّٖينُ", "silent"], ["اَلذِّكْرُ", "silent"], ["اَلطَّارِقُ", "silent"], ["اَللَّيْلُ", "silent"],
  ["اَلنُّورُ", "silent"], ["اَلرَّحْمٰنُ", "silent"], ["اَلسَّلَامُ", "silent"], ["اَلضُّحٰى", "silent"], ["اَلظُّلُمَاتُ", "silent"],
].map(([word, reason]) => ({ word: w(word), reason: reason as ElifLamReason }));

export type RaReason = "thick-fatha" | "thick-damma" | "thin-kasra";
/** Ünite 10: kelimede tek bir harekeli râ bulunur. */
export const RA_WORDS: { word: string; reason: RaReason }[] = [
  ["رَبِّ", "thick-fatha"], ["رَزَقَ", "thick-fatha"], ["صَبَرَ", "thick-fatha"], ["نَصَرَ", "thick-fatha"], ["ذَكَرَ", "thick-fatha"],
  ["سِرَاجًا", "thick-fatha"], ["تَرَكْنَا", "thick-fatha"], ["حَرَامٌ", "thick-fatha"], ["فَرَغْتَ", "thick-fatha"], ["مُبَارَكًا", "thick-fatha"],
  ["رَمَضَانَ", "thick-fatha"], ["تُرَابٌ", "thick-fatha"],
  ["رُسُلُ", "thick-damma"], ["رُزِقَ", "thick-damma"], ["رُكَّعًا", "thick-damma"], ["رُبَّمَا", "thick-damma"], ["قُرُونٍ", "thick-damma"],
  ["رِزْقًا", "thin-kasra"], ["رِجَالٌ", "thin-kasra"], ["فِرَاشًا", "thin-kasra"], ["فَرِحَ", "thin-kasra"], ["قَرٖيبٌ", "thin-kasra"],
  ["كَرٖيمٌ", "thin-kasra"], ["مَرٖيضٌ", "thin-kasra"], ["يُرٖيدُ", "thin-kasra"], ["رٖيحٌ", "thin-kasra"], ["رِضْوَانٌ", "thin-kasra"],
  ["رِقَابٍ", "thin-kasra"], ["صُدُورِهِمْ", "thin-kasra"], ["عُرِضَ", "thin-kasra"],
].map(([word, reason]) => ({ word: w(word), reason: reason as RaReason }));

/** Ünite 11: vakf. Son harekesi tek hareke, iki esre veya iki ötre olan kelimeler. */
export const VAKF_WORDS = list(
  "كِتَابٌ", "عَظٖيمٍ", "رَحٖيمِ", "نَسْتَعٖينُ", "اَحَدٌ", "اَلصَّمَدُ", "اَلْفَلَقِ", "خَلَقَ", "حَسَدَ", "اَلنَّاسِ",
  "اَلْعَالَمٖينَ", "اَلدّٖينِ", "قَدٖيرٌ", "عَلٖيمٌ", "حَكٖيمٌ", "نُورٌ", "عَذَابٌ", "كَبٖيرٌ", "اَلْكَوْثَرَ", "يَوْمٍ",
  "قَوْمٍ", "اَلْعَصْرِ",
);

/** Ünite 11: tenvinli geçiş kural örnekleri (âyet değildir). [tenvinli kelime, sonraki kelime] */
export const TRANSITION_PAIRS: [string, string][] = (
  [
    ["اَحَدٌ", "اللّٰهُ"],
    ["نُوحٌ", "ابْنَهُ"],
    ["قَدٖيرٌ", "الَّذٖى"],
    ["مُرٖيبٍ", "الَّذٖى"],
    ["رَسُولًا", "الَّذٖى"],
    ["حَكٖيمٌ", "الَّذٖى"],
    ["نُورًا", "الْيَوْمَ"],
    ["عَظٖيمٌ", "الَّذٖى"],
    ["خَيْرًا", "الْيَوْمَ"],
    ["قَوْمٍ", "الَّذٖينَ"],
  ] as [string, string][]
).map(([a, b]) => [w(a), w(b)]);
