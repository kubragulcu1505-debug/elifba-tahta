import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";
import { MotionPreference } from "@/components/MotionPreference";

// Scheherazade New — SIL Open Font License 1.1 (src/app/fonts/OFL-ScheherazadeNew.txt).
// Font dosyaları projeyle birlikte sunulur; çalışma anında dış bağlantı gerekmez.
const scheherazade = localFont({
  src: [
    { path: "./fonts/ScheherazadeNew-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ScheherazadeNew-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-scheherazade",
  display: "block",
  preload: true,
});

// Baloo 2 (başlık, düğme) ve Nunito (metin) — SIL OFL; derleme sırasında indirilip projeyle birlikte sunulur.
const baloo = Baloo_2({ subsets: ["latin", "latin-ext"], weight: ["600", "700", "800"], variable: "--font-baloo", display: "swap" });
const nunito = Nunito({ subsets: ["latin", "latin-ext"], weight: ["400", "600", "700", "800", "900"], variable: "--font-nunito", display: "swap" });

export const metadata: Metadata = {
  title: "Elifba Tahtası",
  description:
    "Akıllı tahtada iki takımın aynı anda oynadığı, aşama aşama Elifba öğreten sınıf uygulaması. Bağımsız bir eğitim aracıdır; resmî bir kurumla bağlantısı yoktur.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6d28d9",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${scheherazade.variable} ${baloo.variable} ${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <MotionPreference />
        {children}
      </body>
    </html>
  );
}
