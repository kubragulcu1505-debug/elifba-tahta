import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { CheckPage } from "@/components/check/CheckPage";

export const metadata: Metadata = { title: "Cihaz ve görüntü testi · Elifba Tahtası" };

export default function KontrolPage() {
  return (
    <>
      <SiteHeader current="check" />
      <CheckPage />
    </>
  );
}
