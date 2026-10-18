"use client";
import { useState } from "react";
import Link from "next/link";
import { usePersisted, update, type Mark } from "@/lib/storage";
import { RichText } from "@/components/Arabic";

export const MARK_LABEL: Record<Mark, string> = { "not-yet": "Henüz değil", developing: "Gelişiyor", achieved: "Başardı" };
const MARK_STYLE: Record<Mark, string> = {
  "not-yet": "bg-bad-soft text-bad border-bad",
  developing: "bg-warn-soft text-warn border-warn",
  achieved: "bg-ok-soft text-ok border-ok",
};

export function newStudentId() {
  return "s" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
}

/** Öğretmenin öğrenciyi dinleyerek işaretlediği değerlendirme. Takım puanından otomatik çıkarım yapılmaz. */
export function TeacherEval({ lessonId, items }: { lessonId: string; items: string[] }) {
  const ev = usePersisted("evaluations");
  const [name, setName] = useState("");

  const setMark = (studentId: string, idx: number, mark: Mark) =>
    update("evaluations", (e) => {
      const cur = e.marks[studentId]?.[lessonId]?.[idx];
      const nextMarks = { ...(e.marks[studentId]?.[lessonId] ?? {}) };
      if (cur === mark) delete nextMarks[idx];
      else nextMarks[idx] = mark;
      return { ...e, marks: { ...e.marks, [studentId]: { ...(e.marks[studentId] ?? {}), [lessonId]: nextMarks } } };
    });

  const addStudent = () => {
    const n = name.trim();
    if (!n) return;
    update("evaluations", (e) => ({ ...e, students: [...e.students, { id: newStudentId(), name: n }] }));
    setName("");
  };

  return (
    <div>
      <p className="text-lg">
        Bu bölüm oyundan bağımsızdır. Öğrenciyi tek tek dinleyerek işaretleyin. Takım puanı bir öğrencinin düzeyini göstermez.
      </p>
      <ol className="mt-3 list-decimal pl-6 text-lg">
        {items.map((it, i) => (
          <li key={i}>
            <RichText text={it} />
          </li>
        ))}
      </ol>

      {ev.students.length === 0 ? (
        <p className="mt-4 rounded-xl bg-surface-2 p-3 text-lg">
          Henüz öğrenci eklenmedi. Gizlilik için ad yerine takma ad veya baş harf kullanabilirsiniz. Veriler yalnızca bu cihazda saklanır.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-base">
            <thead>
              <tr>
                <th className="border-b-2 border-line p-2">Öğrenci</th>
                {items.map((_, i) => (
                  <th key={i} className="border-b-2 border-line p-2">Madde {i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ev.students.map((s) => (
                <tr key={s.id}>
                  <td className="border-b border-line p-2 font-bold">{s.name}</td>
                  {items.map((_, i) => {
                    const cur = ev.marks[s.id]?.[lessonId]?.[i];
                    return (
                      <td key={i} className="border-b border-line p-2">
                        <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={`${s.name}, madde ${i + 1}`}>
                          {(Object.keys(MARK_LABEL) as Mark[]).map((m) => (
                            <button
                              key={m}
                              type="button"
                              role="radio"
                              aria-checked={cur === m}
                              onClick={() => setMark(s.id, i, m)}
                              className={`rounded-lg border-2 px-2 py-1 text-sm font-bold ${cur === m ? MARK_STYLE[m] : "border-line bg-surface text-ink-soft"}`}
                            >
                              {MARK_LABEL[m]}
                            </button>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="text-lg" htmlFor={`add-${lessonId}`}>Öğrenci ekle:</label>
        <input
          id={`add-${lessonId}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addStudent()}
          className="min-h-12 rounded-xl border-2 border-line px-3 text-lg"
          placeholder="Takma ad veya baş harf"
        />
        <button type="button" className="btn btn-ghost" onClick={addStudent}>Ekle</button>
        <Link href="/ogretmen#degerlendirme" className="ml-auto underline">Bütün öğrenciler ve “Kur&apos;an okumaya hazır” değerlendirmesi</Link>
      </div>
    </div>
  );
}
