"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useHydrated } from "@/lib/storage";
import { ALL_GAME_QUESTIONS, LESSON_POOLS } from "@/content/index";
import { LESSONS } from "@/content/lessons";
import { TANZIL_EXCERPT } from "@/content/quran";
import { Ar } from "@/components/Arabic";
import { TapButton } from "@/components/TapButton";
import { TeamIcon } from "@/components/TeamBadge";

function allArabicStrings(): string[] {
  const set = new Set<string>();
  const qs = [...ALL_GAME_QUESTIONS, ...Object.values(LESSON_POOLS).flat()];
  for (const q of qs) {
    if (q.stimulus) set.add(q.stimulus);
    for (const o of q.options) if (o.kind === "arabic") set.add(o.label);
  }
  for (const l of LESSONS) for (const e of l.examples) set.add(e.arabic);
  for (const s of TANZIL_EXCERPT.suras) {
    if (s.bismillah) set.add(s.bismillah);
    for (const a of s.ayas) set.add(a.text);
  }
  return [...set];
}

interface Measure {
  text: string;
  ascent: number;
  descent: number;
  ratio: number;
}

/** Arapça metinlerin mürekkep yüksekliğini gerçek fontla ölçer. */
function ArabicCheck() {
  const strings = useMemo(() => allArabicStrings(), []);
  const [result, setResult] = useState<{ fontOk: boolean; measures: Measure[]; family: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const family = getComputedStyle(document.documentElement).getPropertyValue("--font-scheherazade").split(",")[0].trim();
      try {
        await document.fonts.load(`100px ${family}`, "بَ");
        await document.fonts.ready;
      } catch {
        /* yok say */
      }
      const fontOk = family ? document.fonts.check(`100px ${family}`, "بَ") : false;
      const c = document.createElement("canvas").getContext("2d")!;
      c.font = `100px ${family}`;
      c.direction = "rtl";
      const measures = strings.map((t) => {
        const m = c.measureText(t);
        const ascent = m.actualBoundingBoxAscent;
        const descent = m.actualBoundingBoxDescent;
        return { text: t, ascent, descent, ratio: (ascent + descent) / 100 };
      });
      measures.sort((a, b) => b.ratio - a.ratio);
      if (!cancelled) setResult({ fontOk, measures, family });
    })();
    return () => {
      cancelled = true;
    };
  }, [strings]);

  const LINE = 2.1;
  const over = result?.measures.filter((m) => m.ratio > LINE) ?? [];
  return (
    <section className="card p-6" aria-labelledby="ar-h">
      <h2 id="ar-h" className="text-2xl font-extrabold">Arapça metin ve hareke kontrolü</h2>
      <p className="mt-2 text-lg">
        İçerikteki {strings.length} farklı Arapça metin, projeyle gelen Scheherazade New fontuyla ölçülür. Harekeler ve üst işaretler dahil mürekkep
        yüksekliği, uygulamadaki satır yüksekliğine ({LINE}) sığmalıdır. Arapça alanlarda taşma kesilmez ve harf aralığı verilmez.
      </p>
      {!result ? (
        <p className="mt-3">Ölçülüyor…</p>
      ) : (
        <div className="mt-3 flex flex-col gap-3" data-testid="arabic-check">
          <div className="flex flex-wrap gap-2 text-lg">
            <span className={`chip ${result.fontOk ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad"}`} data-testid="font-status">
              {result.fontOk ? "Font yüklendi" : "Font yüklenemedi"}
            </span>
            <span className={`chip ${over.length === 0 ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad"}`} data-testid="overflow-status">
              Satır yüksekliğini aşan metin: {over.length}
            </span>
            <span className="chip bg-surface-2">En yüksek oran: {result.measures[0]?.ratio.toFixed(2)}</span>
          </div>
          <p className="text-base text-ink-soft">En yüksek 12 metin (göz kontrolü için büyük gösterilir):</p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {result.measures.slice(0, 12).map((m) => (
              <li key={m.text} className="flex flex-col items-center rounded-2xl border-2 border-line bg-surface-2 p-2">
                <Ar className="text-6xl">{m.text}</Ar>
                <span className="text-sm text-ink-soft">oran {m.ratio.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** Akıllı tahtada eşzamanlı dokunuş testi. */
function TouchTest() {
  const [counts, setCounts] = useState({ left: 0, right: 0 });
  const [maxActive, setMaxActive] = useState(0);
  const [types, setTypes] = useState<string[]>([]);
  const active = useRef(new Set<number>());
  const hydrated = useHydrated();
  const info = hydrated
    ? `Ekran ${window.innerWidth}×${window.innerHeight} · piksel oranı ${window.devicePixelRatio} · desteklenen dokunuş noktası ${navigator.maxTouchPoints} · ` +
      `işaretçi ${matchMedia("(pointer: coarse)").matches ? "kaba (dokunmatik)" : "ince (fare)"}`
    : "";

  const down = (e: React.PointerEvent) => {
    active.current.add(e.pointerId);
    setMaxActive((m) => Math.max(m, active.current.size));
    setTypes((t) => (t.includes(e.pointerType) ? t : [...t, e.pointerType]));
  };
  const up = (e: React.PointerEvent) => {
    active.current.delete(e.pointerId);
  };

  return (
    <section className="card p-6" aria-labelledby="touch-h">
      <h2 id="touch-h" className="text-2xl font-extrabold">Çoklu dokunma testi (öğretmen için 1 dakikalık cihaz testi)</h2>
      <ol className="mt-2 list-decimal pl-6 text-lg">
        <li>İki öğrenci tahtanın iki yanına geçsin.</li>
        <li>“Başla” deyince ikisi de <strong>aynı anda</strong> kendi tarafındaki büyük düğmeye dokunsun.</li>
        <li>İki sayaç da artmalı ve “en fazla eşzamanlı dokunuş” en az 2 olmalı.</li>
        <li>Sayaçlardan biri artmıyorsa tahta tek dokunuşu destekliyordur: takımlar sırayla dokunarak yine oynayabilir.</li>
      </ol>
      <p className="mt-2 text-base text-ink-soft" data-testid="device-info">{info}</p>
      <div
        className="mt-4 grid grid-cols-[1fr_8px_1fr] overflow-hidden rounded-2xl border-2 border-line"
        style={{ touchAction: "none", userSelect: "none" }}
        onPointerDown={down}
        onPointerUp={up}
        onPointerCancel={up}
      >
        {(["left", "right"] as const).map((side, i) => (
          <div key={side} className={`flex flex-col items-center gap-3 p-6 ${side === "left" ? "bg-left-soft" : "bg-right-soft"}`} style={{ order: i * 2 }}>
            <span className={side === "left" ? "text-left" : "text-right"}>
              <TeamIcon side={side} size={48} />
            </span>
            <TapButton className="option-btn w-full" onTap={() => setCounts((c) => ({ ...c, [side]: c[side] + 1 }))}>
              <span className="text-4xl font-extrabold">Dokun</span>
            </TapButton>
            <span className="text-3xl font-extrabold tabular-nums" data-testid={`touch-count-${side}`}>{counts[side]}</span>
          </div>
        ))}
        <div className="divider" style={{ order: 1 }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-lg">
        <span className={`chip ${maxActive >= 2 ? "bg-ok-soft text-ok" : "bg-surface-2"}`} data-testid="max-active">
          En fazla eşzamanlı dokunuş: {maxActive}
        </span>
        <span className="chip bg-surface-2">Algılanan işaretçi türleri: {types.join(", ") || "-"}</span>
        <button type="button" className="btn btn-ghost" onClick={() => { setCounts({ left: 0, right: 0 }); setMaxActive(0); setTypes([]); }}>
          Sıfırla
        </button>
      </div>
    </section>
  );
}

export function CheckPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-6">
      <h1 className="text-4xl font-extrabold">Cihaz ve görüntü testi</h1>
      <TouchTest />
      <ArabicCheck />
    </main>
  );
}
