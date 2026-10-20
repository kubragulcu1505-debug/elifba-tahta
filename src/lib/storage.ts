"use client";
// localStorage tabanlı küçük kalıcı depo. Hesap ve veritabanı gerekmez.
// Tüm okuma/yazmalar try/catch içindedir; depolama kapalıysa uygulama varsayılanlarla çalışır.
import { useSyncExternalStore } from "react";
import type { GameState, Side, TeamResult, GameResult } from "./game";
import type { TugState } from "./tug";

export const STORAGE_VERSION = 1;
const PREFIX = "elifba-tahta.v1.";

export interface Settings {
  teamNames: Record<Side, string>;
  /** Önerilen başarı eşiği (%). Pedagojik ürün ayarıdır; resmî bir zorunluluk değildir. */
  threshold: number;
  /** Hareket azaltma: sistem tercihine uy / her zaman azalt / animasyonlar açık */
  motion: "system" | "reduce" | "full";
  /** Halat çekmede kazanmak için gereken net çekiş sayısı. */
  tugTarget: number;
}

export const DEFAULT_SETTINGS: Settings = {
  teamNames: { left: "Yıldız Takımı", right: "Hilal Takımı" },
  threshold: 80,
  motion: "system",
  tugTarget: 7,
};

export interface GameRecord {
  id: string;
  lessonId: string;
  finishedAtEpoch: number;
  teams: Record<Side, TeamResult & { name: string; objectives: Record<string, { correct: number; wrong: number }> }>;
  winner: GameResult["winner"];
  decidedBy: GameResult["decidedBy"];
}

export type Mark = "not-yet" | "developing" | "achieved";
export interface Evaluations {
  students: { id: string; name: string }[];
  /** marks[studentId][lessonId][maddeIndex] */
  marks: Record<string, Record<string, Record<number, Mark>>>;
  readiness: Record<string, { ready: boolean; listenedConfirmed: boolean; atEpoch: number; note: string }>;
}
export const EMPTY_EVALUATIONS: Evaluations = { students: [], marks: {}, readiness: {} };

/** Öğretmenin "inceledim" diye işaretlediği sorular. */
export type QuestionApprovals = Record<string, { atEpoch: number; note?: string }>;

export interface ActiveGame {
  state: GameState;
  savedAtEpoch: number;
  /** Yeni başlatıldı: yüklenince duraklatılmadan başlar. Yenilemeden sonra false olur. */
  fresh?: boolean;
}

export interface Schema {
  settings: Settings;
  history: GameRecord[];
  evaluations: Evaluations;
  approvals: QuestionApprovals;
  activeGame: ActiveGame | null;
  activeTug: { state: TugState; savedAtEpoch: number; fresh?: boolean } | null;
  /** Ders sayfasında açık bırakılan sekme vb. küçük kolaylıklar */
  ui: { lastLessonId?: string };
}

const DEFAULTS: Schema = {
  settings: DEFAULT_SETTINGS,
  history: [],
  evaluations: EMPTY_EVALUATIONS,
  approvals: {},
  activeGame: null,
  activeTug: null,
  ui: {},
};

type Key = keyof Schema;
const cache = new Map<Key, unknown>();
const listeners = new Map<Key, Set<() => void>>();

function storage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function read<K extends Key>(key: K): Schema[K] {
  if (cache.has(key)) return cache.get(key) as Schema[K];
  let value: Schema[K] = DEFAULTS[key];
  try {
    const raw = storage()?.getItem(PREFIX + key);
    if (raw) {
      const parsed = JSON.parse(raw);
      value = key === "settings" ? ({ ...DEFAULT_SETTINGS, ...parsed, teamNames: { ...DEFAULT_SETTINGS.teamNames, ...parsed.teamNames } } as Schema[K]) : parsed;
    }
  } catch {
    value = DEFAULTS[key];
  }
  cache.set(key, value);
  return value;
}

export function write<K extends Key>(key: K, value: Schema[K]): boolean {
  cache.set(key, value);
  let ok = true;
  try {
    const s = storage();
    if (!s) ok = false;
    else if (value === null) s.removeItem(PREFIX + key);
    else s.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    ok = false;
  }
  listeners.get(key)?.forEach((l) => l());
  return ok;
}

export function update<K extends Key>(key: K, fn: (prev: Schema[K]) => Schema[K]): void {
  write(key, fn(read(key)));
}

function subscribe(key: Key, cb: () => void) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === PREFIX + key) {
      cache.delete(key);
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.get(key)!.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Kalıcı değeri okuyan React kancası. Sunucuda ve ilk boyamada varsayılan değeri döndürür. */
export function usePersisted<K extends Key>(key: K): Schema[K] {
  return useSyncExternalStore(
    (cb) => subscribe(key, cb),
    () => read(key),
    () => DEFAULTS[key],
  );
}

/** İstemcide çalışıp çalışmadığımızı (hidrasyon sonrası) bildirir. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function storageAvailable(): boolean {
  try {
    const s = storage();
    if (!s) return false;
    s.setItem(PREFIX + "__probe", "1");
    s.removeItem(PREFIX + "__probe");
    return true;
  } catch {
    return false;
  }
}

export function exportAll(): Record<string, unknown> {
  return {
    app: "elifba-tahta",
    version: STORAGE_VERSION,
    exportedAt: new Date().toISOString(),
    settings: read("settings"),
    history: read("history"),
    evaluations: read("evaluations"),
    approvals: read("approvals"),
    note: "Ses kayıtları bu dosyaya dahil değildir (tarayıcının IndexedDB deposunda tutulur).",
  };
}

export function resetAll(): void {
  for (const key of Object.keys(DEFAULTS) as Key[]) {
    try {
      storage()?.removeItem(PREFIX + key);
    } catch {
      /* yok say */
    }
    cache.delete(key);
    listeners.get(key)?.forEach((l) => l());
  }
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
