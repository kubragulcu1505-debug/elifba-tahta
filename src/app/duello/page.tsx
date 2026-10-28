import type { Metadata } from "next";
import { DuelSelect } from "@/components/duel/DuelSelect";

export const metadata: Metadata = { title: "Oyuncu seç · Elifba Tahtası" };

export default function DuelPage() {
  return <DuelSelect />;
}
