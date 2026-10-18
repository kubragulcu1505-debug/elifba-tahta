// İçerik veri tipleri. Bu dosya arayüzden bağımsızdır; Node test çalıştırıcısı da doğrudan okur.

export type Difficulty = 1 | 2 | 3;

/** Soru/etkinlik türleri (kazanıma göre). */
export type QuestionType =
  | "find-letter-by-name" // Adı verilen harfi bul (hedef harfi bul)
  | "name-of-letter" // Harfin adını seç
  | "similar-letter" // Benzer harfler arasından aynısını bul
  | "dots" // Noktaların sayısına ve yerine göre ayırt et
  | "letter-order" // Elifba sırası
  | "letter-form" // Harfin farklı yazılışını eşleştir
  | "form-to-letter" // Yazılış biçiminden harfi bul
  | "joining" // Bağlanan / bağlanmayan harfler
  | "letter-in-word" // Kelimedeki harfi bul
  | "spell-to-shape" // Heceleme → doğru hece (harekeli harfleri karşılaştır)
  | "shape-to-spell" // Hece → heceleme
  | "identify-hareke" // Verilen harekeyi tanı
  | "word-spelling" // Kelimenin hecelenişini seç
  | "spelling-to-word" // Hecelenişi verilen kelimeyi seç
  | "mark-count" // Kelimedeki işaret sayısı
  | "which-letter-has-mark" // Hangi harfte işaret var
  | "shadda-split" // Şeddeli yapının okunuşu
  | "madd-detect" // Uzatma olan örneği ayırt et
  | "madd-letter" // Med harfini bul
  | "mark-meaning" // İşaretin anlamı (uzatma miktarı vb.)
  | "rule-judgement" // Zamir, lafzatullah, elif-lâm, râ, vakf yargısı
  | "rule-compare" // Kurala uyan örneği seç
  | "transition" // Tenvinli geçiş
  | "audio-choice"; // Dinlediğini seç (yalnızca onaylı kayıt varsa, alıştırma modunda)

export type OptionKind = "arabic" | "text";

export interface QuestionOption {
  id: string;
  label: string;
  kind: OptionKind;
}

export type ReviewStatus =
  /** Kural tabanlı üretildi, otomatik denetimlerden geçti, insan incelemesi yapılmadı. */
  | "auto-validated"
  /** Elle yazılmış Arapça kelime/kural yargısı içerir; öğretmen/uzman incelemesi gerekli. */
  | "needs-teacher-review"
  /** Doğrulanmış kaynaktan değiştirilmeden alındı (ör. Tanzil). */
  | "verified-source";

export type SourceId = "K1" | "K2" | "K4" | "app";

export interface SourceRef {
  id: SourceId;
  /** Sayfa veya bölüm. Örn. "s.6" ya da "Harfler > Pekiştirme". */
  locator?: string;
}

export interface Question {
  id: string;
  lessonId: string;
  objectiveId: string;
  type: QuestionType;
  /** Türkçe yönerge. Arapça parçalar ⟪ ⟫ içinde yazılır. */
  prompt: string;
  /** Büyük gösterilecek Arapça uyaran (harf, hece, kelime). */
  stimulus?: string;
  options: QuestionOption[];
  correctOptionId: string;
  /** Kısa öğretici açıklama. Arapça parçalar ⟪ ⟫ içinde. */
  explanation: string;
  difficulty: Difficulty;
  source: SourceRef;
  audioId?: string;
  reviewStatus: ReviewStatus;
}

/** Bir dersin içerdiği Arapça yazım özellikleri. Henüz öğretilmemiş özellik soruya giremez. */
export type Feature =
  | "letters"
  | "tatweel"
  | "lamAlif"
  | "fatha"
  | "kasra"
  | "damma"
  | "sukun"
  | "shadda"
  | "madd"
  | "dikeyKesra"
  | "asar"
  | "maddah"
  | "hamza"
  | "tanween"
  | "zamir"
  | "lafzatullah"
  | "elifLam"
  | "wasla";

export interface Objective {
  id: string;
  text: string;
  /** "game": oyunla ölçülür; "teacher": öğretmen dinleyerek değerlendirir. */
  assessedBy: "game" | "teacher";
}

export interface GuidedExample {
  arabic: string;
  /** Türkçe açıklama (⟪ ⟫ içinde Arapça olabilir). */
  note: string;
}

export interface Lesson {
  id: string;
  unitId: string;
  order: number;
  title: string;
  /** Somut öğrenme hedefi. */
  goal: string;
  /** Kısa anlatım paragrafları (⟪ ⟫ ile Arapça). */
  explanation: string[];
  examples: GuidedExample[];
  objectives: Objective[];
  /** Öğretmenin dinleyerek değerlendireceği maddeler. */
  teacherChecklist: string[];
  /** Bu derste kullanılabilecek yazım özellikleri (önceki dersler dahil). */
  allowedFeatures: Feature[];
  sources: SourceRef[];
  /** Ek uyarılar (ör. fontta gösterilemeyen işaretler). */
  notes?: string[];
}

export interface Unit {
  id: string;
  order: number;
  title: string;
  summary: string;
  sources: SourceRef[];
}

export interface AudioItem {
  id: string;
  /** Ne kaydedilmeli (Arapça). */
  arabic: string;
  /** Öğretmen için açıklama. */
  label: string;
  lessonId: string;
}
