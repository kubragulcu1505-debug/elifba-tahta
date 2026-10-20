// Ders haritası ve içerik inceleme raporunu ders verisinden üretir.
// Çalıştırma: npm run content:docs
import { writeFileSync } from "node:fs";
import { UNITS, lessonsOfUnit, SOURCE_TITLES } from "../src/content/lessons.ts";
import { questionsForLesson, LESSON_POOLS, AUDIO_CATALOG, GAME_LESSONS } from "../src/content/index.ts";

const strip = (s: string) => s.replace(/⟪([^⟫]*)⟫/g, "$1");
const TYPE_TR: Record<string, string> = {
  "find-letter-by-name": "Adı verilen harfi bul",
  "name-of-letter": "Harfin adını seç",
  "similar-letter": "Benzer harfler arasından aynısını bul",
  dots: "Nokta sayısı ve yerine göre ayırt et",
  "letter-order": "Elifba sırası",
  "letter-form": "Harfin yazılışını eşleştir",
  "form-to-letter": "Yazılıştan harfi bul",
  joining: "Bağlanan / bağlanmayan harf",
  "letter-in-word": "Kelimede harf bul",
  "spell-to-shape": "Hecelenişten doğru heceyi seç",
  "shape-to-spell": "Hecenin hecelenişini seç",
  "identify-hareke": "Harekeyi / tenvini tanı",
  "word-spelling": "Kelimenin hecelenişini seç",
  "spelling-to-word": "Hecelenişi verilen kelimeyi seç",
  "mark-count": "İşaret sayısı",
  "which-letter-has-mark": "İşaretli harfi bul",
  "shadda-split": "Şeddeli yapıyı ayır",
  "madd-detect": "Uzatma olan örneği ayırt et",
  "madd-letter": "Med harfini bul",
  "mark-meaning": "İşaretin anlamı",
  "rule-judgement": "Kural yargısı",
  "rule-compare": "Kurala uyan örneği seç",
  transition: "Tenvinli geçiş",
};

let map = `# Ders haritası\n\nBu dosya \`npm run content:docs\` ile ders verisinden (src/content) üretilir. Elle düzenlemeyin.\n\n`;
map += `Ana omurga Diyanet'in basılı Elifbâ kitabının (K1, 4. baskı 2025) konu sırasıdır. 11. ünite çevrim içi Elif-Ba platformundan (K2) alınmıştır. Ayrıntılar: [ARASTIRMA.md](ARASTIRMA.md).\n\n`;
map += `| Ünite | Ders | Hedef | Oyun soru türleri | Zorluk (kolay/orta/zor) |\n|---|---|---|---|---|\n`;
for (const u of UNITS) {
  for (const l of lessonsOfUnit(u.id)) {
    if (l.gameLessonId) {
      map += `| ${u.order}. ${u.title} | ${strip(l.title)} | ${strip(l.goal)} | Kendi oyunu yok; ünitenin tek oyunu: “${strip(lessonsOfUnit(u.id).find((x) => x.id === l.gameLessonId)!.title)}” | – |\n`;
      continue;
    }
    const qs = questionsForLesson(l.id);
    const d = [1, 2, 3].map((k) => qs.filter((q) => q.difficulty === k).length).join("/");
    const types = [...new Set(qs.map((q) => TYPE_TR[q.type] ?? q.type))].join("; ");
    map += `| ${u.order}. ${u.title} | ${strip(l.title)} | ${strip(l.goal)} | ${types} | ${d} |\n`;
  }
}
map += `\n## Derslerin ayrıntısı\n`;
for (const u of UNITS) {
  map += `\n### ${u.order}. ${u.title}\n\n${u.summary} Kaynak: ${u.sources.map((s) => `${s.id} ${s.locator ?? ""}`.trim()).join(", ")}.\n`;
  for (const l of lessonsOfUnit(u.id)) {
    map += `\n#### ${strip(l.title)} (\`${l.id}\`)\n\n**Hedef:** ${strip(l.goal)}\n\n**Kazanımlar:**\n`;
    for (const o of l.objectives) map += `- ${strip(o.text)} _(${o.assessedBy === "game" ? "oyunla ölçülür" : "öğretmen dinleyerek değerlendirir"})_\n`;
    map += `\n**Öğretmen değerlendirmesi:**\n`;
    for (const t of l.teacherChecklist) map += `- ${strip(t)}\n`;
    if (l.notes?.length) map += `\n**Notlar:** ${l.notes.map(strip).join(" ")}\n`;
    map += `\n**İzin verilen yazım özellikleri:** ${l.allowedFeatures.join(", ")}\n`;
  }
}
writeFileSync("docs/DERS-HARITASI.md", map, "utf8");

