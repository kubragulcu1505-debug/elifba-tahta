// Ünite ve ders tanımları. Ana omurga K1 (basılı kitap) sırasıdır; ayrıntılar docs/ARASTIRMA.md.
import type { Feature, Lesson, Unit } from "./types.ts";

export const UNITS: Unit[] = [
  { id: "u1", order: 1, title: "Harfler", summary: "28 harfi şekli ve adıyla tanıma, benzer harfleri ayırma.", sources: [{ id: "K1", locator: "s.6–7" }, { id: "K2", locator: "Ders 1" }] },
  { id: "u2", order: 2, title: "Harflerin yazılışları", summary: "Başta, ortada, sonda ve ayrı yazılışlar; bağlanmayan harfler.", sources: [{ id: "K1", locator: "s.8" }, { id: "K2", locator: "Harfler ve Şekilleri" }] },
  { id: "u3", order: 3, title: "Harekeler", summary: "Üstün, esre ve ötreyi ayrı ayrı, sonra karışık çalışma.", sources: [{ id: "K1", locator: "s.9–11" }, { id: "K2", locator: "Ders 2, 5, 8" }] },
  { id: "u4", order: 4, title: "Cezm", summary: "Cezmli harfi önceki harekeyle birleştirme.", sources: [{ id: "K1", locator: "s.12–13" }, { id: "K2", locator: "Ders 11" }] },
  { id: "u5", order: 5, title: "Şedde", summary: "Şeddeli harfi iki kez okuma.", sources: [{ id: "K1", locator: "s.14–15" }, { id: "K2", locator: "Ders 12" }] },
  { id: "u6", order: 6, title: "Med harfleri", summary: "Elif, vav ve yâ ile uzatma.", sources: [{ id: "K1", locator: "s.16–17" }, { id: "K2", locator: "Ders 3, 6, 9" }] },
  { id: "u7", order: 7, title: "Âsar, med ve kasr", summary: "Dikey üstün ve uzatma işaretleri.", sources: [{ id: "K1", locator: "s.18" }] },
  { id: "u8", order: 8, title: "Tenvin", summary: "İki üstün, iki esre, iki ötre.", sources: [{ id: "K1", locator: "s.19–21" }, { id: "K2", locator: "Ders 4, 7, 10" }] },
  { id: "u9", order: 9, title: "Zamir ve lafzatullah", summary: "Zamirin uzatılması; Allah lafzının kalın ve ince okunuşu.", sources: [{ id: "K1", locator: "s.22" }, { id: "K2", locator: "Ders 14, 17" }] },
  { id: "u10", order: 10, title: "Elif lâm takısı ve râ", summary: "Lâmın okunduğu ve okunmadığı yerler; râ harfinin kalın ve ince okunuşu.", sources: [{ id: "K1", locator: "s.23" }, { id: "K2", locator: "Ders 16" }] },
  { id: "u11", order: 11, title: "Duruş ve geçiş", summary: "Vakf (durma) ve tenvinli kelimelerden geçiş.", sources: [{ id: "K2", locator: "Ders 15, 29" }] },
  { id: "u12", order: 12, title: "Kur'an okumaya hazırlık", summary: "Genel tekrar ve öğretmenle yüzüne okuma.", sources: [{ id: "K1", locator: "s.24–25" }, { id: "K2", locator: "Ders 30" }] },
];

const F1: Feature[] = ["letters", "tatweel"];
const F2: Feature[] = [...F1, "lamAlif"];
const F3a: Feature[] = [...F2, "fatha"];
const F3b: Feature[] = [...F3a, "kasra"];
const F3c: Feature[] = [...F3b, "damma"];
const F4: Feature[] = [...F3c, "sukun"];
const F5: Feature[] = [...F4, "shadda"];
const F6: Feature[] = [...F5, "madd", "dikeyKesra"];
const F7: Feature[] = [...F6, "asar", "maddah", "hamza"];
const F8: Feature[] = [...F7, "tanween"];
const F9a: Feature[] = [...F8, "zamir"];
const F9b: Feature[] = [...F9a, "lafzatullah"];
const F10: Feature[] = [...F9b, "elifLam"];
const F11: Feature[] = [...F10, "wasla"];

const letterChecklist = (letters: string) => [
  `${letters} harflerini gösterildiğinde adıyla söylüyor.`,
  "Benzer harfleri noktalarına bakarak ayırıyor.",
];

