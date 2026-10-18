import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl flex-1 p-10 text-center">
      <h1 className="text-4xl font-extrabold">Sayfa bulunamadı</h1>
      <p className="mt-4 text-xl text-ink-soft">Aradığınız ders veya sayfa yok. Ders haritasından devam edebilirsiniz.</p>
      <Link href="/" className="btn btn-primary mt-8 inline-flex items-center">
        Ders haritasına git
      </Link>
    </main>
  );
}
