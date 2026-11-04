import type { Metadata } from "next";
import { TugScreen } from "@/components/tug/TugScreen";

export const metadata: Metadata = { title: "Lava düşme · Elifba Tahtası" };

export default function LavaPage() {
  return <TugScreen kind="lava" />;
}
