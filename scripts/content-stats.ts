import { questionsForLesson, LESSON_POOLS, GAME_LESSONS } from "../src/content/index.ts";
for (const l of GAME_LESSONS) {
  const qs = questionsForLesson(l.id);
  const d = [1, 2, 3].map((k) => qs.filter((q) => q.difficulty === k).length);
  const pool = LESSON_POOLS[l.id]?.length ?? "-";
  const types = [...new Set(qs.map((q) => q.type))].join(",");
  const rev = qs.filter((q) => q.reviewStatus === "needs-teacher-review").length;
  console.log(`${l.id.padEnd(7)} havuz=${String(pool).padEnd(3)} zorluk=${d.join("/")} inceleme=${String(rev).padEnd(2)} türler=${types}`);
}
