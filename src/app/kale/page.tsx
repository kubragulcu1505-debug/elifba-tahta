import type { Metadata } from "next";
import { TugScreen } from "@/components/tug/TugScreen";

export const metadata: Metadata = { title: "Kale yıkma · Elifba Tahtası" };

export default function KalePage() {
  return <TugScreen kind="siege" />;
}
