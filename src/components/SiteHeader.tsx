import Link from "next/link";

export function SiteHeader({ current }: { current?: "home" | "teacher" | "check" | "duel" | "board" }) {
  const item = (href: string, label: string, key: string) => (
    <Link
      href={href}
      className={`btn inline-flex items-center ${current === key ? "btn-primary" : "btn-ghost"}`}
      aria-current={current === key ? "page" : undefined}
    >
      {label}
    </Link>
  );
  return (
    <header className="border-b-2 border-line bg-surface">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-5 py-3">
        <Link href="/" className="mr-auto flex items-center gap-3">
          <span className="ar text-4xl leading-none text-brand" aria-hidden="true">
            اَ بَ
          </span>
          <span className="text-2xl font-extrabold">Elifba Tahtası</span>
        </Link>
        {item("/", "Ders haritası", "home")}
        {item("/duello", "⚔ Düello", "duel")}
        {item("/tablo", "🏆 Genel tablo", "board")}
        {item("/ogretmen", "Öğretmen paneli", "teacher")}
        {item("/kontrol", "Cihaz ve görüntü testi", "check")}
      </div>
    </header>
  );
}

export function Disclaimer() {
  return (
    <p className="text-sm text-ink-soft">
      Bu uygulama bağımsız bir eğitim aracıdır; Diyanet İşleri Başkanlığı veya başka bir resmî kurumla bağlantısı ya da onayı yoktur.
      Öğretim sırası, Diyanet&apos;in yayımladığı Elifbâ materyalleri incelenerek kurulmuştur (kaynaklar: docs/ARASTIRMA.md).
    </p>
  );
}
