"use client";
// Öğrenci fotoğrafları (IndexedDB). Fotoğraflar yalnızca bu tarayıcıda saklanır; hiçbir sunucuya gönderilmez.
// Yüklenen fotoğraf kare kırpılıp küçültülür (320×320 JPEG), böylece bir sınıf birkaç yüz KB yer kaplar.
import { useEffect, useSyncExternalStore } from "react";

const DB = "elifba-tahta-photos";
const STORE = "photos";
const SIZE = 320;

interface PhotoRow {
  id: string; // öğrenci kimliği
  dataUrl: string;
}

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

let cache: Record<string, string> = {};
let loaded = false;
let loading: Promise<void> | null = null;
const subs = new Set<() => void>();
const notify = () => subs.forEach((s) => s());

export function refreshPhotos(): Promise<void> {
  loading ??= (async () => {
    try {
      const all = (await tx("readonly", (s) => s.getAll())) as PhotoRow[];
      cache = Object.fromEntries(all.map((r) => [r.id, r.dataUrl]));
    } catch {
      cache = {};
    }
    loaded = true;
    loading = null;
    notify();
  })();
  return loading;
}

export async function savePhoto(id: string, dataUrl: string): Promise<void> {
  await tx("readwrite", (s) => s.put({ id, dataUrl } satisfies PhotoRow));
  cache = { ...cache, [id]: dataUrl };
  notify();
}

export async function deletePhoto(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id));
  const next = { ...cache };
  delete next[id];
  cache = next;
  notify();
}

export function allPhotos(): Record<string, string> {
  return cache;
}

/** Bütün fotoğraflar (öğrenci kimliği → resim). İlk kullanımda veritabanından yüklenir. */
export function usePhotos(): Record<string, string> {
  const photos = useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => cache,
    () => cache,
  );
  useEffect(() => {
    if (!loaded) void refreshPhotos();
  }, []);
  return photos;
}

/** Seçilen resmi ortadan kare kırpar ve küçültür; JPEG veri adresi döndürür. */
export async function resizePhoto(file: Blob): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Resim açılamadı"));
      i.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    // Yüz genelde fotoğrafın üst yarısında olur; dikey fotoğrafta kırpma biraz yukarıdan yapılır.
    const sy = img.naturalHeight > img.naturalWidth ? (img.naturalHeight - side) * 0.25 : (img.naturalHeight - side) / 2;
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Çizim yapılamadı");
    ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
