// Penaltı oyunu durum makinesi. Saf fonksiyonlardan oluşur; zaman (now) dışarıdan verilir.
// - İki tarafa AYNI soru gelir (şık sırası taraf başına karışıktır). İlk cevap veren belirleyicidir:
//   cevabı doğruysa penaltıyı o kullanır, yanlışsa penaltı karşı tarafa geçer.
// - Penaltıyı kullanan, topu kaleye doğru kaydırır: yön köşeyi (sol/orta/sağ), uzunluk yüksekliği seçer.
//   Çok yana kaydırılan top auta, fazla sert vurulan top üstten dışarı gider.
// - Kaleci otomatik atlar (sol/orta/sağ); topla aynı tarafa atlarsa kurtarır.
// - Kimse süre içinde cevap vermezse soru geçer. Yanlış cevap veren bir sonraki soruda 1 saniye geç başlar.
// - Önce `target` gol atan kazanır.
// Dart oyunu da aynı makineyi kullanır (kind: "dart"): atış sırası gelen öğrencinin tahtasında bir çizgi
// gidip gelir; "DUR" dediği anda ok çizginin olduğu yere saplanır. Kırmızı merkez 10 puandır, merkezden
// uzaklaştıkça puan azalır. Önce `target` puana ulaşan kazanır.
import { roundOrder, SIDES, type DuelPlayer, type QuestionLite, type Side } from "./game.ts";
import { hashSeed, mulberry32, shuffle } from "./rng.ts";

export interface PenaltySettings {
  /** Kazanmak için gereken gol. */
  target: number;
  /** Soruyu cevaplamak için süre (ms). */
  answerMs: number;
  /** Penaltıyı vurmak için süre (ms); dolunca zayıf bir vuruş kendiliğinden yapılır. */
  kickMs: number;
  /** Soru göründükten sonra dokunuşların yok sayıldığı süre (ms). */
  inputGuardMs: number;
  /** Sonuç ekranının süresi (ms). */
  resultMs: number;
  /** Yanlış cevap verenin bir sonraki soruda geç başlama süresi (ms). */
  wrongDelayMs: number;
}

export const PENALTY_DEFAULTS: PenaltySettings = { target: 5, answerMs: 10000, kickMs: 5000, inputGuardMs: 400, resultMs: 1800, wrongDelayMs: 1000 };
/** Dartta kazanmak için gereken puan (varsayılan). */
export const DART_TARGET = 50;

export type ShootoutKind = "penalty" | "dart";

/** Dart çizgisinin bir gidiş-dönüş süresi (ms) ve tahtanın yarıçapına göre gidip geldiği genişlik. */
export const DART_SWEEP_MS = 1600;
export const DART_RANGE = 1.15;
/** Halkalar: merkezden uzaklık (tahtanın yarıçapına oranla) → puan. Kırmızı merkez en yüksek puandır. */
export const DART_RINGS: { upTo: number; points: number }[] = [
  { upTo: 0.1, points: 10 },
  { upTo: 0.3, points: 7 },
  { upTo: 0.5, points: 5 },
  { upTo: 0.75, points: 3 },
  { upTo: 1, points: 1 },
];

/** Gidip gelen çizginin konumu: -DART_RANGE (sol) … +DART_RANGE (sağ); 0 tahtanın merkezi. Soldan başlar. */
export function sweepPos(elapsedMs: number, periodMs = DART_SWEEP_MS): number {
  const u = Math.max(0, elapsedMs) / periodMs;
  return DART_RANGE * (2 * Math.abs(2 * (u - Math.floor(u + 0.5))) - 1);
}

/** Merkeze uzaklığa göre puan; tahtanın dışı 0. */
export function dartPoints(pos: number): number {
  const d = Math.abs(pos);
  return DART_RINGS.find((r) => d <= r.upTo)?.points ?? 0;
}

export type Col = -1 | 0 | 1;
export type PenaltyPhase = "loading" | "question" | "kick" | "flying" | "result" | "finished";

export interface PenaltyItem {
  questionId: string;
  order: Record<Side, string[]>;
}

/** Vuruş: köşe (sütun), yükseklik (0 alt, 1 üst) ve dışarı gitme durumu. */
export interface Kick {
  col: Col;
  row: 0 | 1;
  out: "wide" | "over" | "short" | null;
}

