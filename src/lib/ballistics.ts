// Kale yıkmada mancınık atışı: çek-bırak nişanı ve taşın uçuşu. Saf fonksiyonlardan oluşur.
// Dünya koordinatları: sahnenin genişliği 1000 birim; y yerden yukarı doğru artar.
// Sahne ekranda ince bir şerit olduğundan dikey ölçek ayrıdır (sahne yüksekliği WORLD_H birim);
// doğrusal bir ölçekleme olduğu için ekranda da yol yine bir yaydır.
import type { Side } from "./game.ts";

export const WORLD_W = 1000;
/** Sahnenin üstünden yere kadar olan yükseklik (dünya birimi). */
export const WORLD_H = 336;
/** Yerin sahne yüksekliğine oranı (sahnenin altından %4,8 yukarıda). */
export const GROUND_FRAC = 320 / 336;
export const GRAVITY = 1000;
/** Tam güçte taşın hızı (dünya birimi/saniye). */
export const V_MAX = 1060;
/** Bundan kısa çekişler atış sayılmaz (taş yerine döner). */
export const MIN_POWER = 0.12;
export const ANGLE_MIN = 8;
export const ANGLE_MAX = 80;
export const STONE_R = 12;
/** Süre dolunca kendiliğinden yapılan zayıf atışın gücü. */
export const AUTO_POWER = 0.4;

export interface Pt {
  x: number;
  y: number;
}

export interface Rect {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface Launch {
  vx: number;
  vy: number;
  power: number;
  angleDeg: number;
}

/**
 * Çekme hareketinden atış hızı. `pull` parmağın nişan merkezine göre konumu (ekran pikseli, y aşağı).
 * Taş, çekilen yönün tersine fırlar: sol takım sola-aşağı çekince sağa-yukarı atar; sağ takım aynalanmıştır.
 */
export function launchFromPull(pull: Pt, maxPull: number, side: Side): Launch {
  const f = side === "left" ? 1 : -1;
  const forward = -pull.x * f;
  const up = pull.y;
  let angle = (Math.atan2(up, forward) * 180) / Math.PI;
  if (up <= 0) angle = ANGLE_MIN;
  else if (forward <= 0) angle = ANGLE_MAX;
  angle = Math.min(ANGLE_MAX, Math.max(ANGLE_MIN, angle));
  const power = Math.min(1, Math.hypot(pull.x, pull.y) / Math.max(1, maxPull));
  return launchFromAngle(power, angle, side);
}

export function launchFromAngle(power: number, angleDeg: number, side: Side): Launch {
  const f = side === "left" ? 1 : -1;
  const v = power * V_MAX;
  const rad = (angleDeg * Math.PI) / 180;
  return { vx: f * v * Math.cos(rad), vy: v * Math.sin(rad), power, angleDeg };
}

export interface ShotPoint extends Pt {
  t: number;
}

export interface Shot {
  points: ShotPoint[];
  hit: boolean;
  end: Pt;
  /** Uçuş süresi (saniye). */
  duration: number;
}

/** Taşın uçuşunu adım adım hesaplar; kaleye (taşın yarıçapı kadar genişletilmiş kutu) değerse isabet, yere düşerse ıska. */
export function simulateShot(start: Pt, launch: Launch, target: Rect, dt = 1 / 120): Shot {
  const points: ShotPoint[] = [{ x: start.x, y: start.y, t: 0 }];
  for (let t = dt; t <= 4; t += dt) {
    const x = start.x + launch.vx * t;
    const y = start.y + launch.vy * t - (GRAVITY * t * t) / 2;
    points.push({ x, y: Math.max(0, y), t });
    if (x >= target.x0 - STONE_R && x <= target.x1 + STONE_R && y >= target.y0 - STONE_R && y <= target.y1 + STONE_R) {
      return { points, hit: true, end: { x, y }, duration: t };
    }
    if (y <= 0 || x < -100 || x > WORLD_W + 100) return { points, hit: false, end: { x, y: Math.max(0, y) }, duration: t };
  }
  const last = points[points.length - 1];
  return { points, hit: false, end: last, duration: last.t };
}

/** Nişan alırken gösterilen noktalı yol: normalde uçuşun ilk %30'u, kolay nişanda tamamı. */
export function previewPath(shot: Shot, easy: boolean, dots = 14): Pt[] {
  const until = easy ? shot.duration : Math.min(0.45, shot.duration * 0.3);
  const out: Pt[] = [];
  for (let i = 1; i <= dots; i++) {
    const t = (until * i) / dots;
    const p = shot.points.find((q) => q.t >= t) ?? shot.points[shot.points.length - 1];
    out.push({ x: p.x, y: p.y });
  }
  return out;
}

/** Uçuş sırasında t anındaki konum (animasyon için). */
export function pointAt(shot: Shot, t: number): Pt {
  if (t >= shot.duration) return shot.end;
  const i = Math.min(shot.points.length - 1, Math.max(0, Math.floor(t * 120)));
  return shot.points[i];
}

/** Ekran pikselini (sahne kutusuna göre) dünya koordinatına çevirir. */
export function toWorld(px: Pt, stage: { left: number; top: number; width: number; height: number }): Pt {
  const groundPx = stage.top + stage.height * GROUND_FRAC;
  return { x: ((px.x - stage.left) / stage.width) * WORLD_W, y: ((groundPx - px.y) / stage.height) * WORLD_H };
}

/** Dünya koordinatını sahne içinde yüzde konuma çevirir (left/top). */
export function toStagePct(p: Pt): { left: number; top: number } {
  return { left: (p.x / WORLD_W) * 100, top: (GROUND_FRAC - p.y / WORLD_H) * 100 };
}
