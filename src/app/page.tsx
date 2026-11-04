import type { CSSProperties } from "react";
import { SiteHeader, Disclaimer } from "@/components/SiteHeader";
import { LessonMap } from "@/components/LessonMap";

/** Kahraman alanında süzülen harf kutuları: harf, konum, boyut, renk, eğim, gecikme. */
const LETTERS: { ch: string; style: CSSProperties }[] = [
  { ch: "ا", style: { right: "30%", top: "14%", "--s": "86px", "--c": "#fde047", "--r": "-8deg", "--d": "0s" } as CSSProperties },
  { ch: "ب", style: { right: "17%", top: "8%", "--s": "70px", "--c": "#86efac", "--r": "7deg", "--d": "0.6s" } as CSSProperties },
  { ch: "ت", style: { right: "4%", top: "20%", "--s": "92px", "--c": "#fdba74", "--r": "-4deg", "--d": "1.2s" } as CSSProperties },
  { ch: "ج", style: { right: "23%", bottom: "12%", "--s": "78px", "--c": "#93c5fd", "--r": "9deg", "--d": "0.3s" } as CSSProperties },
  { ch: "د", style: { right: "8%", bottom: "8%", "--s": "66px", "--c": "#f9a8d4", "--r": "-10deg", "--d": "0.9s" } as CSSProperties },
];

export default function Home() {
  return (
    <>
      <SiteHeader current="home" />
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-6">
        <section className="hero mb-8" aria-labelledby="hero-h">
          <div className="hero-letters" aria-hidden="true">
            {LETTERS.map((l) => (
              <span key={l.ch} className="hero-letter ar" style={l.style}>
                {l.ch}
              </span>
            ))}
          </div>
          <div className="relative max-w-2xl">
            <h1 id="hero-h">Harfleri öğren, takımını zafere taşı! 🚀</h1>
            <p className="mt-3">
              Kur&apos;an harflerini tanımaktan harekeli ve birleşik okumaya uzanan 12 ünite. Her derste kısa anlatım, alıştırma, takım oyunu ve tekrar var.
            </p>
            <div className="hero-chips mt-4">
              <span className="hero-chip">📚 12 ünite</span>
              <span className="hero-chip">🎮 7 oyun</span>
              <span className="hero-chip">⚔ Bire bir düello</span>
              <span className="hero-chip">🏆 Genel tablo</span>
            </div>
          </div>
        </section>
        <LessonMap />
        <footer className="mt-10 border-t-2 border-line pt-4">
          <Disclaimer />
        </footer>
      </main>
    </>
  );
}