export interface ShotResult {
  shooter: Side;
  /** Penaltı vuruşu (dartta kullanılmaz). */
  kick: Kick;
  keeperCol: Col;
  /** Penaltıda gol; dartta tahtaya isabet. */
  goal: boolean;
  /** Dart: okun saplandığı yer (-DART_RANGE … +DART_RANGE) ve aldığı puan. */
  dart?: { pos: number; points: number };
}

export interface PenaltyState {
  id: string;
  /** Eski kayıtlarda yoktur ve penaltı sayılır. */
  kind: ShootoutKind;
  lessonId: string;
  seed: string;
  players?: Record<Side, DuelPlayer>;
  settings: PenaltySettings;
  deck: PenaltyItem[];
  index: number;
  cycle: number;
  phase: PenaltyPhase;
  inputOpensAt: Record<Side, number>;
  answerDeadline: number;
  kickDeadline: number;
  /** Dart: çizginin gidip gelmeye başladığı an (duraklatmada kaydırılır). */
  aimStart: number;
  continueAt: number;
  /** Bu sorudaki ilk (ve belirleyici) cevap. */
  first: { side: Side; optionId: string; correct: boolean } | null;
  shooter: Side | null;
  shot: ShotResult | null;
  /** Penaltıda gol, dartta toplam puan. */
  goals: Record<Side, number>;
  correct: Record<Side, number>;
  wrong: Record<Side, number>;
  kicks: Record<Side, number>;
  /** Bir önceki soruda yanlış cevap verdiği için geç başlayacak taraf. */
  slow: Record<Side, boolean>;
  /** Bu soruda geç başlatılan taraf (ekranda "1 saniye bekle" gösterilir). */
  delayed: Record<Side, boolean>;
  paused: boolean;
  pausedAt: number | null;
  winner: Side | null;
}

export type PenaltyAction =
  | { type: "QUESTION_VISIBLE"; now: number }
  | { type: "ANSWER"; side: Side; questionId: string; optionId: string; now: number }
  | { type: "TIMEOUT"; now: number }
  | { type: "KICK"; kick: Kick; now: number }
  | { type: "STOP"; now: number }
  | { type: "LANDED"; now: number }
  | { type: "NEXT"; now: number }
  | { type: "PAUSE"; now: number }
  | { type: "RESUME"; now: number };

export interface PenaltyContext {
  pool: QuestionLite[];
  lookup: (id: string) => QuestionLite | undefined;
}

const other = (s: Side): Side => (s === "left" ? "right" : "left");

/** Süre dolunca yapılan zayıf vuruş: ortaya, alttan. */
export const AUTO_KICK: Kick = { col: 0, row: 0, out: null };
const keyOf = (q: QuestionLite | undefined, id: string) => q?.stimulus ?? id;
const both = <T>(v: T): Record<Side, T> => ({ left: v, right: v });

/** Ortak deste: önce bütün harfler/heceler karışık; her taraf için şık sırası ayrı karıştırılır. */
export function makePenaltyDeck(pool: QuestionLite[], seed: string, cycle: number, avoidKey?: string): PenaltyItem[] {
  const rand = mulberry32(hashSeed(`${seed}:penalty:${cycle}`));
  const order = roundOrder(pool, rand, false);
  if (avoidKey !== undefined && order.length > 1 && keyOf(order[0], order[0].id) === avoidKey) {
    const j = order.findIndex((q, i) => i > 0 && keyOf(q, q.id) !== avoidKey);
    if (j > 0) [order[0], order[j]] = [order[j], order[0]];
  }
  return order.map((q) => ({ questionId: q.id, order: { left: shuffle(q.optionIds, rand), right: shuffle(q.optionIds, rand) } }));
}

export function createPenalty(args: {
  lessonId: string;
  seed: string;
  pool: QuestionLite[];
  settings?: Partial<PenaltySettings>;
  players?: Record<Side, DuelPlayer>;
  kind?: ShootoutKind;
}): PenaltyState {
  if (args.pool.length === 0) throw new Error("Oyun için soru havuzu boş");
  const kind = args.kind ?? "penalty";
  return {
    id: `${kind}-${args.lessonId}-${args.seed}`,
    kind,
    lessonId: args.lessonId,
    seed: args.seed,
    ...(args.players ? { players: args.players } : {}),
    settings: { ...PENALTY_DEFAULTS, ...(kind === "dart" ? { target: DART_TARGET } : {}), ...args.settings },
    deck: makePenaltyDeck(args.pool, args.seed, 0),
    index: 0,
    cycle: 0,
    phase: "loading",
    inputOpensAt: both(0),
    answerDeadline: 0,
    kickDeadline: 0,
    aimStart: 0,
    continueAt: 0,
    first: null,
    shooter: null,
    shot: null,
    goals: both(0),
    correct: both(0),
    wrong: both(0),
    kicks: both(0),
    slow: both(false),
    delayed: both(false),
    paused: false,
    pausedAt: null,
    winner: null,
  };
}

