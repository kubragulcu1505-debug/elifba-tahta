import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { TeacherPanel } from "@/components/teacher/TeacherPanel";

export const metadata: Metadata = { title: "Öğretmen paneli · Elifba Tahtası" };

export default function TeacherPage() {
  return (
    <>
      <SiteHeader current="teacher" />
      <TeacherPanel />
    </>
  );
}
