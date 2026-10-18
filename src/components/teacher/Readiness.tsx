"use client";
import { useState } from "react";
import { usePersisted, update, type Mark } from "@/lib/storage";
import { LESSON_BY_ID, LESSON_ORDER } from "@/content/lessons";
import { MARK_LABEL, newStudentId } from "@/components/lesson/TeacherEval";
import { RichText } from "@/components/Arabic";

const FINAL = "u12-l1";

/**
 * "Kur'an okumaya hazır" yalnızca öğretmenin öğrenciyi bizzat dinledikten sonra verdiği onaydır.
 * Oyun sonuçlarından otomatik olarak çıkarılmaz.
 */
export function Readiness() {
  const ev = usePersisted("evaluations");
  const [name, setName] = useState("");
  const rubric = LESSON_BY_ID.get(FINAL)!.teacherChecklist;

  const add = () => {
    const n = name.trim();
    if (!n) return;
    update("evaluations", (e) => ({ ...e, students: [...e.students, { id: newStudentId(), name: n }] }));
    setName("");
  };
  const remove = (id: string) =>
    update("evaluations", (e) => {
      const marks = { ...e.marks };
      delete marks[id];
      const readiness = { ...e.readiness };
      delete readiness[id];
      return { students: e.students.filter((s) => s.id !== id), marks, readiness };
    });
  const setMark = (sid: string, idx: number, m: Mark) =>
    update("evaluations", (e) => ({
      ...e,
      marks: { ...e.marks, [sid]: { ...(e.marks[sid] ?? {}), [FINAL]: { ...(e.marks[sid]?.[FINAL] ?? {}), [idx]: m } } },
    }));
  const setReady = (sid: string, patch: Partial<{ ready: boolean; listenedConfirmed: boolean; note: string }>) =>
    update("evaluations", (e) => {
      const cur = e.readiness[sid] ?? { ready: false, listenedConfirmed: false, atEpoch: 0, note: "" };
      const next = { ...cur, ...patch, atEpoch: Date.now() };
      if (!next.listenedConfirmed) next.ready = false;
      return { ...e, readiness: { ...e.readiness, [sid]: next } };
    });

  return (
    <div>
      <p className="text-lg">
        Oyunları bitirmek tek başına “Kur&apos;an okumayı öğrendi” anlamına gelmez. Son aşamada her öğrenciyi dinleyerek harfleri, harekeleri ve
        birleşik okumayı değerlendirin. “Kur&apos;an okumaya hazır” işaretini yalnızca öğrenciyi bizzat dinledikten sonra verebilirsiniz.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Takma ad veya baş harf"
          className="min-h-12 rounded-xl border-2 border-line px-3 text-lg"
          aria-label="Öğrenci adı"
        />
        <button type="button" className="btn btn-primary" onClick={add}>Öğrenci ekle</button>
        <span className="text-base text-ink-soft">Veriler yalnızca bu cihazda saklanır.</span>
      </div>

      {ev.students.length === 0 ? (
        <p className="mt-4 text-lg text-ink-soft">Henüz öğrenci yok.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4" data-testid="readiness-list">
          {ev.students.map((s) => {
            const r = ev.readiness[s.id];
            const marks = ev.marks[s.id]?.[FINAL] ?? {};
            const achieved = rubric.filter((_, i) => marks[i] === "achieved").length;
            const lessonsDone = LESSON_ORDER.filter((l) => {
              const m = ev.marks[s.id]?.[l.id];
              return m && Object.values(m).length > 0 && Object.values(m).every((x) => x === "achieved");
            }).length;
            return (
              <li key={s.id} className="rounded-2xl border-2 border-line p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <strong className="text-xl">{s.name}</strong>
                  <span className="chip bg-surface-2">Tamamı “başardı” işaretli ders: {lessonsDone}/{LESSON_ORDER.length}</span>
                  {r?.ready ? (
                    <span className="chip bg-ok-soft text-ok">Kur&apos;an okumaya hazır (öğretmen onayı)</span>
                  ) : (
                    <span className="chip bg-surface-2">Henüz işaretlenmedi</span>
                  )}
                  <button type="button" className="ml-auto text-sm text-bad underline" onClick={() => remove(s.id)}>Öğrenciyi sil</button>
                </div>
                <table className="mt-3 w-full border-collapse text-left">
                  <tbody>
                    {rubric.map((item, i) => (
                      <tr key={i}>
                        <td className="border-b border-line p-2"><RichText text={item} /></td>
                        <td className="border-b border-line p-2">
                          <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={`${s.name}: ${item}`}>
                            {(Object.keys(MARK_LABEL) as Mark[]).map((m) => (
                              <button
                                key={m}
                                type="button"
                                role="radio"
                                aria-checked={marks[i] === m}
                                onClick={() => setMark(s.id, i, m)}
                                className={`rounded-lg border-2 px-2 py-1 text-sm font-bold ${
                                  marks[i] === m
                                    ? m === "achieved"
                                      ? "border-ok bg-ok-soft text-ok"
                                      : m === "developing"
                                        ? "border-warn bg-warn-soft text-warn"
                                        : "border-bad bg-bad-soft text-bad"
                                    : "border-line bg-surface text-ink-soft"
                                }`}
                              >
                                {MARK_LABEL[m]}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-lg">
                    <input type="checkbox" className="h-6 w-6" checked={!!r?.listenedConfirmed} onChange={(e) => setReady(s.id, { listenedConfirmed: e.target.checked })} />
                    Öğrenciyi bizzat dinledim
                  </label>
                  <label className="inline-flex items-center gap-2 text-lg">
                    <input
                      type="checkbox"
                      className="h-6 w-6"
                      disabled={!r?.listenedConfirmed}
                      checked={!!r?.ready}
                      onChange={(e) => setReady(s.id, { ready: e.target.checked })}
                      data-testid={`ready-${s.id}`}
                    />
                    Kur&apos;an okumaya hazır
                  </label>
                  {achieved < rubric.length && r?.listenedConfirmed && (
                    <span className="text-base text-warn">Uyarı: {rubric.length - achieved} madde henüz “başardı” değil. Karar sizindir.</span>
                  )}
                </div>
                <input
                  value={r?.note ?? ""}
                  onChange={(e) => setReady(s.id, { note: e.target.value })}
                  placeholder="Not (isteğe bağlı)"
                  className="mt-2 min-h-11 w-full rounded-xl border-2 border-line px-3"
                  aria-label={`${s.name} için not`}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
