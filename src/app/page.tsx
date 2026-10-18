import { SiteHeader, Disclaimer } from "@/components/SiteHeader";
import { LessonMap } from "@/components/LessonMap";

export default function Home() {
  return (
    <>
      <SiteHeader current="home" />
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-6">
        <section className="mb-6">
          <h1 className="text-3xl font-extrabold">Ders haritası</h1>
          <p className="mt-2 max-w-4xl text-lg text-ink-soft">
            Harfleri tanımaktan harekeli ve birleşik okumaya, oradan Kur&apos;an okumaya hazırlığa uzanan 12 ünite. Bütün dersler serbestçe açılabilir.
            Her derste kısa anlatım, rehberli örnekler, alıştırma, 30 soruluk takım oyunu, yanlışlara yönelik tekrar ve öğretmen değerlendirmesi vardır.
          </p>
        </section>
        <LessonMap />
        <footer className="mt-10 border-t-2 border-line pt-4">
          <Disclaimer />
        </footer>
      </main>
    </>
  );
}
