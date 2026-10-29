import type { Metadata } from "next";
import { PenaltyScreen } from "@/components/penalty/PenaltyScreen";

export const metadata: Metadata = { title: "Dart · Elifba Tahtası" };

export default function DartPage() {
  return <PenaltyScreen kind="dart" />;
}
