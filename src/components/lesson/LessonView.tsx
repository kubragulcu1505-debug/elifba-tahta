"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LESSON_BY_ID, UNIT_BY_ID, LESSON_ORDER, SOURCE_TITLES } from "@/content/lessons";
import { PRACTICE_POOLS, questionsForLesson, gameLessonOf, AUDIO_CATALOG } from "@/content/index";
import { usePersisted } from "@/lib/storage";
import { startCompetition, startReview, startSiege, startTug } from "@/lib/session";
import { Ar, RichText } from "@/components/Arabic";
import { TapButton } from "@/components/TapButton";
import { TeamBadge } from "@/components/TeamBadge";
import { PracticePanel } from "./PracticePanel";
import { TeacherEval } from "./TeacherEval";
import { AudioPractice } from "./AudioPractice";
import { QuranReading } from "./QuranReading";

function Section({ id, title, children, tone }: { id: string; title: string; children: React.ReactNode; tone?: "teacher" }) {
  return (
    <section id={id} className={`card scroll-mt-4 p-6 ${tone === "teacher" ? "border-warn" : ""}`} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="mb-4 text-2xl font-extrabold">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function LessonView({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const lesson = LESSON_BY_ID.get(lessonId)!;
  const unit = UNIT_BY_ID.get(lesson.unitId)!;
  const settings = usePersisted("settings");
  const history = usePersisted("history");
  const active = usePersisted("activeGame");
  const [exampleIdx, setExampleIdx] = useState<number | null>(null);

  const idx = LESSON_ORDER.findIndex((l) => l.id === lessonId);
  const prev = LESSON_ORDER[idx - 1];
  const next = LESSON_ORDER[idx + 1];
  // Harfler 1–5 gibi dersler kendi oyunu yerine ünitenin tek oyununu kullanır.
  const gameId = gameLessonOf(lessonId);
  const gameLesson = LESSON_BY_ID.get(gameId)!;
  const redirected = gameId !== lessonId;
  const games = history.filter((h) => h.lessonId === gameId);
  const last = games[0];
  const qs = questionsForLesson(gameId);
  const review = { auto: qs.filter((q) => q.reviewStatus === "auto-validated").length, teacher: qs.filter((q) => q.reviewStatus === "needs-teacher-review").length, verified: qs.filter((q) => q.reviewStatus === "verified-source").length };
  // Alıştırma, oyundan farklı etkinlik türlerini kullanır (harfi bul, benzer harf, Arapça şıklar…).
  const extra = PRACTICE_POOLS[lessonId] ?? [];
  const practice = (extra.length >= 6 ? [...extra].sort((a, b) => a.type.localeCompare(b.type) || a.id.localeCompare(b.id)).filter((_, i, arr) => i % Math.max(1, Math.floor(arr.length / 6)) === 0) : qs).slice(0, 6);
  const audioItems = AUDIO_CATALOG.filter((a) => a.lessonId === lessonId);
  const activeHere = active && active.state.lessonId === gameId;

  const start = () => {
    startCompetition(gameId);
    router.push("/oyun");
  };
  const startWrongReview = () => {
    if (!last) return;
    startReview(gameId, { left: last.teams.left.wrongQuestionIds, right: last.teams.right.wrongQuestionIds });
    router.push("/oyun");
  };

  const nav = [
    ["hedef", "Hedef"],
    ["anlatim", "Anlatım"],
    ["ornekler", "Örnekler"],
    ["alistirma", "Alıştırma"],
    ["oyun", "Takım oyunu"],
    ["halat", "Halat çekme"],
    ["kale", "Kale yıkma"],
    ["tekrar", "Tekrar"],
    ...(audioItems.length ? [["ses", "Dinle ve seç"]] : []),
    ...(lessonId === "u12-l1" ? [["okuma", "Yüzüne okuma"]] : []),
    ["degerlendirme", "Öğretmen değerlendirmesi"],
    ["kaynak", "Kaynak ve inceleme"],
  ];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-6">
      <div className="mb-4 flex flex-wrap items-center gap-3 text-ink-soft">
        <Link href="/" className="underline">Ders haritası</Link>
        <span>›</span>
        <span>
          Ünite {unit.order}: {unit.title}
        </span>
      </div>
      <h1 className="text-4xl font-extrabold">
        <RichText text={lesson.title.replace(/([؀-ۿ][؀-ۿ\s]*[؀-ۿ])/g, "⟪$1⟫")} />
      </h1>
      <nav className="sticky top-0 z-10 -mx-2 mt-4 flex flex-wrap gap-2 bg-bg/95 px-2 py-2" aria-label="Ders bölümleri">
        {nav.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="chip border-2 border-line bg-surface px-3 py-1 text-base">
            {label}
          </a>
        ))}
      </nav>

      <div className="mt-4 flex flex-col gap-6">
        <Section id="hedef" title="Öğrenme hedefi">
          <p className="text-2xl font-semibold">
            <RichText text={lesson.goal} />
          </p>
          <ul className="mt-4 grid gap-2 text-lg">
            {lesson.objectives.map((o) => (
              <li key={o.id} className="flex items-start gap-3">
                <span className={`chip mt-1 ${o.assessedBy === "game" ? "bg-left-soft text-left" : "bg-warn-soft text-warn"}`}>
                  {o.assessedBy === "game" ? "Oyunla" : "Öğretmen dinler"}
                </span>
                <RichText text={o.text} />
              </li>
            ))}
          </ul>
        </Section>

        <Section id="anlatim" title="Kısa anlatım">
          <div className="flex flex-col gap-4 text-[1.4rem] leading-relaxed">
            {lesson.explanation.map((p, i) => (
              <p key={i}>
                <RichText text={p} />
              </p>
            ))}
          </div>
          {lesson.notes?.map((n, i) => (
            <p key={i} className="mt-4 rounded-xl bg-warn-soft p-3 text-lg text-warn">
              <strong>Not:</strong> <RichText text={n} />
            </p>
          ))}
        </Section>

        <Section id="ornekler" title="Rehberli örnekler">
          {lesson.examples.length === 0 ? (
            <p className="text-lg text-ink-soft">Bu derste örnekler öğretmenle birlikte mushaftan çalışılır.</p>
          ) : (
            <>
              <p className="mb-4 text-lg text-ink-soft">Bir örneğe dokunun: tahtada büyük gösterilir. Önce öğretmen okur, sonra sınıf birlikte tekrar eder.</p>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {lesson.examples.map((e, i) => (
                  <li key={i}>
                    <TapButton className="flex w-full flex-col items-center gap-1 rounded-2xl border-2 border-line bg-surface-2 p-4" onTap={() => setExampleIdx(i)}>
                      <Ar className="text-6xl">{e.arabic}</Ar>
                      {e.note && (
                        <span className="text-lg text-ink-soft">
                          <RichText text={e.note} />
                        </span>
                      )}
                    </TapButton>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Section>

        <Section id="alistirma" title="Alıştırma (puansız)">
          <p className="mb-4 text-lg text-ink-soft">Sınıfça birlikte çözün. Alıştırma, oyundan farklı etkinlik türleri içerir ve takım puanına sayılmaz.</p>
          <PracticePanel questions={practice} />
        </Section>

        <Section id="oyun" title={redirected ? "Takım oyunu: " + gameLesson.title : "30 soruluk takım oyunu"}>
          {redirected && (
            <p className="mb-4 rounded-xl bg-left-soft p-3 text-lg">
              Harfler ünitesinde tek bir takım oyunu vardır: <Link href={`/ders/${gameId}`} className="font-bold underline">{gameLesson.title}</Link>.
              Bu oyunda 28 harfin hepsi sorulur. Aşağıdaki düğme o oyunu başlatır.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-xl">
            <TeamBadge side="left" name={settings.teamNames.left} />
            <span className="text-ink-soft">ve</span>
            <TeamBadge side="right" name={settings.teamNames.right} />
            <Link href="/ogretmen#ayarlar" className="underline">İsimleri değiştir</Link>
          </div>
          <ul className="mt-4 list-disc pl-6 text-lg">
            <li>
              <RichText text="Ekranda Arapça harf, hece veya kelime görünür; şıklar Türkçedir. Örneğin ⟪ا⟫ gösterilir, şıklar “Elif, Cim, Ha, Dal” olur." />
            </li>
            <li>İki takım aynı 30 soruyu kendi sıralarıyla çözer. Her öğrenci bir soruyu cevaplayıp yerini arkadaşına bırakır.</li>
            <li>Doğru cevap 10 puan, yanlış cevap 0 puan. Her soruda ilk dokunuş geçerlidir.</li>
            <li>Kazanan önce doğru sayısına, eşitlikte toplam süreye göre belirlenir.</li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-3">
            <TapButton className="big-btn btn-primary" onTap={start}>{redirected ? "▶ Harfler oyununu başlat (28 harf)" : "▶ Takım oyununu başlat"}</TapButton>
            {activeHere && (
              <Link href="/oyun" className="big-btn btn-ghost inline-flex items-center border-2 border-line">Yarıda kalan oyuna dön</Link>
            )}
          </div>
        </Section>

        <Section id="halat" title="Halat çekme oyunu">
          <ul className="list-disc pl-6 text-lg">
            <li>Üstte halat çekme animasyonu vardır. Doğru cevap veren takım halatı bir adım kendi tarafına çeker.</li>
            <li>Sorular sınırsızdır ve kendiliğinden geçer. Önce bu dersin bütün harfleri/heceleri karışık gelir, bitince yeniden karışır.</li>
            <li>Yanlış cevapta o takım 5 saniye bekler; doğru cevap ekranda gösterilir.</li>
            <li>Ortada bir çukur vardır. Rakibini {settings.tugTarget} çekiş farkla çukura ilk düşüren takım kazanır.</li>
          </ul>
          <TapButton
            className="big-btn btn-primary mt-5"
            onTap={() => {
              startTug(lessonId);
              router.push("/halat");
            }}
          >
            🪢 Halat çekmeyi başlat
          </TapButton>
        </Section>

        <Section id="kale" title="Kale yıkma oyunu">
          <ul className="list-disc pl-6 text-lg">
            <li>Üstte iki takımın kalesi ve mancınığı vardır.</li>
            <li>Doğru cevap veren taşı kendi alanında geriye çekip bırakarak nişan alır. Kaleye isabet 1, kulenin tepesindeki küçük hedefe (zayıf nokta) isabet 3 hasar verir; ıskalanan taş hasar vermez.</li>
            <li>Kale her hasarda biraz daha parçalanır. Rakip kaleye {settings.siegeTarget} hasar ilk veren takım kazanır ve rakip kale yıkılır.</li>
            <li>Sorular sınırsızdır ve kendiliğinden geçer. Yanlış cevapta o takım 5 saniye bekler; doğru cevap ekranda gösterilir.</li>
          </ul>
          <TapButton
            className="big-btn btn-primary mt-5"
            onTap={() => {
              startSiege(lessonId);
              router.push("/kale");
            }}
          >
            🏰 Kale yıkmayı başlat
          </TapButton>
        </Section>

        <Section id="tekrar" title="Yanlışlara yönelik tekrar">
          {last ? (
            <>
              <p className="text-lg">
                Son oyun: {new Date(last.finishedAtEpoch).toLocaleString("tr-TR")} — {last.teams.left.name}: {last.teams.left.correct}/{last.teams.left.total},{" "}
                {last.teams.right.name}: {last.teams.right.correct}/{last.teams.right.total}.
              </p>
              <p className="mt-1 text-lg text-ink-soft">
                Yanlış sorular: {last.teams.left.name} {last.teams.left.wrongQuestionIds.length}, {last.teams.right.name} {last.teams.right.wrongQuestionIds.length}.
                Her takım kendi yanlışlarını puansız tekrar eder.
              </p>
              <TapButton
                className="big-btn btn-primary mt-4"
                disabled={last.teams.left.wrongQuestionIds.length + last.teams.right.wrongQuestionIds.length === 0}
                onTap={startWrongReview}
              >
                Yanlışlarla tekrar başlat
              </TapButton>
            </>
          ) : (
            <p className="text-lg text-ink-soft">Bu derste henüz oyun oynanmadı. Oyundan sonra yanlış sorular burada tekrar edilebilir.</p>
          )}
        </Section>

        {audioItems.length > 0 && (
          <Section id="ses" title="Dinle ve seç (alıştırma modu)">
            <AudioPractice items={audioItems} />
          </Section>
        )}

        {lessonId === "u12-l1" && (
          <Section id="okuma" title="Öğretmenle yüzüne okuma">
            <QuranReading />
          </Section>
        )}

        <Section id="degerlendirme" title="Öğretmen değerlendirmesi" tone="teacher">
          <TeacherEval lessonId={lessonId} items={lesson.teacherChecklist} />
        </Section>

        <Section id="kaynak" title="Kaynak ve içerik inceleme durumu">
          <ul className="list-disc pl-6 text-lg">
            {lesson.sources.map((s, i) => (
              <li key={i}>
                <strong>{s.id}</strong>: {SOURCE_TITLES[s.id]} {s.locator ? `(${s.locator})` : ""}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2 text-base">
            <span className="chip bg-surface-2">Kural tabanlı, otomatik denetlendi: {review.auto}</span>
            <span className="chip bg-warn-soft text-warn">Öğretmen/uzman incelemesi bekliyor: {review.teacher}</span>
            {review.verified > 0 && <span className="chip bg-ok-soft text-ok">Doğrulanmış kaynak: {review.verified}</span>}
          </div>
          <p className="mt-3 text-base text-ink-soft">
            Soruların tamamını doğru cevaplarıyla birlikte <Link href={`/ogretmen?ders=${lessonId}#sorular`} className="underline">öğretmen panelinde</Link> inceleyebilirsiniz.
          </p>
        </Section>

        <div className="flex flex-wrap justify-between gap-3">
          {prev ? <Link href={`/ders/${prev.id}`} className="btn btn-ghost inline-flex items-center">← {prev.title}</Link> : <span />}
          {next ? <Link href={`/ders/${next.id}`} className="btn btn-ghost inline-flex items-center">{next.title} →</Link> : <span />}
        </div>
      </div>

      {exampleIdx !== null && lesson.examples[exampleIdx] && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-surface p-6" role="dialog" aria-modal="true" aria-label="Örnek büyük gösterim">
          <Ar className="text-[min(22vh,16vw)]">{lesson.examples[exampleIdx].arabic}</Ar>
          <p className="max-w-4xl text-center text-3xl">
            <RichText text={lesson.examples[exampleIdx].note} />
          </p>
          <div className="flex gap-4">
            <TapButton className="big-btn btn-ghost" disabled={exampleIdx === 0} onTap={() => setExampleIdx((i) => (i === null ? i : Math.max(0, i - 1)))}>
              ← Önceki
            </TapButton>
            <TapButton className="big-btn btn-primary" onTap={() => setExampleIdx(null)}>Kapat</TapButton>
            <TapButton
              className="big-btn btn-ghost"
              disabled={exampleIdx >= lesson.examples.length - 1}
              onTap={() => setExampleIdx((i) => (i === null ? i : Math.min(lesson.examples.length - 1, i + 1)))}
            >
              Sonraki →
            </TapButton>
          </div>
        </div>
      )}
    </main>
  );
}