export function currentPenaltyItem(s: PenaltyState): PenaltyItem | undefined {
  return s.deck[s.index];
}

/** Kalecinin atlayacağı taraf: oyun tohumundan ve soru sırasından belirlenir (rastgele ama tekrarlanabilir). */
export function keeperFor(seed: string, cycle: number, index: number): Col {
  const r = mulberry32(hashSeed(`${seed}:keeper:${cycle}:${index}`))();
  return (Math.min(2, Math.floor(r * 3)) - 1) as Col;
}

/** Tam güç için gereken kaydırma uzunluğuna göre: yön sütunu, uzunluk yüksekliği belirler. */
export const KICK_MIN = 0.15;
export const KICK_HIGH = 0.62;
export const KICK_OVER = 0.97;
export const KICK_SIDE_DEG = 12;
export const KICK_WIDE_DEG = 40;

/**
 * Kaydırmadan vuruş. `swipe` parmağın başladığı yere göre son konumu (ekran pikseli, y aşağı);
 * kale yukarıda olduğu için top yukarı kaydırılır. Kısa kaydırma null döner (vuruş sayılmaz).
 */
export function kickFromSwipe(swipe: { x: number; y: number }, maxLen: number): Kick | null {
  const len = Math.hypot(swipe.x, swipe.y) / Math.max(1, maxLen);
  if (len < KICK_MIN) return null;
  if (swipe.y >= 0) return { col: 0, row: 0, out: "short" };
  const angle = (Math.atan2(swipe.x, -swipe.y) * 180) / Math.PI;
  const abs = Math.abs(angle);
  const col: Col = abs <= KICK_SIDE_DEG ? 0 : angle < 0 ? -1 : 1;
  const row = len >= KICK_HIGH ? 1 : 0;
  if (abs > KICK_WIDE_DEG) return { col, row, out: "wide" };
  if (len >= KICK_OVER) return { col, row: 1, out: "over" };
  return { col, row, out: null };
}


