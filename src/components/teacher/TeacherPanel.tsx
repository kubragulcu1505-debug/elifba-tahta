"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UNITS, lessonsOfUnit, LESSON_BY_ID, LESSON_ORDER, SOURCE_TITLES } from "@/content/lessons";
import { questionsForLesson } from "@/content/index";
import { usePersisted, update, write, exportAll, resetAll, downloadJson, storageAvailable, useHydrated, DEFAULT_SETTINGS, type Settings } from "@/lib/storage";
import { startCompetition, startReview } from "@/lib/session";
import { formatMs } from "@/lib/game";
import { Ar, RichText } from "@/components/Arabic";
import { TeamBadge } from "@/components/TeamBadge";
import { AudioManager } from "./AudioManager";
import { Readiness } from "./Readiness";

const NAV: [string, string][] = [
  ["dersler", "Ders seçimi"],
  ["ayarlar", "Takımlar ve ayarlar"],
  ["sonuclar", "Sonuçlar"],
  ["sorular", "Soru bankası"],
  ["ses", "Ses kayıtları"],
  ["degerlendirme", "Öğrenci değerlendirmesi"],
  ["veri", "Veri"],
];

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="card scroll-mt-20 p-6" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="mb-4 text-2xl font-extrabold">{title}</h2>
      {children}
    </section>
  );
}

export function TeacherPanel() {
  const hydrated = useHydrated();
  if (!hydrated) return <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-6 text-2xl">Yükleniyor…</main>;
  return <TeacherPanelInner />;
}

function initialBankLesson(): string {
  const p = new URLSearchParams(window.location.search).get("ders");
  return p && LESSON_BY_ID.has(p) ? p : "u1-l1";
}

