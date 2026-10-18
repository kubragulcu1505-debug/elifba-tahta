"use client";
import { useState } from "react";
import type { Question } from "@/content/types";
import { Ar, RichText } from "@/components/Arabic";
import { TapButton } from "@/components/TapButton";

/** Tek ekranlı, puansız alıştırma. Süre tutulmaz. */
export function PracticePanel({ questions }: { questions: Question[] }) {
  const [i, setI] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  if (questions.length === 0) return <p className="text-lg text-ink-soft">Bu derste alıştırma sorusu yok.</p>;
  if (i >= questions.length) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-2xl font-bold">
          Alıştırma bitti: {correctCount}/{questions.length} doğru.
        </p>
        <TapButton className="btn btn-ghost" onTap={() => { setI(0); setChosen(null); setCorrectCount(0); }}>Baştan başla</TapButton>
      </div>
    );
  }
  const q = questions[i];
  const done = chosen !== null;
  return (
    <div className="rounded-2xl bg-surface-2 p-5" data-testid="practice">
      <div className="mb-2 text-base text-ink-soft">
        Soru {i + 1}/{questions.length}
      </div>
      <h3 className="text-2xl font-bold">
        <RichText text={q.prompt} />
      </h3>
      {q.stimulus && (
        <div className="my-2 text-center text-8xl">
          <Ar>{q.stimulus}</Ar>
        </div>
      )}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {q.options.map((o) => {
          const state = !done ? undefined : o.id === q.correctOptionId ? "correct" : o.id === chosen ? "wrong" : "dim";
          return (
            <TapButton
              key={o.id}
              className="option-btn !min-h-[96px]"
              state={state}
              disabled={done}
              onTap={() => {
                setChosen(o.id);
                if (o.id === q.correctOptionId) setCorrectCount((c) => c + 1);
              }}
            >
              {o.kind === "arabic" ? <Ar className="text-6xl">{o.label}</Ar> : <span className="text-2xl font-bold">{o.label}</span>}
            </TapButton>
          );
        })}
      </div>
      {done && (
        <div className="anim-in mt-4 flex flex-wrap items-center gap-4">
          <p className={`flex-1 rounded-xl p-3 text-xl ${chosen === q.correctOptionId ? "bg-ok-soft" : "bg-bad-soft"}`}>
            <strong>{chosen === q.correctOptionId ? "Doğru! " : "Tekrar bakalım: "}</strong>
            <RichText text={q.explanation} />
          </p>
          <TapButton className="big-btn btn-primary" onTap={() => { setI(i + 1); setChosen(null); }}>
            Sıradaki ▶
          </TapButton>
        </div>
      )}
    </div>
  );
}
