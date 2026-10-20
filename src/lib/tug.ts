// Halat çekme oyunu durum makinesi. Saf fonksiyonlardan oluşur; zaman (now) dışarıdan verilir.
// - İki takım kendi sorularını bağımsız çözer; doğru cevap halatı o takıma bir adım çeker.
// - Sorular sınırsızdır: dersin soru havuzu bitince yeniden karıştırılır (önce her harf bir kez).
// - Yanlış cevapta takım 5 saniye bekler; sonra soru kendiliğinden geçer. Doğruda da kendiliğinden geçer.
// - Halatın ortasındaki bayrağı kendi çizgisine ilk çeken takım kazanır.
import { roundOrder, SIDES, type QueueItem, type QuestionLite, type Side } from "./game.ts";
import { hashSeed, mulberry32, shuffle } from "./rng.ts";

export interface TugSettings {
  /** Kazanmak için gereken net çekiş sayısı (bayrağın çizgiye uzaklığı). */
  target: number;
  /** Yanlış cevaptan sonra bekleme (ms). */
  wrongLockMs: number;
  /** Doğru cevaptan sonra otomatik geçiş (ms). */
  correctFeedbackMs: number;
  /** Soru göründükten sonra dokunuşların yok sayıldığı süre (ms). */
  inputGuardMs: number;
}

export const TUG_DEFAULTS: TugSettings = { target: 7, wrongLockMs: 5000, correctFeedbackMs: 900, inputGuardMs: 400 };

export type TugPhase = "loading" | "question" | "feedback" | "finished";

export interface TugTeam {
  side: Side;
  deck: QueueItem[];
  index: number;
  /** Kaçıncı karıştırma turunda (deste) olunduğu. */
  cycle: number;
  phase: TugPhase;
  lastAnswer: { questionId: string; optionId: string; correct: boolean } | null;
  continueAt: number;
  inputOpensAt: number;
  correct: number;
  wrong: number;
}

export interface TugState {
  id: string;
  lessonId: string;
  seed: string;
  /** Halatın konumu: eksi = sol takıma doğru, artı = sağ takıma doğru. */
  rope: number;
  settings: TugSettings;
  paused: boolean;
  pausedAt: number | null;
  winner: Side | null;
  teams: Record<Side, TugTeam>;
}

export type TugAction =
  | { type: "QUESTION_VISIBLE"; side: Side; now: number }
  | { type: "ANSWER"; side: Side; questionId: string; optionId: string; now: number }
  | { type: "NEXT"; side: Side; now: number }
  | { type: "PAUSE"; now: number }
  | { type: "RESUME"; now: number };

export interface TugContext {
  pool: QuestionLite[];
  lookup: (id: string) => QuestionLite | undefined;
}

const keyOf = (q: QuestionLite | undefined, id: string) => q?.stimulus ?? id;

/** Bir deste kurar: havuz tur tur karışık sıralanır; destenin ilk sorusu bir önceki destenin son harfi olmaz. */
export function makeDeck(pool: QuestionLite[], seed: string, side: Side, cycle: number, avoidKey?: string): QueueItem[] {
  const rand = mulberry32(hashSeed(`${seed}:tug:${side}:${cycle}`));
  const order = roundOrder(pool, rand, false);
  if (avoidKey !== undefined && order.length > 1 && keyOf(order[0], order[0].id) === avoidKey) {
    const j = order.findIndex((q, i) => i > 0 && keyOf(q, q.id) !== avoidKey);
    if (j > 0) [order[0], order[j]] = [order[j], order[0]];
  }
  return order.map((q) => ({ questionId: q.id, optionOrder: shuffle(q.optionIds, rand) }));
}

export function createTug(args: { lessonId: string; seed: string; pool: QuestionLite[]; settings?: Partial<TugSettings> }): TugState {
  if (args.pool.length === 0) throw new Error("Halat çekme için soru havuzu boş");
  const team = (side: Side): TugTeam => ({
    side,
    deck: makeDeck(args.pool, args.seed, side, 0),
    index: 0,
    cycle: 0,
    phase: "loading",
    lastAnswer: null,
    continueAt: 0,
    inputOpensAt: 0,
    correct: 0,
    wrong: 0,
  });
  return {
    id: `tug-${args.lessonId}-${args.seed}`,
    lessonId: args.lessonId,
    seed: args.seed,
    rope: 0,
    settings: { ...TUG_DEFAULTS, ...args.settings },
    paused: false,
    pausedAt: null,
    winner: null,
    teams: { left: team("left"), right: team("right") },
  };
}

