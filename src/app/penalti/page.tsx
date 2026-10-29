import type { Metadata } from "next";
import { PenaltyScreen } from "@/components/penalty/PenaltyScreen";

export const metadata: Metadata = { title: "Penaltı · Elifba Tahtası" };

export default function PenaltiPage() {
  return <PenaltyScreen />;
}
