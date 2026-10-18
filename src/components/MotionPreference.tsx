"use client";
import { useEffect } from "react";
import { usePersisted } from "@/lib/storage";

/** Öğretmenin hareket ayarını <html data-motion> özniteliğine yansıtır. */
export function MotionPreference() {
  const settings = usePersisted("settings");
  useEffect(() => {
    const el = document.documentElement;
    if (settings.motion === "system") el.removeAttribute("data-motion");
    else el.setAttribute("data-motion", settings.motion);
  }, [settings.motion]);
  return null;
}
