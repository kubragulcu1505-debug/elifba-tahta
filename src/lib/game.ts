// İki takımlı yarışma durum makinesi. Saf fonksiyonlardan oluşur; zaman (now) dışarıdan verilir.
// Süre yalnızca soru ekranda görünürken ve oyun duraklatılmamışken işler.
// Soru yüklenmesi, geri bildirim ekranı ve duraklama süreleri sayılmaz. İki takım için aynı kural uygulanır.
import { hashSeed, mulberry32, shuffle } from "./rng.ts";

export type Side = "left" | "right";
export const SIDES: Side[] = ["left", "right"];
export type GameMode = "competition" | "review";

export interface QuestionLite {
  id: string;
  objectiveId: string;
  correctOptionId: string;
  optionIds: string[];
  difficulty: 1 | 2 | 3;
  /** Ekrandaki Arapça uyaran; aynı uyaranın arka arkaya gelmemesi için kullanılır. */
  stimulus?: string;
}

export interface AnswerRecord {
  questionId: string;
  objectiveId: string;
  optionId: string;
  correct: boolean;
  timeMs: number;
}

export type TeamPhase = "loading" | "question" | "feedback" | "finished";

export interface QueueItem {
  questionId: string;
  optionOrder: string[];
}

export interface TeamState {
  side: Side;
  queue: QueueItem[];
  index: number;
  phase: TeamPhase;
  /** Saat bu andan beri işliyor (yalnızca phase=question ve duraklatılmamışken). */
  runningSince: number | null;
  /** Mevcut soru için önceden biriken süre (duraklama öncesi). */
  elapsedCurrent: number;
  totalMs: number;
  answers: AnswerRecord[];
  correctCount: number;
  score: number;
  lastAnswer: { questionId: string; optionId: string; correct: boolean } | null;
  /** Bu andan önce cevap kabul edilmez (çift dokunma / taşan dokunuş koruması). */
  inputOpensAt: number;
  /** Geri bildirimden sonra devam etmeye en erken izin verilen an. */
  continueAt: number;
  finishedAt: number | null;
}

export interface GameSettings {
  pointsCorrect: number;
  pointsWrong: number;
  /** Soru göründükten sonra dokunuşların yok sayıldığı süre (ms). */
  inputGuardMs: number;
  /** Doğru cevaptan sonra otomatik geçiş süresi (ms). */
  correctFeedbackMs: number;
  /** Yanlış cevaptan sonra "Devam" düğmesinin açılma süresi (ms). */
  wrongFeedbackMs: number;
}

export const DEFAULT_SETTINGS: GameSettings = {
  pointsCorrect: 10,
  pointsWrong: 0,
  inputGuardMs: 450,
  correctFeedbackMs: 1300,
  wrongFeedbackMs: 2500,
};

/** Bireysel düelloda bir tarafı oynayan öğrenci. */
export interface DuelPlayer {
  id: string;
  name: string;
}

export interface GameState {
  id: string;
  lessonId: string;
  mode: GameMode;
  /** Bireysel düelloda iki öğrenci; takım oyununda yoktur. */
  players?: Record<Side, DuelPlayer>;
  seed: string;
  questionIds: string[];
  createdAtEpoch: number;
  paused: boolean;
  pausedAt: number | null;
  settings: GameSettings;
  teams: Record<Side, TeamState>;
}

export type GameAction =
  | { type: "QUESTION_VISIBLE"; side: Side; now: number }
  | { type: "ANSWER"; side: Side; questionId: string; optionId: string; now: number }
  | { type: "NEXT"; side: Side; now: number }
  | { type: "PAUSE"; now: number }
  | { type: "RESUME"; now: number };

function bandOrder(qs: QuestionLite[], rand: () => number, banded: boolean): QuestionLite[] {
  if (!banded) return shuffle(qs, rand);
  const out: QuestionLite[] = [];
  for (const d of [1, 2, 3] as const) out.push(...shuffle(qs.filter((q) => q.difficulty === d), rand));
  return out;
}

/**
 * Tur tabanlı sıra (öğretmen isteği): önce dersteki her harf/hece bir kez, karışık sırayla sorulur;
 * hepsi bitince tekrar turu başlar. Bir harfin ilk sorusu en kolay olanıdır; zorluk turlar ilerledikçe artar.
 * Tekrar olan derslerde tur içi sıra tamamen karışıktır (hep aynı harfle başlamasın diye).
 * Tekrar olmayan derslerde tek tur vardır ve yarışmada kolaydan zora sıralanır.
 * Tur geçişinde aynı uyaran arka arkaya gelmez.
 */
