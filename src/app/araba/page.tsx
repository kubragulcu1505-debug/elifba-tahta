import type { Metadata } from "next";
import { TugScreen } from "@/components/tug/TugScreen";

export const metadata: Metadata = { title: "Cezalı araba yarışı · Elifba Tahtası" };

export default function ArabaPage() {
  return <TugScreen kind="race" />;
}