export const LESSONS: Lesson[] = [
  // ───────────── Ünite 1: Harfler ─────────────
  {
    id: "u1-l1", unitId: "u1", order: 1, title: "Harfler 1: ا ب ت ث ج ح خ",
    goal: "İlk yedi harfi şekli ve adıyla tanır, noktalarına göre ayırır.",
    explanation: [
      "Arapça sağdan sola yazılır ve okunur. Elifbada 28 harf vardır.",
      "Bu derste ilk yedi harfi tanıyoruz. ⟪ب ت ث⟫ aynı gövdeye sahiptir; yalnızca noktaları farklıdır. ⟪ج ح خ⟫ de öyledir.",
      "Bir harfin adını bilmek, onu okuyabilmek demek değildir. Önce harfin şeklini ve adını öğreniyoruz; sesini harekelerle öğreneceğiz.",
    ],
    examples: [
      { arabic: "ا", note: "Elif: dik bir çizgi, noktası yok." },
      { arabic: "ب", note: "Be: altında bir nokta." },
      { arabic: "ت", note: "Te: üstünde iki nokta." },
      { arabic: "ث", note: "Se: üstünde üç nokta." },
      { arabic: "ج", note: "Cim: karnında bir nokta." },
      { arabic: "ح", note: "Ha: noktası yok." },
      { arabic: "خ", note: "Hı: üstünde bir nokta." },
    ],
    objectives: [
      { id: "u1-l1-o1", text: "Adı söylenen harfi şekiller arasından bulur.", assessedBy: "game" },
      { id: "u1-l1-o2", text: "Gösterilen harfin adını seçer.", assessedBy: "game" },
      { id: "u1-l1-o3", text: "Benzer harfleri noktalarının sayısı ve yerine göre ayırır.", assessedBy: "game" },
      { id: "u1-l1-o4", text: "Harflerin elifba sırasını bilir.", assessedBy: "game" },
      { id: "u1-l1-o5", text: "Harflerin adını doğru söyler.", assessedBy: "teacher" },
    ],
    teacherChecklist: letterChecklist("⟪ا ب ت ث ج ح خ⟫"),
    allowedFeatures: F1, sources: [{ id: "K1", locator: "s.6–7" }, { id: "K2", locator: "Harfler ve İsimleri" }],
  },
  {
    id: "u1-l2", unitId: "u1", order: 2, title: "Harfler 2: د ذ ر ز س ش ص",
    goal: "İkinci yedi harfi şekli ve adıyla tanır, önceki harflerden ayırır.",
    explanation: [
      "⟪د ذ⟫ ve ⟪ر ز⟫ çiftleri yalnızca bir noktayla ayrılır.",
      "⟪س⟫ ile ⟪ش⟫ aynı dişli gövdeye sahiptir; ⟪ش⟫ harfinin üstünde üç nokta vardır.",
      "⟪ص⟫ (Sad) ile ⟪س⟫ (Sin) Türkçede benzer seslere karşılık gelir ama şekilleri farklıdır.",
    ],
    examples: [
      { arabic: "د", note: "Dal: noktası yok." },
      { arabic: "ذ", note: "Zel: üstünde bir nokta." },
      { arabic: "ر", note: "Ra: noktası yok, aşağı doğru kıvrılır." },
      { arabic: "ز", note: "Ze: Ra'nın üstüne bir nokta." },
      { arabic: "س", note: "Sin: üç dişli, noktası yok." },
      { arabic: "ش", note: "Şın: Sin'in üstüne üç nokta." },
      { arabic: "ص", note: "Sad: yuvarlak gövdeli, noktası yok." },
    ],
    objectives: [
      { id: "u1-l2-o1", text: "Adı söylenen harfi şekiller arasından bulur.", assessedBy: "game" },
      { id: "u1-l2-o2", text: "Gösterilen harfin adını seçer.", assessedBy: "game" },
      { id: "u1-l2-o3", text: "Benzer harfleri noktalarına göre ayırır.", assessedBy: "game" },
      { id: "u1-l2-o4", text: "Harflerin elifba sırasını bilir.", assessedBy: "game" },
      { id: "u1-l2-o5", text: "Harflerin adını doğru söyler.", assessedBy: "teacher" },
    ],
    teacherChecklist: letterChecklist("⟪د ذ ر ز س ش ص⟫"),
    allowedFeatures: F1, sources: [{ id: "K1", locator: "s.6–7" }, { id: "K2", locator: "Harfler ve İsimleri" }],
  },
  {
    id: "u1-l3", unitId: "u1", order: 3, title: "Harfler 3: ض ط ظ ع غ ف ق",
    goal: "Üçüncü yedi harfi tanır ve benzerlerinden ayırır.",
    explanation: [
      "⟪ض⟫ Sad harfinin üstüne bir nokta konmuş hâlidir.",
      "⟪ط⟫ ile ⟪ظ⟫, ⟪ع⟫ ile ⟪غ⟫ yalnızca bir noktayla ayrılır.",
      "⟪ف⟫ harfinin üstünde bir nokta, ⟪ق⟫ harfinin üstünde iki nokta vardır.",
    ],
    examples: [
      { arabic: "ض", note: "Dad: üstünde bir nokta." },
      { arabic: "ط", note: "Tı: noktası yok." },
      { arabic: "ظ", note: "Zı: üstünde bir nokta." },
      { arabic: "ع", note: "Ayn: noktası yok." },
      { arabic: "غ", note: "Ğayn: üstünde bir nokta." },
      { arabic: "ف", note: "Fe: üstünde bir nokta." },
      { arabic: "ق", note: "Kaf: üstünde iki nokta." },
    ],
    objectives: [
      { id: "u1-l3-o1", text: "Adı söylenen harfi şekiller arasından bulur.", assessedBy: "game" },
      { id: "u1-l3-o2", text: "Gösterilen harfin adını seçer.", assessedBy: "game" },
      { id: "u1-l3-o3", text: "Benzer harfleri noktalarına göre ayırır.", assessedBy: "game" },
      { id: "u1-l3-o4", text: "Harflerin elifba sırasını bilir.", assessedBy: "game" },
      { id: "u1-l3-o5", text: "Harflerin adını doğru söyler.", assessedBy: "teacher" },
    ],
    teacherChecklist: letterChecklist("⟪ض ط ظ ع غ ف ق⟫"),
    allowedFeatures: F1, sources: [{ id: "K1", locator: "s.6–7" }, { id: "K2", locator: "Harfler ve İsimleri" }],
  },
  {
    id: "u1-l4", unitId: "u1", order: 4, title: "Harfler 4: ك ل م ن و هـ ى",
    goal: "Son yedi harfi tanır; 28 harfin tamamını şekliyle bilir.",
    explanation: [
      "⟪ن⟫ (Nun) üstünde bir nokta olan çanak biçimli bir harftir; ⟪ب⟫ ailesine benzer.",
      "He harfi elifba tablosunda ⟪هـ⟫ biçiminde gösterilir. Ye harfi tek başına ⟪ى⟫ biçiminde, noktasız yazılır.",
      "⟪لا⟫ ayrı bir harf değildir; Lam ile Elif'in birlikte yazılışıdır.",
    ],
    examples: [
      { arabic: "ك", note: "Kef." },
      { arabic: "ل", note: "Lam." },
      { arabic: "م", note: "Mim." },
      { arabic: "ن", note: "Nun: üstünde bir nokta." },
      { arabic: "و", note: "Vav." },
      { arabic: "هـ", note: "He." },
      { arabic: "ى", note: "Ye: tek başına noktasız yazılır." },
    ],
    objectives: [
      { id: "u1-l4-o1", text: "Adı söylenen harfi şekiller arasından bulur.", assessedBy: "game" },
      { id: "u1-l4-o2", text: "Gösterilen harfin adını seçer.", assessedBy: "game" },
      { id: "u1-l4-o3", text: "Benzer harfleri ayırır.", assessedBy: "game" },
      { id: "u1-l4-o4", text: "Harflerin elifba sırasını bilir.", assessedBy: "game" },
      { id: "u1-l4-o5", text: "Harflerin adını doğru söyler.", assessedBy: "teacher" },
    ],
    teacherChecklist: letterChecklist("⟪ك ل م ن و هـ ى⟫"),
    allowedFeatures: F1, sources: [{ id: "K1", locator: "s.6–7" }, { id: "K2", locator: "Harfler ve İsimleri" }],
  },
  {
    id: "u1-l5", unitId: "u1", order: 5, title: "Benzer harfler",
    goal: "Şekli benzeyen harfleri nokta sayısına ve noktanın yerine bakarak ayırır.",
    explanation: [
      "Şekil olarak benzeyen harfler, nokta sayısına ve noktanın yerine dikkat edilince kolayca ayırt edilir.",
      "Önce harfin gövdesine bakın, sonra noktaları sayın: altta mı, üstte mi, karnında mı?",
    ],
    examples: [
      { arabic: "ب ت ث ن", note: "Altında bir • üstünde iki • üstünde üç • üstünde bir (çanak)." },
      { arabic: "ج ح خ", note: "Karnında bir • noktasız • üstünde bir." },
      { arabic: "د ذ  ر ز", note: "Dal / Zel ve Ra / Ze çiftleri." },
      { arabic: "س ش  ص ض", note: "Sin / Şın ve Sad / Dad çiftleri." },
      { arabic: "ط ظ  ع غ  ف ق", note: "Tı / Zı, Ayn / Ğayn, Fe / Kaf." },
    ],
    objectives: [
      { id: "u1-l5-o1", text: "Gösterilen harfin aynısını benzer harfler arasından seçer.", assessedBy: "game" },
      { id: "u1-l5-o2", text: "Nokta sayısı ve yeri verilen harfi bulur.", assessedBy: "game" },
      { id: "u1-l5-o3", text: "Benzer harfleri karıştırmadan adlandırır.", assessedBy: "teacher" },
    ],
    teacherChecklist: ["Benzer harf çiftlerini (ب/ت/ث, ج/ح/خ, د/ذ, ر/ز, س/ش, ص/ض, ط/ظ, ع/غ, ف/ق) karıştırmadan söylüyor."],
    allowedFeatures: F1, sources: [{ id: "K2", locator: "Harfler > Pekiştirme" }],
  },
  {
    id: "u1-l6", unitId: "u1", order: 6, title: "Harfler karma tekrar",
    goal: "28 harfi karışık sırada tanır ve adlandırır.",
    explanation: ["Bütün harfleri karışık sırayla tekrar ediyoruz. Harfin adını söylemeden önce noktalarına bakın."],
    examples: [{ arabic: "ا ب ت ث ج ح خ د ذ ر ز س ش ص", note: "1–14" }, { arabic: "ض ط ظ ع غ ف ق ك ل م ن و هـ ى", note: "15–28" }],
    objectives: [
      { id: "u1-l6-o1", text: "Adı söylenen harfi 28 harf içinden bulur.", assessedBy: "game" },
      { id: "u1-l6-o2", text: "Gösterilen harfin adını seçer.", assessedBy: "game" },
      { id: "u1-l6-o3", text: "28 harfi sırasıyla ve karışık olarak söyler.", assessedBy: "teacher" },
    ],
    teacherChecklist: ["28 harfi sırasıyla söylüyor.", "Karışık gösterilen harflerin adını söylüyor."],
    allowedFeatures: F1, sources: [{ id: "K1", locator: "s.7 alıştırmalar" }],
  },

  // ───────────── Ünite 2: Yazılışlar ─────────────
  {
    id: "u2-l1", unitId: "u2", order: 1, title: "Başta yazılış",
    goal: "Harflerin kelime başındaki yazılışını tanır.",
    explanation: [
      "Harfler kelimedeki yerine göre biraz şekil değiştirir: başta, ortada, sonda ve ayrı.",
      "Başta yazılan harf, kendinden sonraki (solundaki) harfe bağlanır: ⟪بـ⟫ gibi.",
      "Altı harf kendinden sonraki harfe hiç bağlanmaz: ⟪ا د ذ ر ز و⟫. Bunlar başta da ayrı hâlleri gibi yazılır.",
    ],
    examples: [
      { arabic: "ب  بـ", note: "Be ayrı ve başta." },
      { arabic: "ع  عـ", note: "Ayn ayrı ve başta: kuyruğu kalkar." },
      { arabic: "هـ", note: "He başta." },
      { arabic: "د", note: "Dal başta da böyle yazılır; sonraki harfe bağlanmaz." },
    ],
    objectives: [
      { id: "u2-l1-o1", text: "Harfin başta yazılışını seçer.", assessedBy: "game" },
      { id: "u2-l1-o2", text: "Başta yazılmış biçimden harfi tanır.", assessedBy: "game" },
    ],
    teacherChecklist: ["Kelime başındaki harfi gösterip adını söylüyor."],
    allowedFeatures: F1, sources: [{ id: "K1", locator: "s.8" }],
  },
  {
    id: "u2-l2", unitId: "u2", order: 2, title: "Ortada yazılış",
    goal: "Harflerin kelime ortasındaki yazılışını tanır.",
    explanation: [
      "Ortadaki harf hem önceki (sağdaki) hem sonraki (soldaki) harfe bağlanır: ⟪ـبـ⟫.",
      "Bağlanmayan altı harf ortada yalnızca sağdan bağlanır: ⟪ـد⟫. Ondan sonraki harf yeniden başlar.",
    ],
    examples: [
      { arabic: "ـبـ", note: "Be ortada." },
      { arabic: "ـعـ", note: "Ayn ortada: şekli en çok değişen harflerden biridir." },
      { arabic: "ـهـ", note: "He ortada." },
      { arabic: "ـر", note: "Ra ortada: sola bağlanmaz." },
    ],
    objectives: [
      { id: "u2-l2-o1", text: "Harfin ortada yazılışını seçer.", assessedBy: "game" },
      { id: "u2-l2-o2", text: "Ortada yazılmış biçimden harfi tanır.", assessedBy: "game" },
    ],
    teacherChecklist: ["Kelime ortasındaki harfi gösterip adını söylüyor."],
    allowedFeatures: F1, sources: [{ id: "K1", locator: "s.8" }],
  },
  {
    id: "u2-l3", unitId: "u2", order: 3, title: "Sonda yazılış",
    goal: "Harflerin kelime sonundaki yazılışını tanır.",
    explanation: [
      "Sondaki harf yalnızca önceki (sağdaki) harfe bağlanır: ⟪ـب⟫.",
      "Ye harfi sonda noktasız yazılır: ⟪ـى⟫. He harfi sonda ⟪ـه⟫ biçimini alır.",
    ],
    examples: [
      { arabic: "ـب", note: "Be sonda." },
      { arabic: "ـع", note: "Ayn sonda." },
      { arabic: "ـه", note: "He sonda." },
      { arabic: "ـى", note: "Ye sonda: noktasız." },
    ],
    objectives: [
      { id: "u2-l3-o1", text: "Harfin sonda yazılışını seçer.", assessedBy: "game" },
      { id: "u2-l3-o2", text: "Sonda yazılmış biçimden harfi tanır.", assessedBy: "game" },
    ],
    teacherChecklist: ["Kelime sonundaki harfi gösterip adını söylüyor."],
    allowedFeatures: F1, sources: [{ id: "K1", locator: "s.8" }],
  },
  {
    id: "u2-l4", unitId: "u2", order: 4, title: "Bağlanmayan harfler ve kelimede harf",
    goal: "Bağlanmayan altı harfi bilir; harekesiz bir kelimede harfleri sağdan sola bulur.",
    explanation: [
      "⟪ا د ذ ر ز و⟫ harfleri kendinden sonraki harfe bağlanmaz. Diğer bütün harfler iki yandan bağlanabilir.",
      "Kelimeyi sağdan sola okuruz: ilk harf en sağdaki harftir.",
      "Lam ile Elif yan yana gelince ⟪لا⟫ biçiminde yazılır. Bu ayrı bir harf değildir.",
    ],
    examples: [
      { arabic: "كتب", note: "Sağdan sola: Kef, Te, Be." },
      { arabic: "ذكر", note: "Zel sola bağlanmaz; Kef yeni başlar." },
      { arabic: "لا", note: "Lam + Elif." },
    ],
    objectives: [
      { id: "u2-l4-o1", text: "Kendinden sonraki harfe bağlanmayan harfleri bilir.", assessedBy: "game" },
      { id: "u2-l4-o2", text: "Harekesiz kelimede ilk, orta ve son harfi bulur.", assessedBy: "game" },
      { id: "u2-l4-o3", text: "⟪لا⟫ yazılışının Lam ve Elif'ten oluştuğunu bilir.", assessedBy: "game" },
    ],
    teacherChecklist: ["Kısa bir kelimenin harflerini sağdan sola tek tek söylüyor."],
    allowedFeatures: F2, sources: [{ id: "K1", locator: "s.6 notu, s.8" }, { id: "K2", locator: "Harfler ve Şekilleri" }],
  },
  {
    id: "u2-l5", unitId: "u2", order: 5, title: "Yazılışlar karma tekrar",
    goal: "Harfi herhangi bir yazılışından tanır.",
    explanation: ["Başta, ortada, sonda ve ayrı yazılışları karışık olarak tekrar ediyoruz. Harfin değişmeyen kısmına ve noktalarına bakın."],
    examples: [{ arabic: "عـ  ـعـ  ـع  ع", note: "Ayn'ın dört yazılışı." }, { arabic: "يـ  ـيـ  ـى  ى", note: "Ye'nin dört yazılışı." }],
    objectives: [{ id: "u2-l5-o1", text: "Yazılış biçiminden harfi tanır.", assessedBy: "game" }],
    teacherChecklist: ["Bir kelimedeki harfleri yazılış biçimlerinden tanıyıp söylüyor."],
    allowedFeatures: F2, sources: [{ id: "K1", locator: "s.8" }],
  },

  // ───────────── Ünite 3: Harekeler ─────────────
  {
    id: "u3-l1", unitId: "u3", order: 1, title: "Üstün (fetha)",
    goal: "Üstünü tanır; harf adı ile üstünü birleştirerek doğru heceyi seçer.",
    explanation: [
      "Harflerin okunmasını sağlayan işaretlere hareke denir.",
      "Üstün (fetha) harfin üstüne konan küçük eğik çizgidir: ⟪بَ⟫. Harfe kısa bir \"e\" sesi verir; kalın harflerde ses \"a\"ya yaklaşır.",
      "Harfin adı ile harekeli sesi farklıdır: harfin adı \"Be\"dir; ⟪بَ⟫ ise \"Be üstün\" diye hecelenir.",
      "Harekeli harfleri önce tek tek, sonra beşli gruplar hâlinde ritmik okuyun.",
    ],
    examples: [
      { arabic: "اَ بَ تَ ثَ جَ", note: "Uzatmadan, ritmik okuyun." },
      { arabic: "حَ خَ دَ ذَ رَ", note: "" },
      { arabic: "زَ سَ شَ صَ ضَ", note: "" },
    ],
    objectives: [
      { id: "u3-l1-o1", text: "Hecelenişi verilen üstünlü harfi seçer.", assessedBy: "game" },
      { id: "u3-l1-o2", text: "Üstünlü harfin hecelenişini seçer.", assessedBy: "game" },
      { id: "u3-l1-o3", text: "Üstünlü harfleri uzatmadan doğru sesle okur.", assessedBy: "teacher" },
    ],
    teacherChecklist: ["Üstünlü harfleri uzatmadan okuyor.", "Kalın harflerde sesi kalınlaştırıyor (ص ض ط ظ غ ق خ)."],
    allowedFeatures: F3a, sources: [{ id: "K1", locator: "s.9" }, { id: "K2", locator: "Ders 2" }],
  },
  {
    id: "u3-l2", unitId: "u3", order: 2, title: "Esre (kesra)",
    goal: "Esreyi tanır ve üstünden ayırır.",
    explanation: [
      "Esre (kesra) harfin altına konan küçük eğik çizgidir: ⟪بِ⟫. Harfe kısa bir \"i\" sesi verir.",
      "Üstün harfin üstünde, esre harfin altındadır. Yerine dikkat edin.",
    ],
    examples: [
      { arabic: "اِ بِ تِ ثِ جِ", note: "Uzatmadan okuyun." },
      { arabic: "بَ بِ", note: "Be üstün • Be esre" },
    ],
    objectives: [
      { id: "u3-l2-o1", text: "Hecelenişi verilen esreli harfi seçer.", assessedBy: "game" },
      { id: "u3-l2-o2", text: "Esreli harfin hecelenişini seçer.", assessedBy: "game" },
      { id: "u3-l2-o3", text: "Esreli harfleri uzatmadan okur.", assessedBy: "teacher" },
    ],
    teacherChecklist: ["Esreli harfleri uzatmadan okuyor.", "Üstün ile esreyi karıştırmıyor."],
    allowedFeatures: F3b, sources: [{ id: "K1", locator: "s.9" }, { id: "K2", locator: "Ders 5" }],
  },
  {
    id: "u3-l3", unitId: "u3", order: 3, title: "Ötre (damme)",
    goal: "Ötreyi tanır ve diğer harekelerden ayırır.",
    explanation: [
      "Ötre (damme) harfin üstüne konan küçük vav biçimli işarettir: ⟪بُ⟫.",
      "İnce harflerde \"ü ile u arası\", kalın harflerde \"u\" sesi verir.",
    ],
    examples: [
      { arabic: "اُ بُ تُ ثُ جُ", note: "Uzatmadan okuyun." },
      { arabic: "بَ بِ بُ", note: "Be üstün • Be esre • Be ötre" },
    ],
    objectives: [
      { id: "u3-l3-o1", text: "Hecelenişi verilen ötreli harfi seçer.", assessedBy: "game" },
      { id: "u3-l3-o2", text: "Ötreli harfin hecelenişini seçer.", assessedBy: "game" },
      { id: "u3-l3-o3", text: "Ötreli harfleri uzatmadan okur.", assessedBy: "teacher" },
    ],
    teacherChecklist: ["Ötreli harfleri uzatmadan okuyor."],
    allowedFeatures: F3c, sources: [{ id: "K1", locator: "s.9" }, { id: "K2", locator: "Ders 8" }],
  },
  {
    id: "u3-l4", unitId: "u3", order: 4, title: "Harekeleri karşılaştırma",
    goal: "Üç harekeyi birbirinden ayırır ve karışık harekeli harfleri tanır.",
    explanation: ["Aynı harfin üç harekeli hâli farklı okunur: ⟪بَ بِ بُ⟫. Önce harfe, sonra harekenin yerine ve şekline bakın."],
    examples: [{ arabic: "قَ قِ قُ", note: "Kaf üstün • Kaf esre • Kaf ötre" }, { arabic: "كَ كِ كُ", note: "Kef üstün • Kef esre • Kef ötre" }],
    objectives: [
      { id: "u3-l4-o1", text: "Harekeli harfteki harekenin adını seçer.", assessedBy: "game" },
      { id: "u3-l4-o2", text: "Harekeli harfleri karşılaştırarak doğru olanı seçer.", assessedBy: "game" },
      { id: "u3-l4-o3", text: "Karışık harekeli harfleri ritmik okur.", assessedBy: "teacher" },
    ],
    teacherChecklist: ["Karışık harekeli harf satırını ritmik ve uzatmadan okuyor."],
    allowedFeatures: F3c, sources: [{ id: "K1", locator: "s.9" }],
  },
  {
    id: "u3-l5", unitId: "u3", order: 5, title: "Harekeli kelimeler",
    goal: "Üç harfli harekeli kelimeleri heceleyerek çözer.",
    explanation: [
      "Kelimeyi sağdan sola, harf harf heceleyin: ⟪رَزَقَ⟫ → Ra üstün · Ze üstün · Kaf üstün.",
      "Sonra heceleri birleştirerek okuyun. Hiçbir harekeyi uzatmayın.",
    ],
    examples: [
      { arabic: "رَزَقَ", note: "Ra üstün · Ze üstün · Kaf üstün" },
      { arabic: "عَمِلَ", note: "Ayn üstün · Mim esre · Lam üstün" },
      { arabic: "رُسُلُ", note: "Ra ötre · Sin ötre · Lam ötre" },
    ],
    objectives: [
      { id: "u3-l5-o1", text: "Harekeli kelimenin hecelenişini seçer.", assessedBy: "game" },
      { id: "u3-l5-o2", text: "Hecelenişi verilen kelimeyi seçer.", assessedBy: "game" },
      { id: "u3-l5-o3", text: "Harekeli kelimeleri birleştirerek okur.", assessedBy: "teacher" },
    ],
    teacherChecklist: ["Üç harfli harekeli kelimeleri heceleyip birleştirerek okuyor."],
    allowedFeatures: F3c, sources: [{ id: "K1", locator: "s.10–11" }],
  },

  // ───────────── Ünite 4: Cezm ─────────────
  {
    id: "u4-l1", unitId: "u4", order: 1, title: "Cezmli heceler",
    goal: "Cezmi tanır; cezmli harfi önceki harekeyle birleştirir.",
    explanation: [
      "Cezm (sükûn) harfin üstüne konan küçük yuvarlaktır: ⟪بْ⟫.",
      "Cezm, üzerinde bulunduğu harfi kendinden önceki harfin harekesiyle birleştirir: ⟪اَبْ⟫. Cezmli harfe hareke sesi verilmez; önceki hareke de uzatılmaz.",
    ],
    examples: [
      { arabic: "اَبْ اِبْ اُبْ", note: "Elif üstün · Be cezm …" },
      { arabic: "اَلْ اِلْ اُلْ", note: "" },
      { arabic: "اَمْ اِمْ اُمْ", note: "" },
    ],
    objectives: [
      { id: "u4-l1-o1", text: "Hecelenişi verilen cezmli heceyi seçer.", assessedBy: "game" },
      { id: "u4-l1-o2", text: "Cezmli hecenin hecelenişini seçer.", assessedBy: "game" },
      { id: "u4-l1-o3", text: "Cezmli harfe hareke sesi vermeden okur.", assessedBy: "teacher" },
    ],
    teacherChecklist: ["Cezmli harfi önceki harekeyle birleştiriyor.", "Cezmden önceki harekeyi uzatmıyor."],
    allowedFeatures: F4, sources: [{ id: "K1", locator: "s.12" }, { id: "K2", locator: "Ders 11" }],
  },
  {
    id: "u4-l2", unitId: "u4", order: 2, title: "Cezmli kelimeler",
    goal: "Cezm içeren kelimelerde cezmli harfi bulur ve kelimeyi heceler.",
    explanation: ["Kelimede cezmli harfi bulun ve önceki heceyle birleştirin: ⟪قُلْ⟫ → Kaf ötre · Lam cezm."],
    examples: [{ arabic: "قُلْ", note: "Kaf ötre · Lam cezm" }, { arabic: "لَمْ", note: "Lam üstün · Mim cezm" }, { arabic: "كُنْتُمْ", note: "İki cezm var." }],
    objectives: [
      { id: "u4-l2-o1", text: "Kelimedeki cezmli harfi bulur.", assessedBy: "game" },
      { id: "u4-l2-o2", text: "Cezmli kelimenin hecelenişini seçer.", assessedBy: "game" },
      { id: "u4-l2-o3", text: "Kelimedeki cezm sayısını bulur.", assessedBy: "game" },
      { id: "u4-l2-o4", text: "Cezmli kelimeleri birleştirerek okur.", assessedBy: "teacher" },
    ],
    teacherChecklist: ["Cezmli kelimeleri akıcı okuyor."],
    allowedFeatures: F4, sources: [{ id: "K1", locator: "s.13" }],
  },

  // ───────────── Ünite 5: Şedde ─────────────
  {
    id: "u5-l1", unitId: "u5", order: 1, title: "Şeddeli heceler",
    goal: "Şeddeyi tanır; şeddeli harfin iki kez okunduğunu bilir.",
    explanation: [
      "Şedde harfin üstüne konan küçük \"w\" biçimli işarettir ve her zaman bir harekeyle birlikte bulunur: ⟪بَّ⟫.",
      "Şedde, bulunduğu harfi önceki harfle birleştirir ve harekesiyle tekrar okutur: ⟪اَبَّ⟫ = ⟪اَبْ⟫ + ⟪بَ⟫.",
      "Türkçedeki \"dikkat, cennet\" kelimelerinde iki sessizin yan yana gelmesine benzer.",
    ],
    examples: [{ arabic: "اَبَّ", note: "= اَبْ + بَ" }, { arabic: "اِنَّ", note: "= اِنْ + نَ" }, { arabic: "ثُمَّ", note: "= ثُمْ + مَ" }],
    objectives: [
      { id: "u5-l1-o1", text: "Hecelenişi verilen şeddeli heceyi seçer.", assessedBy: "game" },
      { id: "u5-l1-o2", text: "Şeddeli heceyi cezmli ve harekeli iki parçaya ayırır.", assessedBy: "game" },
      { id: "u5-l1-o3", text: "Şeddeli harfi sesi bölmeden iki kez okur.", assessedBy: "teacher" },
    ],
    teacherChecklist: ["Şeddeli harfte sesi bölmeden ikiliyor."],
    allowedFeatures: F5, sources: [{ id: "K1", locator: "s.14" }, { id: "K2", locator: "Ders 12" }],
  },
  {
    id: "u5-l2", unitId: "u5", order: 2, title: "Şeddeli kelimeler",
    goal: "Şeddeli kelimelerde şeddeli harfi bulur ve doğru böler.",
    explanation: ["Kelimede şeddeli harfi bulun. O harfi önce cezmli, sonra harekeli okuyun."],
    examples: [{ arabic: "عَلَّمَ", note: "عَلْ + لَمَ" }, { arabic: "رَبِّ", note: "رَبْ + بِ" }],
    objectives: [
      { id: "u5-l2-o1", text: "Kelimedeki şeddeli harfi bulur.", assessedBy: "game" },
      { id: "u5-l2-o2", text: "Şeddeli kelimenin hecelenişini seçer.", assessedBy: "game" },
      { id: "u5-l2-o3", text: "Şeddeli kelimeleri doğru okur.", assessedBy: "teacher" },
    ],
    teacherChecklist: ["Şeddeli kelimeleri akıcı ve şeddeyi belirterek okuyor."],
    allowedFeatures: F5, sources: [{ id: "K1", locator: "s.15" }],
  },

  // ───────────── Ünite 6: Med harfleri ─────────────
  {
    id: "u6-l1", unitId: "u6", order: 1, title: "Med harfleriyle uzatma",
    goal: "Med harflerini (ا و ى) tanır; uzatılan ve uzatılmayan heceyi ayırır.",
    explanation: [
      "Med, uzatarak okumak demektir. ⟪ا و ى⟫ harfleri, kendinden önceki harfin sesini harekesi yönünde uzatır.",
      "Üstünden sonra harekesiz elif: ⟪بَا⟫. Esreden sonra harekesiz yâ: ⟪بٖى⟫. Ötreden sonra harekesiz vav: ⟪بُو⟫.",
      "Türk mushaflarında yâ ile uzatılan esre dikey yazılır (dikey esre). Uygulamada bu işaret ⟪بٖ⟫ biçiminde gösterilir.",
      "Uzatma bir elif miktarıdır: kısa hecenin yaklaşık iki katı.",
    ],
    examples: [
      { arabic: "بَ  بَا", note: "Kısa • uzun" },
      { arabic: "بِ  بٖى", note: "Kısa • uzun" },
      { arabic: "بُ  بُو", note: "Kısa • uzun" },
    ],
    objectives: [
      { id: "u6-l1-o1", text: "Hecelenişi verilen uzun heceyi seçer.", assessedBy: "game" },
      { id: "u6-l1-o2", text: "Hecedeki med harfini bulur.", assessedBy: "game" },
      { id: "u6-l1-o3", text: "Uzatma miktarını bir elif kadar tutar.", assessedBy: "teacher" },
    ],
    teacherChecklist: ["Med harfli heceleri bir elif miktarı uzatıyor.", "Kısa heceleri uzatmıyor."],
    allowedFeatures: F6, sources: [{ id: "K1", locator: "s.16" }, { id: "K2", locator: "Ders 3, 6, 9" }],
  },
  {
    id: "u6-l2", unitId: "u6", order: 2, title: "Uzatmalı kelimeler",
    goal: "Kelimede uzatılan yerleri bulur.",
    explanation: ["Kelimede harekesiz ⟪ا و ى⟫ harflerini arayın. Önceki harfin harekesi uygunsa orası uzatılır."],
    examples: [{ arabic: "قَالَ", note: "Kaf uzatılır." }, { arabic: "نُورُ", note: "Nun uzatılır." }, { arabic: "عَظٖيمَ", note: "Zı uzatılır." }],
    objectives: [
      { id: "u6-l2-o1", text: "Uzatma olan kelimeyi ayırt eder.", assessedBy: "game" },
      { id: "u6-l2-o2", text: "Kelimedeki med harfini ve sayısını bulur.", assessedBy: "game" },
      { id: "u6-l2-o3", text: "Uzatmalı kelimeleri doğru okur.", assessedBy: "teacher" },
    ],
    teacherChecklist: ["Uzatmalı kelimelerde uzatmayı doğru yerde yapıyor."],
    allowedFeatures: F6, sources: [{ id: "K1", locator: "s.17" }],
  },

  // ───────────── Ünite 7: Âsar, med, kasr ─────────────
  {
    id: "u7-l1", unitId: "u7", order: 1, title: "Dikey üstün (âsar) ve uzatma işaretleri",
    goal: "Âsarı ve dört elif uzatma işaretini tanır.",
    explanation: [
      "Âsar (dikey üstün) ⟪ـٰ⟫: önünde med harfi olsun olmasın, o harfin uzatılacağını gösterir: ⟪رَحْمٰنُ⟫.",
      "⟪ـٓ⟫ işareti olan yerlerde dört elif miktarı uzatılır: ⟪جَٓاءَ⟫. Bu örneklerdeki ⟪ء⟫ hemzedir; harekesine göre okunur.",
      "Mushaflarda harfin altına küçük \"med\" ve \"kasr\" yazıları da konur. Med yazısı, med harfi olmadığı hâlde bir elif uzatılacak yerleri; kasr yazısı ise med harfi olduğu hâlde uzatılmayacak yerleri gösterir.",
    ],
    examples: [
      { arabic: "رَحْمٰنُ", note: "Mim dikey üstünle uzatılır." },
      { arabic: "هٰذَا", note: "He dikey üstünle uzatılır." },
      { arabic: "مُوسٰى", note: "Sin dikey üstünle uzatılır." },
      { arabic: "جَٓاءَ", note: "Cim dört elif miktarı uzatılır." },
    ],
    objectives: [
      { id: "u7-l1-o1", text: "Âsar (dikey üstün) bulunan kelimeyi ayırt eder.", assessedBy: "game" },
      { id: "u7-l1-o2", text: "Âsarlı harfi bulur.", assessedBy: "game" },
      { id: "u7-l1-o3", text: "⟪ـٓ⟫ işaretinin uzatma miktarını bilir.", assessedBy: "game" },
      { id: "u7-l1-o4", text: "Mushaftaki med ve kasr yazılarını tanır ve uygular.", assessedBy: "teacher" },
    ],
    teacherChecklist: [
      "Âsarlı harfi bir elif miktarı uzatıyor.",
      "⟪ـٓ⟫ işaretli yerleri dört elif miktarı uzatıyor.",
      "Kitaptaki (K1 s.18) med ve kasr örneklerini doğru okuyor.",
    ],
    notes: [
      "Mushafa özgü \"med\" ve \"kasr\" yazıları açık lisanslı fontlarda doğru gösterilemediği için oyunda sorulmuyor. Bu işaretleri kitabın 18. sayfasından veya öğrencinin mushafından çalıştırın.",
    ],
    allowedFeatures: F7, sources: [{ id: "K1", locator: "s.18" }, { id: "K2", locator: "Medd-i Muttasıl" }],
  },

  // ───────────── Ünite 8: Tenvin ─────────────
  {
    id: "u8-l1", unitId: "u8", order: 1, title: "Tenvini tanıma",
    goal: "İki üstün, iki esre ve iki ötreyi tanır; tek harekeden ve medden ayırır.",
    explanation: [
      "Tenvin; iki üstün, iki esre ve iki ötreye denir. Bulunduğu harfin harekesine \"n\" sesi ekler.",
      "İki üstün çoğu zaman bir elifle birlikte yazılır: ⟪بًا⟫. Bu elif uzatılmaz; ⟪بَا⟫ ile karıştırmayın.",
    ],
    examples: [
      { arabic: "بًا  بٍ  بٌ", note: "Be iki üstün • iki esre • iki ötre" },
      { arabic: "بَ  بًا", note: "Tek üstün • iki üstün" },
    ],
    objectives: [
      { id: "u8-l1-o1", text: "Hecelenişi verilen tenvinli harfi seçer.", assessedBy: "game" },
      { id: "u8-l1-o2", text: "Tenvinin türünü tanır.", assessedBy: "game" },
      { id: "u8-l1-o3", text: "Tenvinde \"n\" sesini doğru verir.", assessedBy: "teacher" },
    ],
    teacherChecklist: ["Tenvinli harflerde \"n\" sesini veriyor.", "İki üstündeki elifi uzatmıyor."],
    allowedFeatures: F8, sources: [{ id: "K1", locator: "s.19" }, { id: "K2", locator: "Ders 4, 7, 10" }],
  },
  {
    id: "u8-l2", unitId: "u8", order: 2, title: "Tenvinli kelimeler",
    goal: "Kelime sonundaki tenvini tanır ve tenvinli kelimeyi ayırt eder.",
    explanation: ["Tenvin genellikle kelimenin son harfinde bulunur: ⟪كِتَابٌ⟫, ⟪عَادٍ⟫, ⟪نُورًا⟫."],
    examples: [{ arabic: "اَحَدٌ", note: "iki ötre" }, { arabic: "سَفَرٍ", note: "iki esre" }, { arabic: "نُورًا", note: "iki üstün" }],
    objectives: [
      { id: "u8-l2-o1", text: "Kelimedeki tenvinin türünü seçer.", assessedBy: "game" },
      { id: "u8-l2-o2", text: "Tenvinli kelimeyi benzerlerinden ayırt eder.", assessedBy: "game" },
      { id: "u8-l2-o3", text: "Tenvinli kelimeleri doğru okur.", assessedBy: "teacher" },
    ],
    teacherChecklist: ["Tenvinli kelimeleri doğru okuyor."],
    allowedFeatures: F8, sources: [{ id: "K1", locator: "s.20–21" }],
  },

  // ───────────── Ünite 9 ─────────────
  {
    id: "u9-l1", unitId: "u9", order: 1, title: "Zamir",
    goal: "Kelime sonundaki zamirin ne zaman uzatıldığını bilir.",
    explanation: [
      "Kelimelerin sonundaki ⟪ـهُ⟫ veya ⟪ـهِ⟫ harfine zamir denir.",
      "Kendinden önceki harf harekeli ise zamir uzatılarak okunur: ⟪لَهُ⟫, ⟪بِهٖ⟫.",
      "Önceki harf cezmli veya med harfi ise uzatılmaz: ⟪مِنْهُ⟫, ⟪فٖيهِ⟫.",
      "Bu kural kelime tek başına okunduğunda geçerlidir. Sonraki kelimeye göre değişen durumları öğretmeninizle çalışın.",
    ],
    examples: [
      { arabic: "لَهُ", note: "Uzatılır: önceki harf harekeli." },
      { arabic: "بِهٖ", note: "Uzatılır: dikey esre." },
      { arabic: "عَنْهُ", note: "Uzatılmaz: önceki harf cezmli." },
      { arabic: "فٖيهِ", note: "Uzatılmaz: önceki harf med harfi." },
    ],
    objectives: [
      { id: "u9-l1-o1", text: "Zamirin uzatılıp uzatılmayacağını nedeniyle seçer.", assessedBy: "game" },
      { id: "u9-l1-o2", text: "Zamiri doğru uzunlukta okur.", assessedBy: "teacher" },
    ],
    teacherChecklist: ["Zamiri uzatılması gereken yerde uzatıyor, gerekmeyen yerde uzatmıyor."],
    allowedFeatures: F9a, sources: [{ id: "K1", locator: "s.22" }, { id: "K2", locator: "Ders 14" }],
  },
  {
    id: "u9-l2", unitId: "u9", order: 2, title: "Lafzatullah",
    goal: "Allah lafzının kalın veya ince okunacağını önceki harekeye göre belirler.",
    explanation: [
      "Allah lafzından önceki harfin harekesi üstün veya ötre ise lafzatullah kalın okunur: ⟪رَسُولُ اللّٰهِ⟫.",
      "Önceki harfin harekesi esre ise ince okunur: ⟪بِسْمِ اللّٰهِ⟫.",
      "Söze ⟪اَللّٰهُ⟫ ile başlanırsa elifin üstünü sebebiyle kalın okunur.",
    ],
    examples: [
      { arabic: "اَللّٰهُ", note: "Kalın" },
      { arabic: "رَسُولُ اللّٰهِ", note: "Kalın: önceki harf ötreli." },
      { arabic: "بِسْمِ اللّٰهِ", note: "İnce: önceki harf esreli." },
    ],
    objectives: [
      { id: "u9-l2-o1", text: "Lafzatullahın kalın veya ince okunuşunu nedeniyle seçer.", assessedBy: "game" },
      { id: "u9-l2-o2", text: "Lafzatullahı kalın ve ince doğru okur.", assessedBy: "teacher" },
    ],
    teacherChecklist: ["Lafzatullahı önceki harekeye göre kalın veya ince okuyor."],
    allowedFeatures: F9b, sources: [{ id: "K1", locator: "s.22" }, { id: "K2", locator: "Ders 17" }],
  },

  // ───────────── Ünite 10 ─────────────
  {
    id: "u10-l1", unitId: "u10", order: 1, title: "Elif lâm takısı",
    goal: "Elif lâm takısında lâmın okunup okunmadığını belirler.",
    explanation: [
      "Kelimelerin başındaki ⟪اَلْ⟫ takısında lâm harfinde cezm varsa lâm okunur: ⟪اَلْحَمْدُ⟫.",
      "Lâmda cezm yoksa lâm okunmaz; sonraki harf şeddeli olur ve doğrudan ona geçilir: ⟪اَلشَّمْسُ⟫.",
    ],
    examples: [
      { arabic: "اَلْحَمْدُ", note: "Lâm okunur." },
      { arabic: "اَلْقَمَرُ", note: "Lâm okunur." },
      { arabic: "اَلشَّمْسُ", note: "Lâm okunmaz." },
      { arabic: "اَلنَّاسُ", note: "Lâm okunmaz." },
    ],
    objectives: [
      { id: "u10-l1-o1", text: "Elif lâm takısında lâmın okunup okunmadığını seçer.", assessedBy: "game" },
      { id: "u10-l1-o2", text: "Elif lâm takılı kelimeleri doğru okur.", assessedBy: "teacher" },
    ],
    teacherChecklist: ["Lâmı okunan ve okunmayan kelimeleri doğru okuyor."],
    allowedFeatures: F10, sources: [{ id: "K1", locator: "s.23" }],
  },
  {
    id: "u10-l2", unitId: "u10", order: 2, title: "Râ harfi",
    goal: "Harekeli râ harfinin kalın veya ince okunduğunu belirler.",
    explanation: [
      "Râ harfi harekesine ve konumuna göre kalın veya ince okunur.",
      "Bu derste yalnızca harekeli râ çalışılır: üstünlü ve ötreli râ kalın, esreli râ ince okunur.",
      "Cezmli râ ve durma sırasındaki râ ayrı kurallara bağlıdır; öğretmeninizle çalışın.",
    ],
    examples: [
      { arabic: "رَبِّ", note: "Kalın: râ üstünlü." },
      { arabic: "رُسُلُ", note: "Kalın: râ ötreli." },
      { arabic: "رِجَالٌ", note: "İnce: râ esreli." },
    ],
    objectives: [
      { id: "u10-l2-o1", text: "Harekeli râ harfinin kalın/ince okunuşunu nedeniyle seçer.", assessedBy: "game" },
      { id: "u10-l2-o2", text: "Râ harfini kalın ve ince doğru okur.", assessedBy: "teacher" },
    ],
    teacherChecklist: ["Harekeli râyı doğru okuyor.", "Cezmli râ örneklerini öğretmenle çalıştı."],
    allowedFeatures: F10, sources: [{ id: "K1", locator: "s.23" }, { id: "K2", locator: "Ders 16" }],
  },

  // ───────────── Ünite 11 ─────────────
  {
    id: "u11-l1", unitId: "u11", order: 1, title: "Duruş (vakf) ve tenvinli geçiş",
    goal: "Kelime sonunda dururken harekenin nasıl değiştiğini ve tenvinli kelimeden geçişi bilir.",
    explanation: [
      "Kur'an okurken âyet sonlarında veya nefes bittiğinde usulüne uygun durmaya vakf denir.",
      "Durulan kelimenin son harekesi üstün, esre, ötre, iki esre veya iki ötre ise hareke cezme dönüşür: ⟪كِتَابٌ⟫ → ⟪كِتَابْ⟫. Son harf şeddeli ise de cezmle durulur, harf kısa bir süre tutulur.",
      "Tenvinli kelimeden sonra cezmli veya şeddeli harfle başlayan bir kelime gelirse tenvin kendi harekesine döner ve araya esreli nun ⟪نِ⟫ eklenir: ⟪اَحَدٌ اللّٰهُ⟫ → ⟪اَحَدُنِ اللّٰهُ⟫.",
    ],
    examples: [
      { arabic: "كِتَابٌ  كِتَابْ", note: "Durunca iki ötre cezme döner." },
      { arabic: "عَظٖيمٍ  عَظٖيمْ", note: "Durunca iki esre cezme döner." },
      { arabic: "اَحَدُنِ اللّٰهُ", note: "Geçişte araya nun eklenir." },
    ],
    objectives: [
      { id: "u11-l1-o1", text: "Durulan kelimenin son harfinin okunuşunu seçer.", assessedBy: "game" },
      { id: "u11-l1-o2", text: "Tenvinli geçişte eklenen sesi ve doğru birleşik okunuşu seçer.", assessedBy: "game" },
      { id: "u11-l1-o3", text: "Âyet sonlarında usulüne uygun durur.", assessedBy: "teacher" },
    ],
    teacherChecklist: ["Âyet sonunda doğru duruyor.", "Tenvinli geçişi doğru yapıyor."],
    notes: [
      "İki üstünle biten kelimelerde durma ve yuvarlak te (ة) ile biten kelimeler bu sürümde sorulmuyor; öğretmeninizle çalışın.",
      "Geçiş örnekleri kural örneğidir; âyet olarak sunulmamıştır.",
    ],
    allowedFeatures: F11, sources: [{ id: "K2", locator: "Ders 15, Ders 29" }],
  },

  // ───────────── Ünite 12 ─────────────
  {
    id: "u12-l1", unitId: "u12", order: 1, title: "Genel tekrar ve yüzüne okuma",
    goal: "Öğrenilen bütün kuralları karışık sorularda uygular; öğretmenle kısa sûreleri yüzüne okumaya hazırlanır.",
    explanation: [
      "Bu oyun önceki derslerden karışık sorular içerir.",
      "Oyunu bitirmek tek başına Kur'an okumayı öğrenmek demek değildir. Öğretmen her öğrenciyi dinleyerek harfleri, harekeleri ve birleşik okumayı değerlendirir.",
      "Aşağıdaki kısa sûreleri öğrencinin kendi mushafından, öğretmenin yanında okuması önerilir.",
    ],
    examples: [],
    objectives: [
      { id: "u12-l1-o1", text: "Önceki derslerin kurallarını karışık sorularda uygular.", assessedBy: "game" },
      { id: "u12-l1-o2", text: "Kısa sûreleri öğretmenin yanında yüzüne okur.", assessedBy: "teacher" },
    ],
    teacherChecklist: [
      "Harfleri doğru sesle okuyor.",
      "Harekeleri, cezmi ve şeddeyi doğru uyguluyor.",
      "Med ve tenvini doğru uyguluyor.",
      "Kelimeleri birleştirerek akıcı okuyor.",
      "Kısa sûreleri mushaftan yüzüne okuyor.",
    ],
    allowedFeatures: F11, sources: [{ id: "K1", locator: "s.24–25" }, { id: "K2", locator: "Ders 30" }, { id: "K4" }],
  },
];

export const LESSON_BY_ID = new Map(LESSONS.map((l) => [l.id, l]));
export const UNIT_BY_ID = new Map(UNITS.map((u) => [u.id, u]));

export function lessonsOfUnit(unitId: string): Lesson[] {
  return LESSONS.filter((l) => l.unitId === unitId).sort((a, b) => a.order - b.order);
}

/** Ders sırası (ünite, ders). */
export const LESSON_ORDER = [...LESSONS].sort((a, b) => {
  const ua = UNIT_BY_ID.get(a.unitId)!.order;
  const ub = UNIT_BY_ID.get(b.unitId)!.order;
  return ua - ub || a.order - b.order;
});

export const SOURCE_TITLES: Record<string, string> = {
  K1: "Diyanet İşleri Başkanlığı, Elifbâ – Kur'an Öğreniyorum, 4. baskı, Nisan 2025",
  K2: "Diyanet Kur'an Platformu, Elif-Ba modülü (kuran.diyanet.gov.tr/elifba)",
  K4: "Tanzil Project, Quran Text (Simple) v1.1, tanzil.net",
  app: "Uygulama kuralı (kaynaktaki kurala dayanarak üretildi)",
};
