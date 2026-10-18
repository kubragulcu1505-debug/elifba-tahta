"use client";
import Link from "next/link";
import { computeResult, formatMs, type GameState, type Side } from "@/lib/game";
import { TapButton } from "@/components/TapButton";
import { TeamIcon } from "@/components/TeamBadge";

export function ResultOverlay({
  game,
  names,
  threshold,
  onReview,
  onRestart,
  canReview,
}: {
  game: GameState;
  names: Record<Side, string>;
  threshold: number;
  onReview: () => void;
  onRestart: () => void;
  canReview: boolean;
}) {
  const r = computeResult(game);
  const competition = game.mode === "competition";

  let headline = "Tekrar tamamlandı!";
  if (competition) {
    if (r.winner === "tie") headline = "Berabere! İki takım da harikaydı.";
    else if (r.winner) headline = `Kazanan: ${names[r.winner]}`;
  }
  const reason =
    r.decidedBy === "correct"
      ? "Bu oyunda kazananı doğru cevap sayısı belirledi."
      : r.decidedBy === "time"
        ? "Doğru sayıları eşit olduğu için kazananı toplam süre belirledi."
        : r.decidedBy === "tie"
          ? "Doğru sayıları ve süreler eşit."
          : "";

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink/45 p-4" data-testid="result-overlay">
      <div className="card anim-pop flex max-h-full w-full max-w-5xl flex-col gap-5 overflow-auto p-[clamp(16px,3vh,40px)] text-center">
        <div className="text-[clamp(28px,5vh,56px)] font-extrabold" data-testid="winner-line">
          {competition && r.winner && r.winner !== "tie" && (
            <span className={`mr-3 inline-block align-middle ${r.winner === "left" ? "text-left" : "text-right"}`}>
              <TeamIcon side={r.winner} size={48} />
            </span>
          )}
          {headline}
        </div>
        {competition && <p className="text-[clamp(16px,2.6vh,28px)] font-semibold">İki takım da çok güzel çalıştı. Tebrikler!</p>}

        {competition && (
          <div className="grid grid-cols-2 gap-4">
            {(["left", "right"] as Side[]).map((side) => {
              const t = r.teams[side];
              const pct = t.total ? Math.round((t.correct / t.total) * 100) : 0;
              return (
                <div
                  key={side}
                  className={`rounded-2xl border-4 p-4 ${side === "left" ? "border-left bg-left-soft" : "border-right bg-right-soft"}`}
                  data-testid={`result-${side}`}
                >
                  <div className={`flex items-center justify-center gap-2 text-[clamp(20px,3.2vh,36px)] font-extrabold ${side === "left" ? "text-left" : "text-right"}`}>
                    <TeamIcon side={side} size={36} />
                    <span className="text-ink">{names[side]}</span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-[clamp(16px,2.5vh,28px)]">
                    <dt className="text-ink-soft">Doğru</dt>
                    <dd className="font-extrabold tabular-nums">{t.correct}/{t.total}</dd>
                    <dt className="text-ink-soft">Puan</dt>
                    <dd className="font-extrabold tabular-nums">{t.score}</dd>
                    <dt className="text-ink-soft">Süre</dt>
                    <dd className="font-extrabold tabular-nums">{formatMs(t.totalMs)}</dd>
                    <dt className="text-ink-soft">Başarı</dt>
                    <dd className="font-extrabold tabular-nums">%{pct}</dd>
                  </dl>
                  <p className="mt-2 text-[clamp(14px,2vh,22px)]">
                    {pct >= threshold ? "Önerilen eşiğe ulaştınız." : "Yanlışları tekrar etmek faydalı olur."}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {competition && (
          <div className="rounded-2xl bg-surface-2 p-4 text-left text-[clamp(14px,2.1vh,22px)]" data-testid="win-rule">
            <strong>Kazanma kuralı:</strong> Kazanan önce <strong>doğru cevap sayısına</strong> göre belirlenir. Doğru sayısı eşitse{" "}
            <strong>toplam tamamlama süresi kısa olan</strong> takım kazanır. Duraklama, soru yüklenmesi ve geri bildirim ekranları süreye
            eklenmez. {reason}
            <br />
            Önerilen başarı eşiği %{threshold} bir ürün ayarıdır; resmî bir ölçüt değildir. Takım puanı tek tek öğrencilerin düzeyini göstermez.
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          {canReview && (
            <TapButton className="big-btn btn-primary" onTap={onReview}>
              Yanlışları tekrar et (puansız)
            </TapButton>
          )}
          {competition && (
            <TapButton className="big-btn btn-ghost" onTap={onRestart}>
              Yeniden oyna
            </TapButton>
          )}
          <Link href={`/ders/${game.lessonId}`} className="big-btn btn-ghost inline-flex items-center border-2 border-line">
            Ders sayfası
          </Link>
          <Link href="/ogretmen" className="big-btn btn-ghost inline-flex items-center border-2 border-line">
            Öğretmen paneli
          </Link>
        </div>
      </div>
    </div>
  );
}