function TeacherPanelInner() {
  const router = useRouter();
  const settings = usePersisted("settings");
  const history = usePersisted("history");
  const approvals = usePersisted("approvals");
  const [bankLesson, setBankLesson] = useState(initialBankLesson);
  const [confirmReset, setConfirmReset] = useState(false);
  const [canStore] = useState(storageAvailable);
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    if (window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const setSettings = (patch: Partial<Settings>) => update("settings", (s) => ({ ...s, ...patch }));
  const bank = questionsForLesson(bankLesson);
  const bankLessonObj = LESSON_BY_ID.get(bankLesson)!;
  const objectiveText = (lessonId: string, id: string) => LESSON_BY_ID.get(lessonId)?.objectives.find((o) => o.id === id)?.text ?? id;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-6">
      <h1 className="text-4xl font-extrabold">Öğretmen paneli</h1>
      {!canStore && (
        <p className="mt-3 rounded-xl bg-bad-soft p-3 text-lg text-bad">
          Bu tarayıcıda kalıcı depolama kapalı (ör. gizli pencere). Uygulama çalışır, ancak ayarlar ve sonuçlar sayfa yenilenince kaybolur.
        </p>
      )}
      <nav className="sticky top-0 z-10 -mx-2 mt-4 flex flex-wrap gap-2 bg-bg/95 px-2 py-2" aria-label="Panel bölümleri">
        {NAV.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="chip border-2 border-line bg-surface px-3 py-1 text-base">{label}</a>
        ))}
        <Link href="/kontrol" className="chip border-2 border-line bg-surface px-3 py-1 text-base">Cihaz testi</Link>
      </nav>

      <div className="mt-4 flex flex-col gap-6">
        <Block id="dersler" title="Ders ve kazanım seçimi">
          <p className="mb-4 text-lg text-ink-soft">Bütün dersler serbestçe açılabilir. Anlatımı açın veya oyunu doğrudan başlatın.</p>
          <div className="grid gap-4 lg:grid-cols-2">
            {UNITS.map((u) => (
              <div key={u.id} className="rounded-2xl border-2 border-line p-4">
                <h3 className="text-xl font-extrabold">{u.order}. {u.title}</h3>
                <ul className="mt-2 flex flex-col gap-2">
                  {lessonsOfUnit(u.id).map((l) => (
                    <li key={l.id} className="flex flex-wrap items-center gap-2">
                      <span className="min-w-0 flex-1 font-semibold">
                        <RichText text={l.title.replace(/([؀-ۿ][؀-ۿ\s]*[؀-ۿ])/g, "⟪$1⟫")} />
                      </span>
                      <Link href={`/ders/${l.id}#anlatim`} className="btn btn-ghost !min-h-10 !py-1 text-sm">Anlatım</Link>
                      <button type="button" className="btn btn-primary !min-h-10 !py-1 text-sm" onClick={() => { startCompetition(l.id); router.push("/oyun"); }}>
                        Oyunu başlat
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Block>

        <Block id="ayarlar" title="Takımlar ve ayarlar">
          <div className="grid gap-6 md:grid-cols-2">
            {(["left", "right"] as const).map((side) => (
              <label key={side} className="flex flex-col gap-2 text-lg">
                <TeamBadge side={side} name={side === "left" ? "Sol takımın adı" : "Sağ takımın adı"} />
                <input
                  value={settings.teamNames[side]}
                  maxLength={28}
                  onChange={(e) => setSettings({ teamNames: { ...settings.teamNames, [side]: e.target.value } })}
                  onBlur={(e) => !e.target.value.trim() && setSettings({ teamNames: { ...settings.teamNames, [side]: DEFAULT_SETTINGS.teamNames[side] } })}
                  className="min-h-12 rounded-xl border-2 border-line px-3 text-xl"
                />
              </label>
            ))}
            <label className="flex flex-col gap-2 text-lg">
              <span className="font-bold">Önerilen başarı eşiği (%)</span>
              <input
                type="number"
                min={50}
                max={100}
                step={5}
                value={settings.threshold}
                onChange={(e) => setSettings({ threshold: Math.min(100, Math.max(50, Number(e.target.value) || 80)) })}
                className="min-h-12 w-40 rounded-xl border-2 border-line px-3 text-xl"
              />
              <span className="text-base text-ink-soft">
                Varsayılan %80. Bu pedagojik bir ürün ayarıdır; resmî bir zorunluluk değildir. Sonuç ekranında ve ders haritasında kullanılır.
              </span>
            </label>
            <label className="flex flex-col gap-2 text-lg">
              <span className="font-bold">Hareket ve animasyon</span>
              <select
                value={settings.motion}
                onChange={(e) => setSettings({ motion: e.target.value as Settings["motion"] })}
                className="min-h-12 w-72 rounded-xl border-2 border-line px-3 text-lg"
              >
                <option value="system">Cihaz tercihine uy</option>
                <option value="reduce">Hareketi azalt</option>
                <option value="full">Animasyonlar açık</option>
              </select>
            </label>
            <div className="flex flex-col gap-2 text-lg">
              <span className="font-bold">Tam ekran</span>
              <button
                type="button"
                className="btn btn-ghost w-60"
                onClick={async () => {
                  try {
                    if (document.fullscreenElement) await document.exitFullscreen();
                    else await document.documentElement.requestFullscreen();
                  } catch {
                    /* izin yok */
                  }
                }}
              >
                {isFs ? "Tam ekrandan çık" : "Tam ekrana geç"}
              </button>
              <span className="text-base text-ink-soft">Oyun ekranının üst çubuğunda da tam ekran, duraklat ve yeniden başlat düğmeleri vardır.</span>
            </div>
          </div>
        </Block>

        <Block id="sonuclar" title="Sonuçlar ve yanlış yapılan kazanımlar">
          {history.length === 0 ? (
            <p className="text-lg text-ink-soft">Henüz tamamlanmış oyun yok.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {history.slice(0, 40).map((h) => {
                const l = LESSON_BY_ID.get(h.lessonId);
                const objWrong: Record<string, number> = {};
                for (const t of [h.teams.left, h.teams.right]) for (const [o, s] of Object.entries(t.objectives)) objWrong[o] = (objWrong[o] ?? 0) + s.wrong;
                const weak = Object.entries(objWrong).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
                return (
                  <li key={h.id} className="rounded-2xl border-2 border-line p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <strong className="text-lg">{l?.title}</strong>
                      <span className="text-ink-soft">{new Date(h.finishedAtEpoch).toLocaleString("tr-TR")}</span>
                      <span className="chip bg-surface-2">
                        {h.winner === "tie" ? "Berabere" : `Kazanan: ${h.winner ? h.teams[h.winner].name : "-"}`} ·{" "}
                        {h.decidedBy === "correct" ? "doğru sayısıyla" : h.decidedBy === "time" ? "süreyle" : "tam eşitlik"}
                      </span>
                    </div>
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      {(["left", "right"] as const).map((s) => {
                        const t = h.teams[s];
                        const pct = t.total ? Math.round((t.correct / t.total) * 100) : 0;
                        return (
                          <div key={s} className={`rounded-xl p-3 ${s === "left" ? "bg-left-soft" : "bg-right-soft"}`}>
                            <TeamBadge side={s} name={t.name} size={24} />
                            <div className="mt-1 text-lg">
                              {t.correct}/{t.total} doğru · {t.score} puan · {formatMs(t.totalMs)} ·{" "}
                              <span className={pct >= settings.threshold ? "font-bold text-ok" : "font-bold text-warn"}>%{pct}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {weak.length > 0 && (
                      <div className="mt-3">
                        <div className="font-bold">Yanlış yapılan kazanımlar (iki takım toplamı):</div>
                        <ul className="list-disc pl-6">
                          {weak.map(([o, n]) => (
                            <li key={o}>
                              <RichText text={objectiveText(h.lessonId, o)} /> — {n} yanlış
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={h.teams.left.wrongQuestionIds.length + h.teams.right.wrongQuestionIds.length === 0}
                        onClick={() => {
                          startReview(h.lessonId, { left: h.teams.left.wrongQuestionIds, right: h.teams.right.wrongQuestionIds });
                          router.push("/oyun");
                        }}
                      >
                        Yanlış sorularla tekrar başlat
                      </button>
                      <Link href={`/ders/${h.lessonId}#degerlendirme`} className="btn btn-ghost inline-flex items-center">Öğrencileri dinleyerek değerlendir</Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-4 text-base text-ink-soft">Takım sonuçları sınıf düzeyinde bilgi verir; tek tek öğrencilerin öğrenme düzeyi bu sonuçlardan çıkarılmaz.</p>
        </Block>

        <Block id="sorular" title="Soru bankası: içerik ve doğru cevaplar">
          <label className="flex flex-wrap items-center gap-3 text-lg">
            <span className="font-bold">Ders:</span>
            <select value={bankLesson} onChange={(e) => setBankLesson(e.target.value)} className="min-h-12 rounded-xl border-2 border-line px-3 text-lg">
              {LESSON_ORDER.map((l) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </label>
          <p className="mt-2 text-base text-ink-soft">
            Kaynaklar: {bankLessonObj.sources.map((s) => `${s.id} ${s.locator ?? ""}`).join("; ")}. “İnceledim” işareti yalnızca bu cihazda saklanır ve dışa aktarılan dosyaya dahildir.
          </p>
          <ol className="mt-4 flex flex-col gap-3" data-testid="question-bank">
            {bank.map((q, i) => {
              const ok = approvals[q.id];
              return (
                <li key={q.id} className="rounded-2xl border-2 border-line p-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="chip bg-surface-2">#{i + 1}</span>
                    <span className="chip bg-surface-2">{q.type}</span>
                    <span className="chip bg-surface-2">Zorluk {q.difficulty}</span>
                    <span className="chip bg-surface-2">{q.source.id} {q.source.locator}</span>
                    <span className={`chip ${q.reviewStatus === "needs-teacher-review" ? "bg-warn-soft text-warn" : q.reviewStatus === "verified-source" ? "bg-ok-soft text-ok" : "bg-surface-2"}`}>
                      {q.reviewStatus === "needs-teacher-review" ? "İnceleme bekliyor" : q.reviewStatus === "verified-source" ? "Doğrulanmış kaynak" : "Kural tabanlı · otomatik denetlendi"}
                    </span>
                    {q.lessonId !== bankLesson && <span className="chip bg-surface-2">Kaynak ders: {q.lessonId}</span>}
                    <span className="text-ink-soft">{q.id}</span>
                  </div>
                  <div className="mt-2 text-lg font-bold"><RichText text={q.prompt} /></div>
                  {q.stimulus && <div className="text-5xl"><Ar>{q.stimulus}</Ar></div>}
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {q.options.map((o) => (
                      <li key={o.id} className={`rounded-xl border-2 px-3 py-1 ${o.id === q.correctOptionId ? "border-ok bg-ok-soft" : "border-line"}`}>
                        {o.kind === "arabic" ? <Ar className="text-4xl">{o.label}</Ar> : <span className="text-lg">{o.label}</span>}
                        {o.id === q.correctOptionId && <span className="ml-2 font-bold text-ok">✓ doğru</span>}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-base"><strong>Açıklama:</strong> <RichText text={q.explanation} /></p>
                  <p className="text-sm text-ink-soft">Kazanım: <RichText text={objectiveText(q.lessonId, q.objectiveId)} /></p>
                  <label className="mt-2 inline-flex items-center gap-2 text-base">
                    <input
                      type="checkbox"
                      className="h-6 w-6"
                      checked={!!ok}
                      onChange={(e) =>
                        update("approvals", (a) => {
                          const next = { ...a };
                          if (e.target.checked) next[q.id] = { atEpoch: Date.now() };
                          else delete next[q.id];
                          return next;
                        })
                      }
                    />
                    İnceledim, doğru buluyorum
                  </label>
                </li>
              );
            })}
          </ol>
        </Block>

        <Block id="ses" title="Ses kayıtları">
          <AudioManager />
        </Block>

        <Block id="degerlendirme" title="Öğrenci değerlendirmesi ve “Kur'an okumaya hazır”">
          <Readiness />
        </Block>

        <Block id="veri" title="Veri: dışa aktarma ve sıfırlama">
          <p className="text-lg">Uygulama hesap ve sunucu kullanmaz. Ayarlar, sonuçlar ve değerlendirmeler yalnızca bu tarayıcıda saklanır.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="btn btn-primary" onClick={() => downloadJson(`elifba-sonuclar-${new Date().toISOString().slice(0, 10)}.json`, exportAll())}>
              Sonuçları JSON olarak indir
            </button>
            {!confirmReset ? (
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(true)}>Bütün verileri sıfırla…</button>
            ) : (
              <span className="flex flex-wrap items-center gap-2 rounded-xl bg-bad-soft p-2">
                <span className="font-bold text-bad">Ayarlar, sonuçlar, değerlendirmeler ve aktif oyun silinecek. Emin misiniz?</span>
                <button type="button" className="btn bg-bad text-white" onClick={() => { resetAll(); write("settings", DEFAULT_SETTINGS); setConfirmReset(false); }}>
                  Evet, sıfırla
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(false)}>Vazgeç</button>
              </span>
            )}
          </div>
          <p className="mt-3 text-base text-ink-soft">Ses kayıtları ayrı tutulur ve “Ses kayıtları” bölümünden silinir.</p>
          <h3 className="mt-6 text-xl font-bold">Kaynaklar</h3>
          <ul className="list-disc pl-6">
            {Object.entries(SOURCE_TITLES).map(([k, v]) => (
              <li key={k}><strong>{k}</strong>: {v}</li>
            ))}
          </ul>
        </Block>
      </div>
    </main>
  );
}