export function reducePenalty(s: PenaltyState, a: PenaltyAction, ctx: PenaltyContext): PenaltyState {
  switch (a.type) {
    case "QUESTION_VISIBLE": {
      if (s.phase !== "loading" || s.winner) return s;
      const g = s.settings.inputGuardMs;
      return {
        ...s,
        phase: "question",
        inputOpensAt: { left: a.now + g + (s.slow.left ? s.settings.wrongDelayMs : 0), right: a.now + g + (s.slow.right ? s.settings.wrongDelayMs : 0) },
        answerDeadline: a.now + s.settings.answerMs,
        delayed: s.slow,
        slow: both(false),
        // Soru duraklatılmışken göründüyse duraklama süresi bu andan sayılır (cevap süresi fazladan uzamasın).
        pausedAt: s.paused ? a.now : s.pausedAt,
      };
    }
    case "ANSWER": {
      const item = currentPenaltyItem(s);
      if (s.paused || s.winner || s.phase !== "question" || !item || item.questionId !== a.questionId) return s;
      if (a.now < s.inputOpensAt[a.side] || !item.order[a.side].includes(a.optionId)) return s;
      const q = ctx.lookup(a.questionId);
      if (!q) return s;
      const correct = a.optionId === q.correctOptionId;
      return {
        ...s,
        phase: "kick",
        first: { side: a.side, optionId: a.optionId, correct },
        shooter: correct ? a.side : other(a.side),
        kickDeadline: a.now + s.settings.kickMs,
        aimStart: a.now,
        correct: { ...s.correct, [a.side]: s.correct[a.side] + (correct ? 1 : 0) },
        wrong: { ...s.wrong, [a.side]: s.wrong[a.side] + (correct ? 0 : 1) },
        slow: { ...both(false), [a.side]: !correct },
      };
    }
    case "TIMEOUT": {
      if (s.paused || s.winner || s.phase !== "question" || a.now < s.answerDeadline) return s;
      return { ...s, phase: "result", first: null, shooter: null, shot: null, continueAt: a.now + s.settings.resultMs };
    }
    case "STOP": {
      // Dart: ok, çizginin o anki yerine saplanır.
      if (s.kind !== "dart" || s.paused || s.winner || s.phase !== "kick" || !s.shooter) return s;
      const pos = sweepPos(a.now - s.aimStart);
      const points = dartPoints(pos);
      return {
        ...s,
        phase: "flying",
        shot: { shooter: s.shooter, kick: AUTO_KICK, keeperCol: 0, goal: points > 0, dart: { pos, points } },
        kicks: { ...s.kicks, [s.shooter]: s.kicks[s.shooter] + 1 },
      };
    }
    case "KICK": {
      if (s.kind === "dart" || s.paused || s.winner || s.phase !== "kick" || !s.shooter) return s;
      const keeperCol = keeperFor(s.seed, s.cycle, s.index);
      const goal = a.kick.out === null && a.kick.col !== keeperCol;
      return {
        ...s,
        phase: "flying",
        shot: { shooter: s.shooter, kick: a.kick, keeperCol, goal },
        kicks: { ...s.kicks, [s.shooter]: s.kicks[s.shooter] + 1 },
      };
    }
    case "LANDED": {
      // Top havadayken oyun duraklatılsa bile sonuç işlenir.
      if (s.phase !== "flying" || !s.shot || s.winner) return s;
      const shooter = s.shot.shooter;
      const add = s.shot.dart ? s.shot.dart.points : s.shot.goal ? 1 : 0;
      const goals = { ...s.goals, [shooter]: s.goals[shooter] + add };
      const winner = goals[shooter] >= s.settings.target ? shooter : null;
      return { ...s, goals, winner, phase: winner ? "finished" : "result", continueAt: a.now + s.settings.resultMs };
    }
    case "NEXT": {
      if (s.paused || s.winner || s.phase !== "result" || a.now < s.continueAt) return s;
      let { index, cycle, deck } = s;
      index += 1;
      if (index >= deck.length) {
        const lastId = deck[deck.length - 1]?.questionId;
        const lastKey = lastId ? keyOf(ctx.lookup(lastId), lastId) : undefined;
        cycle += 1;
        deck = makePenaltyDeck(ctx.pool, s.seed, cycle, lastKey);
        index = 0;
      }
      return { ...s, deck, index, cycle, phase: "loading", first: null, shooter: null, shot: null };
    }
    case "PAUSE": {
      if (s.paused || s.winner) return s;
      return { ...s, paused: true, pausedAt: a.now };
    }
    case "RESUME": {
      if (!s.paused) return s;
      const d = s.pausedAt !== null ? Math.max(0, a.now - s.pausedAt) : 0;
      const g = s.settings.inputGuardMs;
      return {
        ...s,
        paused: false,
        pausedAt: null,
        // Soru ekranında duraklatma: dokunuşlar yeniden kısa bir süre kilitlenir, cevap süresi uzar.
        inputOpensAt: s.phase === "question" ? { left: Math.max(s.inputOpensAt.left + d, a.now + g), right: Math.max(s.inputOpensAt.right + d, a.now + g) } : s.inputOpensAt,
        answerDeadline: s.answerDeadline + d,
        kickDeadline: s.kickDeadline + d,
        aimStart: (s.aimStart ?? 0) + d,
        continueAt: s.continueAt + d,
      };
    }
  }
}

function shiftTimes(s: PenaltyState, delta: number): PenaltyState {
  return {
    ...s,
    inputOpensAt: { left: s.inputOpensAt.left + delta, right: s.inputOpensAt.right + delta },
    answerDeadline: s.answerDeadline + delta,
    kickDeadline: s.kickDeadline + delta,
    aimStart: (s.aimStart ?? 0) + delta,
    continueAt: s.continueAt + delta,
  };
}

/** Kaydetmeye uygun anlık görüntü: süreler "kalan süre" olarak saklanır; havadaki top sonuçlandırılır. */
export function snapshotPenalty(s: PenaltyState, now: number, ctx: PenaltyContext): PenaltyState {
  const base = s.paused && s.pausedAt !== null ? s.pausedAt : now;
  const settled = s.phase === "flying" ? reducePenalty(s, { type: "LANDED", now: base }, ctx) : s;
  return { ...shiftTimes(settled, -base), paused: !settled.winner, pausedAt: 0 };
}

export function restorePenalty(s: PenaltyState, now: number): PenaltyState {
  const r = shiftTimes(s, now);
  return { ...r, phase: r.phase === "question" ? "loading" : r.phase, paused: !r.winner, pausedAt: r.winner ? null : now };
}

export { SIDES };