export function currentTugItem(t: TugTeam): QueueItem | undefined {
  return t.deck[t.index];
}

const withTeam = (s: TugState, side: Side, t: TugTeam): TugState => ({ ...s, teams: { ...s.teams, [side]: t } });

export function reduceTug(s: TugState, a: TugAction, ctx: TugContext): TugState {
  switch (a.type) {
    case "QUESTION_VISIBLE": {
      const t = s.teams[a.side];
      if (t.phase !== "loading" || s.winner) return s;
      return withTeam(s, a.side, { ...t, phase: "question", inputOpensAt: a.now + s.settings.inputGuardMs });
    }
    case "ANSWER": {
      const t = s.teams[a.side];
      const item = currentTugItem(t);
      if (s.paused || s.winner || t.phase !== "question" || !item || item.questionId !== a.questionId) return s;
      if (a.now < t.inputOpensAt || !item.optionOrder.includes(a.optionId)) return s;
      const q = ctx.lookup(a.questionId);
      if (!q) return s;
      const correct = a.optionId === q.correctOptionId;
      const rope = correct ? s.rope + (a.side === "left" ? -1 : 1) : s.rope;
      const winner: Side | null = rope <= -s.settings.target ? "left" : rope >= s.settings.target ? "right" : null;
      const updated: TugTeam = {
        ...t,
        phase: winner ? "finished" : "feedback",
        lastAnswer: { questionId: q.id, optionId: a.optionId, correct },
        continueAt: a.now + (correct ? s.settings.correctFeedbackMs : s.settings.wrongLockMs),
        correct: t.correct + (correct ? 1 : 0),
        wrong: t.wrong + (correct ? 0 : 1),
      };
      let next = withTeam({ ...s, rope, winner }, a.side, updated);
      if (winner) {
        const other: Side = a.side === "left" ? "right" : "left";
        next = withTeam(next, other, { ...next.teams[other], phase: "finished" });
      }
      return next;
    }
    case "NEXT": {
      const t = s.teams[a.side];
      if (s.paused || s.winner || t.phase !== "feedback" || a.now < t.continueAt) return s;
      let { index, cycle, deck } = t;
      index += 1;
      if (index >= deck.length) {
        const lastId = deck[deck.length - 1]?.questionId;
        const lastKey = lastId ? keyOf(ctx.lookup(lastId), lastId) : undefined;
        cycle += 1;
        deck = makeDeck(ctx.pool, s.seed, a.side, cycle, lastKey);
        index = 0;
      }
      return withTeam(s, a.side, { ...t, deck, index, cycle, phase: "loading", lastAnswer: null });
    }
    case "PAUSE": {
      if (s.paused || s.winner) return s;
      return { ...s, paused: true, pausedAt: a.now };
    }
    case "RESUME": {
      if (!s.paused) return s;
      const pausedFor = s.pausedAt !== null ? Math.max(0, a.now - s.pausedAt) : 0;
      const teams = { ...s.teams };
      for (const side of SIDES) {
        const t = teams[side];
        if (t.phase === "question") teams[side] = { ...t, inputOpensAt: a.now + s.settings.inputGuardMs };
        else if (t.phase === "feedback") teams[side] = { ...t, continueAt: t.continueAt + pausedFor };
      }
      return { ...s, paused: false, pausedAt: null, teams };
    }
  }
}

/** Kaydetmeye uygun anlık görüntü: kalan bekleme süreleri saklanır, oyun duraklatılmış kaydedilir. */
export function snapshotTug(s: TugState, now: number): TugState {
  const teams = { ...s.teams };
  for (const side of SIDES) {
    const t = teams[side];
    // continueAt, "şimdiden kalan süre" olarak saklanır; yüklemede yeni saat tabanına eklenir.
    teams[side] = { ...t, continueAt: t.phase === "feedback" ? Math.max(0, t.continueAt - (s.paused && s.pausedAt !== null ? s.pausedAt : now)) : 0, inputOpensAt: 0 };
  }
  return { ...s, paused: !s.winner, pausedAt: 0, teams };
}

export function restoreTug(s: TugState, now: number): TugState {
  const teams = { ...s.teams };
  for (const side of SIDES) {
    const t = teams[side];
    teams[side] = {
      ...t,
      phase: t.phase === "question" ? "loading" : t.phase,
      continueAt: t.phase === "feedback" ? now + t.continueAt : 0,
      inputOpensAt: now,
    };
  }
  return { ...s, paused: !s.winner, pausedAt: s.winner ? null : now, teams };
}