export function roundOrder(qs: QuestionLite[], rand: () => number, banded: boolean): QuestionLite[] {
  const key = (q: QuestionLite) => q.stimulus ?? q.id;
  const groups = new Map<string, QuestionLite[]>();
  for (const q of shuffle(qs, rand)) {
    if (!groups.has(key(q))) groups.set(key(q), []);
    groups.get(key(q))!.push(q);
  }
  const lists = [...groups.values()].map((g) => [...g].sort((a, b) => a.difficulty - b.difficulty));
  const hasRepeats = lists.some((g) => g.length > 1);
  const out: QuestionLite[] = [];
  for (let r = 0; ; r++) {
    const round = lists.map((g) => g[r]).filter((q): q is QuestionLite => !!q);
    if (round.length === 0) break;
    const ordered = bandOrder(round, rand, banded && !hasRepeats);
    const prev = out[out.length - 1];
    if (prev && ordered.length > 1 && key(ordered[0]) === key(prev)) {
      // Tur başındaki soru bir önceki turun sonuyla aynı harfse, onu turdaki başka bir soruyla değiştir.
      const j = ordered.findIndex((q, i) => i > 0 && key(q) !== key(prev));
      if (j > 0) [ordered[0], ordered[j]] = [ordered[j], ordered[0]];
    }
    out.push(...ordered);
  }
  return out;
}

/**
 * Aynı uyaranın (ör. aynı harf) arka arkaya gelmesini önler. Önce aynı zorluktaki,
 * sonra herhangi bir sonraki soruyla yer değiştirir. Mümkün değilse sıra olduğu gibi kalır.
 */
