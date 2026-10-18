import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
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

export const metadata: Metadata = {
  title: "Elifba Tahtası",
  description:
    "Akıllı tahtada iki takımın aynı anda oynadığı, aşama aşama Elifba öğreten sınıf uygulaması. Bağımsız bir eğitim aracıdır; resmî bir kurumla bağlantısı yoktur.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f766e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${scheherazade.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <MotionPreference />
        {children}
      </body>
    </html>
  );
}
