"use client";
import Link from "next/link";
import { TANZIL_EXCERPT } from "@/content/quran";
import { Ar } from "@/components/Arabic";

/** Doğrulanmış Kur'an metni (Tanzil, değiştirilmeden). Sûre ve âyet numarası korunur. */
export function QuranReading() {
  return (
    <div>
      <p className="text-lg">
        Öğrenci bu sûreleri öğretmenin yanında yüzüne okur. Okumayı mümkünse öğrencinin kendi mushafından yaptırın. Öğretmen dinleyerek{" "}
        <Link href="/ogretmen#degerlendirme" className="underline">“Kur&apos;an okumaya hazır” değerlendirmesini</Link> işaretler.
      </p>
      <p className="mt-2 rounded-xl bg-warn-soft p-3 text-base text-warn">
        Aşağıdaki metin Medine imlâsına yakın Tanzil metnidir. Türkiye&apos;de basılan mushaflarda hemze, dikey esre ve bazı işaretler farklı yazılır.
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {TANZIL_EXCERPT.suras.map((s) => (
          <article key={s.sura} className="rounded-2xl border-2 border-line bg-surface-2 p-4" aria-label={`${s.nameTr} sûresi`}>
            <h3 className="text-xl font-extrabold">
              {s.nameTr} sûresi <span className="text-ink-soft">({s.sura}. sûre, {s.ayas.length} âyet)</span>
            </h3>
            {s.bismillah && (
              <p className="mt-2 text-center text-4xl">
                <Ar>{s.bismillah}</Ar>
              </p>
            )}
            <ol className="mt-2 flex flex-col gap-1">
              {s.ayas.map((a) => (
                <li key={a.aya} className="flex items-baseline gap-3" dir="rtl">
                  <Ar className="text-4xl">{a.text}</Ar>
                  <span className="chip shrink-0 bg-surface text-base" dir="ltr" title={`${s.sura}:${a.aya}`}>
                    {s.sura}:{a.aya}
                  </span>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
      <p className="mt-4 text-sm text-ink-soft">
        Kaynak: {TANZIL_EXCERPT.source}, <a className="underline" href="https://tanzil.net" target="_blank" rel="noreferrer">tanzil.net</a>.
        Lisans: Creative Commons Attribution 3.0; metin değiştirilmeden kullanılmıştır. İndirme: {TANZIL_EXCERPT.downloadedAt}.
      </p>
    </div>
  );
}