export function spreadSameStimulus(list: QuestionLite[]): QuestionLite[] {
  const a = [...list];
  const key = (q: QuestionLite) => q.stimulus ?? q.id;
  for (let i = 1; i < a.length; i++) {
    if (key(a[i]) !== key(a[i - 1])) continue;
    const ok = (j: number) => key(a[j]) !== key(a[i - 1]) && (j + 1 >= a.length || key(a[j + 1]) !== key(a[i])) && (j - 1 < 0 || j - 1 === i || key(a[j - 1]) !== key(a[i]));
    let j = -1;
    for (let k = i + 1; k < a.length; k++) if (a[k].difficulty === a[i].difficulty && ok(k)) { j = k; break; }
    if (j < 0) for (let k = i + 1; k < a.length; k++) if (ok(k)) { j = k; break; }
    if (j < 0) for (let k = 0; k < i - 1; k++) if (key(a[k]) !== key(a[i]) && (k === 0 || key(a[k - 1]) !== key(a[i])) && key(a[k + 1]) !== key(a[i]) && key(a[k]) !== key(a[i - 1]) && (i + 1 >= a.length || key(a[i + 1]) !== key(a[k]))) { j = k; break; }
    if (j >= 0) [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sameOrder(a: QueueItem[], b: QueueItem[]) {
  return a.length === b.length && a.every((x, i) => x.questionId === b[i].questionId);
}

function emptyTeam(side: Side, queue: QueueItem[]): TeamState {
  return {
    side,
    queue,
    index: 0,
    phase: queue.length === 0 ? "finished" : "loading",
    runningSince: null,
    elapsedCurrent: 0,
    totalMs: 0,
    answers: [],
    correctCount: 0,
    score: 0,
    lastAnswer: null,
    inputOpensAt: 0,
    continueAt: 0,
    finishedAt: queue.length === 0 ? 0 : null,
  };
}

/**
 * Yeni oyun. Ortak soru kümesi bir kez belirlenir; her takım için sıra ve şık sırası bağımsız karıştırılır.
 * Yarışmada sıra zorluk bantlarına göre (kolay → zor) kurulur, bant içinde bağımsız karışır.
 * review modunda her takım kendi soru listesini (ör. kendi yanlışları) alabilir.
 */
export function createGame(args: {
  lessonId: string;
  mode: GameMode;
  seed: string;
  questions: QuestionLite[];
  /** review modunda takım başına farklı soru listesi. */
  perTeam?: Partial<Record<Side, QuestionLite[]>>;
  settings?: Partial<GameSettings>;
  nowEpoch?: number;
  players?: Record<Side, DuelPlayer>;
}): GameState {
  const settings = { ...DEFAULT_SETTINGS, ...args.settings };
  const queues = {} as Record<Side, QueueItem[]>;
  const build = (side: Side, salt: string): QueueItem[] => {
    const rand = mulberry32(hashSeed(args.seed + ":" + side + salt));
    const list = args.perTeam?.[side] ?? args.questions;
    return roundOrder(list, rand, args.mode === "competition").map((q) => ({
      questionId: q.id,
      optionOrder: shuffle(q.optionIds, rand),
    }));
  };
  for (const side of SIDES) queues[side] = build(side, "");
  // İki takım tesadüfen aynı sırayı alırsa sağ tarafı yeniden karıştır.
  for (let k = 1; !args.perTeam && queues.left.length > 1 && sameOrder(queues.left, queues.right) && k <= 20; k++) {
    queues.right = build("right", ":" + k);
  }
  const ids = args.questions.map((q) => q.id);
  return {
    id: `${args.lessonId}-${args.seed}`,
    lessonId: args.lessonId,
    mode: args.mode,
    ...(args.players ? { players: args.players } : {}),
    seed: args.seed,
    questionIds: ids,
    createdAtEpoch: args.nowEpoch ?? 0,
    paused: false,
    pausedAt: null,
    settings,
    teams: { left: emptyTeam("left", queues.left), right: emptyTeam("right", queues.right) },
  };
}

export function currentItem(t: TeamState): QueueItem | undefined {
  return t.queue[t.index];
}

/** Ekranda görünen canlı süre (ms). */
export function liveTotalMs(t: TeamState, now: number): number {
  const running = t.runningSince !== null ? now - t.runningSince : 0;
  return t.totalMs + (t.phase === "question" ? t.elapsedCurrent + running : 0);
}

function withTeam(s: GameState, side: Side, t: TeamState): GameState {
  return { ...s, teams: { ...s.teams, [side]: t } };
}

export function reduce(s: GameState, a: GameAction, lookup: (id: string) => QuestionLite | undefined): GameState {
  switch (a.type) {
    case "QUESTION_VISIBLE": {
      const t = s.teams[a.side];
      if (t.phase !== "loading") return s;
      return withTeam(s, a.side, {
        ...t,
        phase: "question",
        runningSince: s.paused ? null : a.now,
        inputOpensAt: a.now + s.settings.inputGuardMs,
      });
    }
    case "ANSWER": {
      const t = s.teams[a.side];
      const item = currentItem(t);
      // Kilitler: yalnızca soru aşamasında, doğru soru için, duraklatılmamışken ve koruma süresinden sonra.
      if (s.paused || t.phase !== "question" || !item || item.questionId !== a.questionId) return s;
      if (a.now < t.inputOpensAt || t.runningSince === null) return s;
      if (!item.optionOrder.includes(a.optionId)) return s;
      const q = lookup(a.questionId);
      if (!q) return s;
      const timeMs = Math.max(0, t.elapsedCurrent + (a.now - t.runningSince));
      const correct = a.optionId === q.correctOptionId;
      const competition = s.mode === "competition";
      return withTeam(s, a.side, {
        ...t,
        phase: "feedback",
        runningSince: null,
        elapsedCurrent: 0,
        totalMs: competition ? t.totalMs + timeMs : t.totalMs,
        answers: [...t.answers, { questionId: q.id, objectiveId: q.objectiveId, optionId: a.optionId, correct, timeMs }],
        correctCount: t.correctCount + (correct && competition ? 1 : 0),
        score: t.score + (competition ? (correct ? s.settings.pointsCorrect : s.settings.pointsWrong) : 0),
        lastAnswer: { questionId: q.id, optionId: a.optionId, correct },
        continueAt: a.now + (correct ? s.settings.correctFeedbackMs : s.settings.wrongFeedbackMs),
      });
    }
    case "NEXT": {
      const t = s.teams[a.side];
      if (s.paused || t.phase !== "feedback" || a.now < t.continueAt) return s;
      const index = t.index + 1;
      const done = index >= t.queue.length;
      return withTeam(s, a.side, {
        ...t,
        index,
        phase: done ? "finished" : "loading",
        lastAnswer: null,
        runningSince: null,
        elapsedCurrent: 0,
        finishedAt: done ? a.now : null,
      });
    }
    case "PAUSE": {
      if (s.paused) return s;
      const teams = { ...s.teams };
      for (const side of SIDES) {
        const t = teams[side];
        if (t.phase === "question" && t.runningSince !== null) {
          teams[side] = { ...t, elapsedCurrent: t.elapsedCurrent + (a.now - t.runningSince), runningSince: null };
        }
      }
      return { ...s, paused: true, pausedAt: a.now, teams };
    }
    case "RESUME": {
      if (!s.paused) return s;
      const pausedFor = s.pausedAt !== null ? Math.max(0, a.now - s.pausedAt) : 0;
      const teams = { ...s.teams };
      for (const side of SIDES) {
        const t = teams[side];
        if (t.phase === "question") {
          teams[side] = { ...t, runningSince: a.now, inputOpensAt: a.now + s.settings.inputGuardMs };
        } else if (t.phase === "feedback") {
          teams[side] = { ...t, continueAt: t.continueAt + pausedFor };
        }
      }
      return { ...s, paused: false, pausedAt: null, teams };
    }
  }
}

/**
 * Kaydetmeye uygun anlık görüntü: işleyen saatler dondurulur ve oyun duraklatılmış olarak kaydedilir.
 * Sayfa yenilendiğinde performance.now sıfırlandığı için zamanlar sıfıra göre yeniden kurulur.
 */
export function snapshotForSave(s: GameState, now: number): GameState {
  const paused = reduce(s, { type: "PAUSE", now }, () => undefined);
  const teams = { ...paused.teams };
  for (const side of SIDES) {
    const t = teams[side];
    teams[side] = {
      ...t,
      // Yüklenirken soru yeniden "görünür" olacak; geri bildirimdeki takım devam düğmesine hemen basabilir.
      inputOpensAt: 0,
      continueAt: t.phase === "feedback" ? 0 : t.continueAt,
      finishedAt: t.finishedAt === null ? null : 0,
    };
  }
  return { ...paused, pausedAt: 0, teams };
}

/** Kayıttan yüklenen oyunu yeni saat tabanına taşır (yüklemede her zaman duraklatılmış başlar). */
export function restoreFromSave(s: GameState, now: number): GameState {
  const teams = { ...s.teams };
  for (const side of SIDES) {
    const t = teams[side];
    teams[side] = {
      ...t,
      runningSince: null,
      phase: t.phase === "question" ? "loading" : t.phase,
      inputOpensAt: now,
      continueAt: t.phase === "feedback" ? now : t.continueAt,
    };
  }
  return { ...s, paused: true, pausedAt: now, teams };
}

export interface TeamResult {
  side: Side;
  correct: number;
  wrong: number;
  answered: number;
  total: number;
  score: number;
  totalMs: number;
  finished: boolean;
  wrongQuestionIds: string[];
}

export interface GameResult {
  teams: Record<Side, TeamResult>;
  /** Kazanan; berabere ise "tie"; oyun bitmediyse null. */
  winner: Side | "tie" | null;
  /** Kazananın nasıl belirlendiği. */
  decidedBy: "correct" | "time" | "tie" | null;
}

export function teamResult(t: TeamState): TeamResult {
  const wrong = t.answers.filter((x) => !x.correct);
  return {
    side: t.side,
    correct: t.correctCount,
    wrong: wrong.length,
    answered: t.answers.length,
    total: t.queue.length,
    score: t.score,
    totalMs: t.totalMs,
    finished: t.phase === "finished",
    wrongQuestionIds: wrong.map((x) => x.questionId),
  };
}

/** Kazanan: önce doğru sayısı; eşitse toplam tamamlama süresi kısa olan. */
export function computeResult(s: GameState): GameResult {
  const L = teamResult(s.teams.left);
  const R = teamResult(s.teams.right);
  const teams = { left: L, right: R };
  if (s.mode !== "competition" || !L.finished || !R.finished) return { teams, winner: null, decidedBy: null };
  if (L.correct !== R.correct) return { teams, winner: L.correct > R.correct ? "left" : "right", decidedBy: "correct" };
  if (L.totalMs !== R.totalMs) return { teams, winner: L.totalMs < R.totalMs ? "left" : "right", decidedBy: "time" };
  return { teams, winner: "tie", decidedBy: "tie" };
}

/** Kazanım bazında yanlış sayıları (takım puanından öğrenci düzeyi çıkarılmaz; yalnızca sınıf/ders düzeyi). */
export function objectiveStats(t: TeamState): Record<string, { correct: number; wrong: number }> {
  const out: Record<string, { correct: number; wrong: number }> = {};
  for (const a of t.answers) {
    out[a.objectiveId] ??= { correct: 0, wrong: 0 };
    if (a.correct) out[a.objectiveId].correct++;
    else out[a.objectiveId].wrong++;
  }
  return out;
}

export function formatMs(ms: number): string {
  const total = Math.max(0, Math.round(ms / 100) / 10);
  const m = Math.floor(total / 60);
  const sec = total - m * 60;
  return `${m}:${sec.toFixed(1).padStart(4, "0")}`;
}
