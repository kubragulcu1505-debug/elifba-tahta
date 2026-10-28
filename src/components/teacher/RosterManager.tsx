"use client";
// Öğretmen panelinde sınıf ve öğrenci yönetimi: ad, fotoğraf, puan sıfırlama ve yedek.
import Link from "next/link";
import { useState } from "react";
import { read, update, usePersisted, write, downloadJson } from "@/lib/storage";
import { newId, studentsOfClass, type DuelRecord, type Roster, type Student } from "@/lib/roster";
import { allPhotos, deletePhoto, refreshPhotos, resizePhoto, savePhoto } from "@/lib/photoStore";
import { Avatar } from "@/components/PlayerAvatar";

const BACKUP_APP = "elifba-tahta-sinif";

export function RosterManager() {
  const roster = usePersisted("roster");
  const ui = usePersisted("ui");
  const [newClass, setNewClass] = useState("");
  const [bulk, setBulk] = useState("");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [fileKey, setFileKey] = useState(0);

  const classId = roster.classes.some((c) => c.id === ui.duel?.classId) ? ui.duel?.classId : roster.classes[0]?.id;
  const cls = roster.classes.find((c) => c.id === classId);
  const students = studentsOfClass(roster, classId);
  const selectClass = (id: string) => update("ui", (u) => ({ ...u, duel: { game: u.duel?.game ?? "letters", lessonId: u.duel?.lessonId ?? "u1-l6", classId: id } }));
  const setRoster = (fn: (r: Roster) => Roster) => update("roster", fn);

  const addClass = () => {
    const n = newClass.trim();
    if (!n) return;
    const id = newId("sinif");
    setRoster((r) => ({ ...r, classes: [...r.classes, { id, name: n }] }));
    selectClass(id);
    setNewClass("");
  };

  const addStudents = async (names: string[], photo?: File | null) => {
    if (!classId) return;
    const clean = names.map((n) => n.trim().replace(/\s+/g, " ")).filter(Boolean);
    if (!clean.length) return;
    setBusy(true);
    setMsg(null);
    try {
      const created: Student[] = clean.map((n) => ({ id: newId("ogr"), classId, name: n, createdAtEpoch: Date.now() }));
      setRoster((r) => ({ ...r, students: [...r.students, ...created] }));
      if (photo && created.length === 1) await savePhoto(created[0].id, await resizePhoto(photo));
      setMsg(created.length === 1 ? `${created[0].name} eklendi.` : `${created.length} öğrenci eklendi.`);
    } catch {
      setMsg("Fotoğraf okunamadı. Başka bir resim deneyin.");
    } finally {
      setBusy(false);
    }
  };

  const changePhoto = async (id: string, f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    setMsg(null);
    try {
      await savePhoto(id, await resizePhoto(f));
    } catch {
      setMsg("Fotoğraf okunamadı. Başka bir resim deneyin.");
    } finally {
      setBusy(false);
    }
  };

  const removeStudent = async (id: string) => {
    setRoster((r) => ({ ...r, students: r.students.filter((s) => s.id !== id) }));
    await deletePhoto(id).catch(() => {});
    setConfirm(null);
  };

  const removeClass = async () => {
    if (!classId) return;
    const ids = students.map((s) => s.id);
    setRoster((r) => ({ classes: r.classes.filter((c) => c.id !== classId), students: r.students.filter((s) => s.classId !== classId) }));
    for (const id of ids) await deletePhoto(id).catch(() => {});
    setConfirm(null);
  };

  const resetScores = () => {
    const ids = new Set(students.map((s) => s.id));
    write("duels", read("duels").filter((d) => !ids.has(d.players.left.studentId) && !ids.has(d.players.right.studentId)));
    setConfirm(null);
    setMsg("Bu sınıfın puanları sıfırlandı.");
  };

  const backup = async () => {
    await refreshPhotos();
    const photos = allPhotos();
    const ids = new Set(read("roster").students.map((s) => s.id));
    downloadJson(`elifba-sinif-yedegi-${new Date().toISOString().slice(0, 10)}.json`, {
      app: BACKUP_APP,
      version: 1,
      exportedAt: new Date().toISOString(),
      roster: read("roster"),
      duels: read("duels"),
      photos: Object.fromEntries(Object.entries(photos).filter(([id]) => ids.has(id))),
    });
  };

  const restore = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    setMsg(null);
    try {
      const data = JSON.parse(await f.text()) as { app?: string; roster?: Roster; duels?: DuelRecord[]; photos?: Record<string, string> };
      if (data.app !== BACKUP_APP || !data.roster || !Array.isArray(data.roster.classes) || !Array.isArray(data.roster.students)) {
        throw new Error("Geçersiz yedek");
      }
      write("roster", data.roster);
      write("duels", Array.isArray(data.duels) ? data.duels : []);
      for (const [id, url] of Object.entries(data.photos ?? {})) {
        if (typeof url === "string" && url.startsWith("data:image/")) await savePhoto(id, url);
      }
      setMsg(`Yedek yüklendi: ${data.roster.classes.length} sınıf, ${data.roster.students.length} öğrenci.`);
    } catch {
      setMsg("Bu dosya bir sınıf yedeği değil.");
    } finally {
      setBusy(false);
      setFileKey((k) => k + 1);
    }
  };

  return (
    <div className="flex flex-col gap-5" data-testid="roster-manager">
      <p className="rounded-xl bg-warn-soft p-3 text-base">
        Öğrenci adları ve fotoğrafları <strong>yalnızca bu cihazın tarayıcısında</strong> saklanır; internete, sunucuya veya GitHub&apos;a gönderilmez.
        Öğrenci fotoğrafı kişisel veridir: kullanmadan önce veli izni ve okul idaresinin onayı alınması önerilir. Fotoğraf eklemek zorunlu değildir;
        fotoğrafsız öğrencide adının baş harfleri görünür.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-lg">
          <span className="font-bold">Sınıf</span>
          <select value={classId ?? ""} onChange={(e) => selectClass(e.target.value)} className="min-h-12 min-w-40 rounded-xl border-2 border-line px-3 text-lg" disabled={!roster.classes.length}>
            {!roster.classes.length && <option value="">Henüz sınıf yok</option>}
            {roster.classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-lg">
          <span className="font-bold">Yeni sınıf</span>
          <input value={newClass} onChange={(e) => setNewClass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addClass()} placeholder="ör. 6-A" className="min-h-12 w-40 rounded-xl border-2 border-line px-3 text-lg" data-testid="new-class" />
        </label>
        <button type="button" className="btn btn-primary" onClick={addClass} disabled={!newClass.trim()}>Sınıf ekle</button>
        <Link href="/duello" className="btn btn-ghost inline-flex items-center">⚔ Oyuncu seçim ekranı</Link>
        <Link href="/tablo" className="btn btn-ghost inline-flex items-center">🏆 Genel tablo</Link>
      </div>

      {cls && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border-2 border-line p-4">
              <h3 className="text-xl font-bold">Öğrenci ekle ({cls.name})</h3>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1">
                  <span className="font-semibold">Ad soyad</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="min-h-12 w-64 rounded-xl border-2 border-line px-3 text-lg" data-testid="student-name" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-semibold">Fotoğraf (isteğe bağlı)</span>
                  <input key={fileKey} type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="max-w-64 text-base" data-testid="student-photo" />
                </label>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!name.trim() || busy}
                  onClick={async () => {
                    await addStudents([name], file);
                    setName("");
                    setFile(null);
                    setFileKey((k) => k + 1);
                  }}
                >
                  Ekle
                </button>
              </div>
            </div>
            <div className="rounded-2xl border-2 border-line p-4">
              <h3 className="text-xl font-bold">Toplu ekle</h3>
              <p className="text-base text-ink-soft">Her satıra bir öğrenci adı yazın. Fotoğrafları sonra kartlardan ekleyebilirsiniz.</p>
              <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={3} className="mt-2 w-full rounded-xl border-2 border-line p-2 text-lg" data-testid="bulk-names" />
              <button
                type="button"
                className="btn btn-primary mt-2"
                disabled={!bulk.trim() || busy}
                onClick={async () => {
                  await addStudents(bulk.split(/\r?\n/));
                  setBulk("");
                }}
              >
                Listeyi ekle
              </button>
            </div>
          </div>

          {msg && <p className="font-bold text-ok" role="status">{msg}</p>}

          <div>
            <h3 className="mb-2 text-xl font-bold">{cls.name} öğrencileri ({students.length})</h3>
            {!students.length && <p className="text-ink-soft">Bu sınıfta henüz öğrenci yok.</p>}
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {students.map((s) => (
                <li key={s.id} className="flex items-center gap-3 rounded-2xl border-2 border-line p-3" data-testid="student-row">
                  <Avatar id={s.id} name={s.name} size={64} />
                  <div className="min-w-0 flex-1">
                    {editing?.id === s.id ? (
                      <input
                        value={editing.name}
                        autoFocus
                        onChange={(e) => setEditing({ id: s.id, name: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && editing.name.trim()) {
                            setRoster((r) => ({ ...r, students: r.students.map((x) => (x.id === s.id ? { ...x, name: editing.name.trim() } : x)) }));
                            setEditing(null);
                          }
                          if (e.key === "Escape") setEditing(null);
                        }}
                        className="min-h-10 w-full rounded-lg border-2 border-line px-2 text-lg"
                      />
                    ) : (
                      <div className="truncate text-lg font-bold">{s.name}</div>
                    )}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {editing?.id === s.id ? (
                        <button
                          type="button"
                          className="btn btn-primary !min-h-9 !py-0 text-sm"
                          disabled={!editing.name.trim()}
                          onClick={() => {
                            setRoster((r) => ({ ...r, students: r.students.map((x) => (x.id === s.id ? { ...x, name: editing.name.trim() } : x)) }));
                            setEditing(null);
                          }}
                        >
                          Kaydet
                        </button>
                      ) : (
                        <button type="button" className="btn btn-ghost !min-h-9 !py-0 text-sm" onClick={() => setEditing({ id: s.id, name: s.name })}>Adı düzenle</button>
                      )}
                      <label className="btn btn-ghost !min-h-9 cursor-pointer !py-0 text-sm">
                        📷 Fotoğraf
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => void changePhoto(s.id, e.target.files?.[0])} />
                      </label>
                      {confirm === s.id ? (
                        <button type="button" className="btn !min-h-9 bg-bad !py-0 text-sm text-white" onClick={() => void removeStudent(s.id)}>Evet, sil</button>
                      ) : (
                        <button type="button" className="btn btn-ghost !min-h-9 !py-0 text-sm" onClick={() => setConfirm(s.id)}>Sil</button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t-2 border-line pt-4">
            {confirm === "scores" ? (
              <span className="flex flex-wrap items-center gap-2 rounded-xl bg-bad-soft p-2">
                <span className="font-bold text-bad">{cls.name} sınıfının bütün düello puanları silinecek. Emin misiniz?</span>
                <button type="button" className="btn bg-bad text-white" onClick={resetScores}>Evet, sıfırla</button>
                <button type="button" className="btn btn-ghost" onClick={() => setConfirm(null)}>Vazgeç</button>
              </span>
            ) : (
              <button type="button" className="btn btn-ghost" onClick={() => setConfirm("scores")}>Bu sınıfın puanlarını sıfırla…</button>
            )}
            {confirm === "class" ? (
              <span className="flex flex-wrap items-center gap-2 rounded-xl bg-bad-soft p-2">
                <span className="font-bold text-bad">{cls.name} sınıfı, öğrencileri ve fotoğrafları silinecek. Emin misiniz?</span>
                <button type="button" className="btn bg-bad text-white" onClick={() => void removeClass()}>Evet, sil</button>
                <button type="button" className="btn btn-ghost" onClick={() => setConfirm(null)}>Vazgeç</button>
              </span>
            ) : (
              <button type="button" className="btn btn-ghost" onClick={() => setConfirm("class")}>Sınıfı sil…</button>
            )}
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t-2 border-line pt-4">
        <button type="button" className="btn btn-primary" onClick={() => void backup()} disabled={!roster.classes.length}>
          Sınıf yedeğini indir (fotoğraflar dahil)
        </button>
        <label className="btn btn-ghost cursor-pointer">
          Yedekten yükle
          <input key={`r${fileKey}`} type="file" accept="application/json,.json" className="hidden" onChange={(e) => void restore(e.target.files?.[0])} />
        </label>
        <span className="text-base text-ink-soft">
          Veriler yalnızca bu tarayıcıda durur; tarayıcı verileri silinirse kaybolur. Düzenli yedek alın. Yedek başka bir tahtaya da yüklenebilir.
        </span>
      </div>
    </div>
  );
}
