import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { Leaderboard } from "@/components/duel/Leaderboard";

export const metadata: Metadata = { title: "Genel tablo · Elifba Tahtası" };

export default function BoardPage() {
  return (
    <>
      <SiteHeader current="board" />
      <Leaderboard />
    </>
  );
}