let rev = `# İçerik inceleme durumu\n\nBu dosya \`npm run content:docs\` ile üretilir. Elle düzenlemeyin.\n\n`;
rev += `Durum anlamları:\n\n- **Kural tabanlı, otomatik denetlendi:** Harf tablosundan ve kitaptaki hece tablolarından kural ile üretildi. Otomatik testlerden geçti, ama bir insan uzman tarafından tek tek incelenmedi.\n- **Öğretmen/uzman incelemesi bekliyor:** Elle yazılmış Arapça kelime veya kural yargısı içerir (zamir, lafzatullah, râ, elif-lâm, vakf, geçiş). Kullanmadan önce öğretmen panelindeki “Soru bankası” bölümünden incelenmelidir.\n- **Doğrulanmış kaynak:** Tanzil metninden değiştirilmeden alındı.\n\n`;
rev += `| Ders | Oyun sorusu | Otomatik denetlendi | İnceleme bekliyor | Havuzdaki toplam soru |\n|---|---|---|---|---|\n`;
let tA = 0, tT = 0;
for (const l of GAME_LESSONS) {
  const qs = questionsForLesson(l.id);
  const a = qs.filter((q) => q.reviewStatus === "auto-validated").length;
  const t = qs.filter((q) => q.reviewStatus === "needs-teacher-review").length;
  tA += a;
  tT += t;
  rev += `| ${strip(l.title)} | ${qs.length} | ${a} | ${t} | ${LESSON_POOLS[l.id]?.length ?? "(önceki derslerden seçilir)"} |\n`;
}
rev += `| **Toplam (oyun başına sayım; 12. ünite önceki soruları tekrar kullanır)** | ${GAME_LESSONS.length * 30} | ${tA} | ${tT} | |\n`;
rev += `\n## Bilinen içerik sınırları\n\n`;
rev += `- Hiçbir ses kaydı yoktur. Katalogdaki ${AUDIO_CATALOG.length} kayıt (harf adları ve harekeli heceler) “Ses kaydı gerekli” durumundadır. Dinleme soruları yalnızca öğretmen kayıt yükleyip onaylayınca, ders sayfasındaki alıştırmada açılır.\n`;
rev += `- Mushafa özgü “med” ve “kasr” yazı işaretleri (K1 s.18) açık lisanslı fontlarda gösterilemediği için oyunda sorulmaz; öğretmen kitaptan çalıştırmalıdır.\n`;
rev += `- Dikey esre, kaynaktaki U+06EA yerine U+0656 (alt simge elif) ile yazılmıştır; görsel olarak dikey çizgidir. Öğrencinin mushafındaki biçimle öğretmen karşılaştırmalıdır.\n`;
rev += `- Râ dersinde yalnızca harekeli râ sorulur. Cezmli râ ve durma sırasındaki râ öğretmenle çalışılır.\n`;
rev += `- Vakf dersinde iki üstünle biten kelimeler ve yuvarlak te (ة) sorulmaz.\n`;
rev += `- Tenvinli geçiş örnekleri kural örneğidir; âyet olarak sunulmaz.\n`;
rev += `- Kısa sûreler Tanzil (Medine imlâsına yakın) metnidir; Türk mushaflarıyla yazım farkları vardır.\n`;
rev += `\n## Kaynak kodları\n\n` + Object.entries(SOURCE_TITLES).map(([k, v]) => `- **${k}:** ${v}`).join("\n") + "\n";
writeFileSync("docs/ICERIK-INCELEME.md", rev, "utf8");
console.log("docs/DERS-HARITASI.md ve docs/ICERIK-INCELEME.md yazıldı");
