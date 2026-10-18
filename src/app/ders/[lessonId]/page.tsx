import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { LESSONS, LESSON_BY_ID } from "@/content/lessons";
import { SiteHeader } from "@/components/SiteHeader";
import { LessonView } from "@/components/lesson/LessonView";

export function generateStaticParams() {
  return LESSONS.map((l) => ({ lessonId: l.id }));
}

export async function generateMetadata({ params }: PageProps<"/ders/[lessonId]">): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = LESSON_BY_ID.get(lessonId);
  return { title: lesson ? `${lesson.title} · Elifba Tahtası` : "Ders bulunamadı" };
}

async function LessonContent({ params }: { params: PageProps<"/ders/[lessonId]">["params"] }) {
  const { lessonId } = await params;
  if (!LESSON_BY_ID.has(lessonId)) notFound();
  return <LessonView lessonId={lessonId} />;
}

export default function LessonPage({ params }: PageProps<"/ders/[lessonId]">) {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<main className="mx-auto w-full max-w-6xl flex-1 px-5 py-6 text-2xl">Ders yükleniyor…</main>}>
        <LessonContent params={params} />
      </Suspense>
    </>
  );
}
