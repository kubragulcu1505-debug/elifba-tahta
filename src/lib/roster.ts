// Bireysel düello: sınıf listesi, maç kayıtları ve genel puan tablosu. Saf fonksiyonlardan oluşur.
// Öğrenciler kendini seçer ve bire bir oynar; her doğru cevap öğrencinin genel puanına eklenir.
import type { DuelPlayer, Side } from "./game.ts";

export type DuelGame = "letters" | "siege" | "penalty";
export const DUEL_GAME_LABEL: Record<DuelGame, string> = { letters: "Harfler oyunu", siege: "Kale yıkma", penalty: "Penaltı" };
/** Bireysel harfler oyunu: 28 harfin tamamını içeren yarışma dersi. */
export const DUEL_LETTERS_LESSON = "u1-l6";
export const POINTS_PER_CORRECT = 10;

export interface SchoolClass {
  id: string;
  name: string;
}

export interface Student {
  id: string;
  classId: string;
  name: string;
  createdAtEpoch: number;
}

export interface Roster {
  classes: SchoolClass[];
  students: Student[];
}

export const EMPTY_ROSTER: Roster = { classes: [], students: [] };

export type DuelOutcome = "win" | "loss" | "tie";

export interface DuelPlayerResult {
  studentId: string;
  name: string;
  correct: number;
  wrong: number;
  points: number;
  outcome: DuelOutcome;
}

export interface DuelRecord {
  /** Oyunun kimliği; aynı oyun iki kez kaydedilmez. */
  id: string;
  game: DuelGame;
  lessonId: string;
  finishedAtEpoch: number;
  players: Record<Side, DuelPlayerResult>;
}

export function makeDuelRecord(args: {
  id: string;
  game: DuelGame;
  lessonId: string;
  finishedAtEpoch: number;
  players: Record<Side, DuelPlayer>;
  stats: Record<Side, { correct: number; wrong: number }>;
  winner: Side | "tie";
}): DuelRecord {
  const one = (side: Side): DuelPlayerResult => ({
    studentId: args.players[side].id,
    name: args.players[side].name,
    correct: args.stats[side].correct,
    wrong: args.stats[side].wrong,
    points: args.stats[side].correct * POINTS_PER_CORRECT,
    outcome: args.winner === "tie" ? "tie" : args.winner === side ? "win" : "loss",
  });
  return { id: args.id, game: args.game, lessonId: args.lessonId, finishedAtEpoch: args.finishedAtEpoch, players: { left: one("left"), right: one("right") } };
}

export interface BoardRow {
  student: Student;
  rank: number;
  points: number;
  matches: number;
  wins: number;
  ties: number;
  correct: number;
  wrong: number;
  byGame: Record<DuelGame, number>;
}

/**
 * Genel puan tablosu: verilen öğrencilerin bütün maçlardaki puanları toplanır.
 * Sıralama: puan, sonra galibiyet; ikisi de eşitse aynı sıra paylaşılır. Silinmiş öğrencilerin kayıtları sayılmaz.
 */
export function leaderboard(students: Student[], records: DuelRecord[]): BoardRow[] {
  const rows = new Map<string, BoardRow>(
    students.map((s) => [s.id, { student: s, rank: 0, points: 0, matches: 0, wins: 0, ties: 0, correct: 0, wrong: 0, byGame: { letters: 0, siege: 0, penalty: 0 } }]),
  );
  for (const r of records) {
    for (const side of ["left", "right"] as Side[]) {
      const p = r.players[side];
      const row = rows.get(p.studentId);
      if (!row) continue;
      row.points += p.points;
      row.matches += 1;
      row.correct += p.correct;
      row.wrong += p.wrong;
      row.byGame[r.game] = (row.byGame[r.game] ?? 0) + p.points;
      if (p.outcome === "win") row.wins += 1;
      if (p.outcome === "tie") row.ties += 1;
    }
  }
  const sorted = [...rows.values()].sort(
    (a, b) => b.points - a.points || b.wins - a.wins || a.student.name.localeCompare(b.student.name, "tr"),
  );
  sorted.forEach((row, i) => {
    const prev = sorted[i - 1];
    row.rank = prev && prev.points === row.points && prev.wins === row.wins ? prev.rank : i + 1;
  });
  return sorted;
}

export function studentsOfClass(roster: Roster, classId: string | undefined): Student[] {
  return roster.students.filter((s) => s.classId === classId).sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

export function newId(prefix: string): string {
  const rnd = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${rnd}`;
}
