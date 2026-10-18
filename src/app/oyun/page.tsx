import type { Metadata } from "next";
import { GameScreen } from "@/components/game/GameScreen";

export const metadata: Metadata = { title: "Takım oyunu · Elifba Tahtası" };

export default function OyunPage() {
  return <GameScreen />;
}
