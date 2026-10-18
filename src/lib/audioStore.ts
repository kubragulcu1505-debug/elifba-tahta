"use client";
// Öğretmen ses kayıtları (IndexedDB). Uygulama hiçbir ses dosyasıyla gelmez.
// Bir kayıt ancak öğretmen dinleyip "Onayla" dediğinde alıştırmada kullanılabilir.
import { useEffect, useState, useSyncExternalStore } from "react";

export interface Recording {
  id: string; // audioId
  blob: Blob;
  mime: string;
  fileName: string;
  uploadedAtEpoch: number;
  approved: boolean;
  approvedAtEpoch?: number;
}
export type RecordingMeta = Omit<Recording, "blob">;

const DB = "elifba-tahta-audio";
const STORE = "recordings";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (e) {
      reject(e);
    }
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

let metaCache: RecordingMeta[] = [];
let loaded = false;
const subs = new Set<() => void>();
const notify = () => subs.forEach((s) => s());

export async function refreshMeta(): Promise<void> {
  try {
    const all = (await tx("readonly", (s) => s.getAll())) as Recording[];
    metaCache = all.map((r) => ({ id: r.id, mime: r.mime, fileName: r.fileName, uploadedAtEpoch: r.uploadedAtEpoch, approved: r.approved, approvedAtEpoch: r.approvedAtEpoch }));
  } catch {
    metaCache = [];
  }
  loaded = true;
  notify();
}

export async function saveRecording(id: string, file: Blob, fileName: string): Promise<void> {
  const rec: Recording = { id, blob: file, mime: file.type || "audio/webm", fileName, uploadedAtEpoch: Date.now(), approved: false };
  await tx("readwrite", (s) => s.put(rec));
  await refreshMeta();
}

export async function setApproved(id: string, approved: boolean): Promise<void> {
  const rec = (await tx("readonly", (s) => s.get(id))) as Recording | undefined;
  if (!rec) return;
  await tx("readwrite", (s) => s.put({ ...rec, approved, approvedAtEpoch: approved ? Date.now() : undefined }));
  await refreshMeta();
}

export async function deleteRecording(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id));
  await refreshMeta();
}

export async function getRecordingBlob(id: string): Promise<Blob | undefined> {
  try {
    const rec = (await tx("readonly", (s) => s.get(id))) as Recording | undefined;
    return rec?.blob;
  } catch {
    return undefined;
  }
}

export function useRecordings(): { list: RecordingMeta[]; loaded: boolean } {
  const list = useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => metaCache,
    () => metaCache,
  );
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!loaded) refreshMeta().then(() => setTick((t) => t + 1));
  }, []);
  return { list, loaded };
}

// ── Tek ses kanalı: aynı anda yalnızca bir ses çalar (iki takımın sesleri karışmaz). ──
let current: HTMLAudioElement | null = null;
let currentUrl: string | null = null;

export async function playRecording(id: string): Promise<boolean> {
  stopAudio();
  const blob = await getRecordingBlob(id);
  if (!blob) return false;
  currentUrl = URL.createObjectURL(blob);
  current = new Audio(currentUrl);
  try {
    await current.play();
    return true;
  } catch {
    return false;
  }
}

export function stopAudio(): void {
  if (current) {
    current.pause();
    current = null;
  }
  if (currentUrl) {
    URL.revokeObjectURL(currentUrl);
    currentUrl = null;
  }
}
