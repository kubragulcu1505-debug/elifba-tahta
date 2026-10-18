"use client";
import { useRef, useState } from "react";
import { AUDIO_CATALOG } from "@/content/index";
import { LESSON_BY_ID } from "@/content/lessons";
import { useRecordings, saveRecording, setApproved, deleteRecording, playRecording, stopAudio } from "@/lib/audioStore";
import { Ar } from "@/components/Arabic";

const GROUPS = [...new Set(AUDIO_CATALOG.map((a) => a.lessonId))];

export function AudioManager() {
  const { list, loaded } = useRecordings();
  const [group, setGroup] = useState(GROUPS[0]);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const fileFor = useRef<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const items = AUDIO_CATALOG.filter((a) => a.lessonId === group);
  const status = (id: string) => list.find((r) => r.id === id);
  const approvedCount = AUDIO_CATALOG.filter((a) => status(a.id)?.approved).length;

  const startRec = async (id: string) => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        await saveRecording(id, blob, "mikrofon-kaydı");
        setRecordingId(null);
      };
      recorder.current = rec;
      rec.start();
      setRecordingId(id);
    } catch {
      setError("Mikrofona erişilemedi. Tarayıcı iznini kontrol edin veya ses dosyası yükleyin.");
    }
  };

  return (
    <div>
      <div className="rounded-xl bg-warn-soft p-3 text-lg text-warn">
        Uygulama <strong>hiçbir ses dosyasıyla gelmez</strong> ve tarayıcının yapay sesini kullanmaz. Kayıt yüklenip öğretmen tarafından dinlenerek
        onaylanmadıkça dinleme soruları devre dışıdır. Toplam onaylı kayıt: {approvedCount}/{AUDIO_CATALOG.length}.
      </div>
      <p className="mt-3 text-base text-ink-soft">
        Kayıtlar yalnızca bu tarayıcıda (IndexedDB) saklanır. Dinleme alıştırmaları ders sayfalarında, tek ses kanalıyla ve yarışma dışında çalışır.
      </p>
      <label className="mt-3 flex flex-wrap items-center gap-3 text-lg">
        <span className="font-bold">Ders:</span>
        <select value={group} onChange={(e) => setGroup(e.target.value)} className="min-h-12 rounded-xl border-2 border-line px-3 text-lg">
          {GROUPS.map((g) => (
            <option key={g} value={g}>{LESSON_BY_ID.get(g)?.title}</option>
          ))}
        </select>
      </label>
      {error && <p className="mt-2 text-bad">{error}</p>}
      <input
        ref={fileInput}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          const id = fileFor.current;
          e.target.value = "";
          if (f && id) {
            if (f.size > 5 * 1024 * 1024) setError("Dosya 5 MB'den büyük. Kısa bir kayıt yükleyin.");
            else await saveRecording(id, f, f.name);
          }
        }}
      />
      {!loaded ? (
        <p className="mt-4">Yükleniyor…</p>
      ) : (
        <table className="mt-4 w-full border-collapse text-left">
          <thead>
            <tr>
              <th className="border-b-2 border-line p-2">Okunuş</th>
              <th className="border-b-2 border-line p-2">Açıklama</th>
              <th className="border-b-2 border-line p-2">Durum</th>
              <th className="border-b-2 border-line p-2">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => {
              const s = status(a.id);
              return (
                <tr key={a.id} data-testid={`audio-row-${a.id}`}>
                  <td className="border-b border-line p-2 text-4xl"><Ar>{a.arabic}</Ar></td>
                  <td className="border-b border-line p-2">{a.label}</td>
                  <td className="border-b border-line p-2">
                    {!s ? (
                      <span className="chip bg-warn-soft text-warn">Ses kaydı gerekli</span>
                    ) : s.approved ? (
                      <span className="chip bg-ok-soft text-ok">Onaylandı</span>
                    ) : (
                      <span className="chip bg-surface-2">Yüklendi · dinleyip onaylayın</span>
                    )}
                  </td>
                  <td className="border-b border-line p-2">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="btn btn-ghost !min-h-10 !py-1 text-sm" onClick={() => { fileFor.current = a.id; fileInput.current?.click(); }}>
                        Dosya yükle
                      </button>
                      {recordingId === a.id ? (
                        <button type="button" className="btn bg-bad !min-h-10 !py-1 text-sm text-white" onClick={() => recorder.current?.stop()}>■ Kaydı bitir</button>
                      ) : (
                        <button type="button" className="btn btn-ghost !min-h-10 !py-1 text-sm" disabled={!!recordingId} onClick={() => startRec(a.id)}>● Mikrofonla kaydet</button>
                      )}
                      {s && (
                        <>
                          <button type="button" className="btn btn-ghost !min-h-10 !py-1 text-sm" onClick={() => playRecording(a.id)}>▶ Dinle</button>
                          <button type="button" className="btn btn-ghost !min-h-10 !py-1 text-sm" onClick={() => setApproved(a.id, !s.approved)}>
                            {s.approved ? "Onayı kaldır" : "Dinledim, onayla"}
                          </button>
                          <button type="button" className="btn btn-ghost !min-h-10 !py-1 text-sm" onClick={() => { stopAudio(); deleteRecording(a.id); }}>Sil</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
