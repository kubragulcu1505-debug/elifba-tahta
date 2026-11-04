import Link from "next/link";

export function SiteHeader({ current }: { current?: "home" | "teacher" | "check" | "duel" | "board" }) {
  const item = (href: string, label: string, key: string) => (
    <Link href={href} className={`nav-pill ${current === key ? "on" : ""}`} aria-current={current === key ? "page" : undefined}>
      {label}
    </Link>
  );
  return (
    <header className="site-head">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-5 py-3">
        <Link href="/" className="mr-auto flex items-center gap-3">
          <span className="site-logo" aria-hidden="true">
            <span className="ar">اَبَ</span>
          </span>
          <span className="site-title">
            Elifba Tahtası
            <small>Oyna · Öğren · Kazan</small>
          </span>
        </Link>
        {item("/", "🗺 Ders haritası", "home")}
        {item("/duello", "⚔ Düello", "duel")}
        {item("/tablo", "🏆 Genel tablo", "board")}
        {item("/ogretmen", "👩‍🏫 Öğretmen", "teacher")}
        {item("/kontrol", "🖥 Cihaz testi", "check")}
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
