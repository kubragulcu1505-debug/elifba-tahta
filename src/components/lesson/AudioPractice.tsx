"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { AudioItem } from "@/content/types";
import { useRecordings, playRecording, stopAudio } from "@/lib/audioStore";
import { Ar } from "@/components/Arabic";
import { TapButton } from "@/components/TapButton";
import { hashSeed, mulberry32, shuffle } from "@/lib/rng";

/**
 * Dinle ve seç: yalnızca öğretmenin yükleyip onayladığı kayıtlarla çalışır.
 * Tek ses kanalı kullanılır; yarışmaya dahil değildir (iki takımın sesleri karışmasın diye).
 */
export function AudioPractice({ items }: { items: AudioItem[] }) {
  const { list, loaded } = useRecordings();
  const approved = items.filter((it) => list.some((r) => r.id === it.id && r.approved));
  const missing = items.length - approved.length;
  const [round, setRound] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);

  const approvedKey = approved.map((a) => a.id).join(",");
  const q = useMemo(() => {
    if (approved.length === 0) return null;
    const rand = mulberry32(hashSeed("audio" + round));
    const target = approved[Math.floor(rand() * approved.length)];
    const distractors = shuffle(items.filter((i) => i.id !== target.id && i.arabic !== target.arabic), rand).slice(0, 3);
    return { target, options: shuffle([target, ...distractors], rand) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, approvedKey]);

  return (
    <div>
      <p className="text-lg">
        Bu alıştırma yalnızca <strong>öğretmenin kendi sesiyle kaydedip dinleyerek onayladığı</strong> kayıtları kullanır. Tarayıcının yapay sesi kullanılmaz.
        Sesler tek kanaldan çalar; takım yarışmasına dahil değildir.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="chip bg-ok-soft text-ok">Onaylı kayıt: {approved.length}</span>
        <span className="chip bg-warn-soft text-warn">Ses kaydı gerekli: {missing}</span>
        <Link href="/ogretmen#ses" className="underline">Ses kayıtlarını yönet</Link>
      </div>
      {!loaded ? null : !q ? (
        <p className="mt-4 rounded-xl bg-warn-soft p-4 text-lg text-warn" data-testid="audio-missing">
          <strong>Ses kaydı gerekli.</strong> Bu derste onaylanmış ses kaydı yok; dinleme soruları devre dışı.
        </p>
      ) : (
        <div className="mt-4 rounded-2xl bg-surface-2 p-5">
          <TapButton className="big-btn btn-primary" onTap={() => playRecording(q.target.id)}>🔊 Dinle</TapButton>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {q.options.map((o) => {
              const state = !chosen ? undefined : o.id === q.target.id ? "correct" : o.id === chosen ? "wrong" : "dim";
              return (
                <TapButton key={o.id} className="option-btn !min-h-[96px]" state={state} disabled={!!chosen} onTap={() => setChosen(o.id)}>
                  <Ar className="text-6xl">{o.arabic}</Ar>
                </TapButton>
              );
            })}
          </div>
          {chosen && (
            <div className="mt-4 flex items-center gap-4">
              <p className="text-xl font-bold">{chosen === q.target.id ? "Doğru!" : `Dinlediğin: ${q.target.label}`}</p>
              <TapButton className="btn btn-ghost" onTap={() => { stopAudio(); setChosen(null); setRound((r) => r + 1); }}>Sıradaki</TapButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
