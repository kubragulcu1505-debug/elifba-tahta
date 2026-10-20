import type { Metadata } from "next";
import { TugScreen } from "@/components/tug/TugScreen";

export const metadata: Metadata = { title: "Halat çekme · Elifba Tahtası" };

export default function HalatPage() {
  return <TugScreen />;
}
