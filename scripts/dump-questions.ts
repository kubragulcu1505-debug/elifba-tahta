import { LESSONS } from "../src/content/lessons.ts";
import { questionsForLesson } from "../src/content/index.ts";
const only = process.argv[2]?.split(",");
const n = Number(process.argv[3] ?? 4);
for (const l of LESSONS) {
  if (only && !only.includes(l.id)) continue;
  console.log(`\n=== ${l.id} ${l.title}`);
  for (const q of questionsForLesson(l.id).slice(0, n)) {
    const c = q.options.find((o) => o.id === q.correctOptionId)!.label;
    console.log(`[${q.type} d${q.difficulty}] ${q.prompt} ${q.stimulus ? "«" + q.stimulus + "»" : ""}`);
    console.log(`   ✓ ${c}   ✗ ${q.options.filter((o) => o.id !== q.correctOptionId).map((o) => o.label).join("  |  ")}`);
    console.log(`   ℹ ${q.explanation}`);
  }
}
