import type { Metadata } from "next";

import { ranking } from "@/data/mock-data";

export const metadata: Metadata = {
  title: "Ranking",
};

export default function RankingPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <header>
        <span className="text-xs font-extrabold tracking-[0.2em] text-lime-400">
          CHARQUEONS DA RESENHA
        </span>

        <h1 className="mt-3 text-4xl font-extrabold">
          Ranking geral
        </h1>

        <p className="mt-2 text-slate-400">
          Classificação após três rodadas.
        </p>
      </header>

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-[#0e2131]">
        <div className="hidden grid-cols-[80px_1fr_110px_110px_100px] px-6 py-4 text-xs font-bold text-slate-500 md:grid">
          <span>POSIÇÃO</span>
          <span>JOGADOR</span>
          <span>EXATOS</span>
          <span>ACERTOS</span>
          <span>PONTOS</span>
        </div>

        {ranking.map((entry) => (
          <div
            key={entry.id}
            className={`grid grid-cols-[50px_1fr_auto] items-center gap-3 border-t border-slate-800 px-4 py-4 md:grid-cols-[80px_1fr_110px_110px_100px] md:px-6 ${
              entry.isCurrentUser
                ? "bg-lime-400/10"
                : ""
            }`}
          >
            <strong>
              {entry.position}º
            </strong>

            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-900 text-xs font-bold">
                {entry.initials}
              </span>

              <div>
                <strong className="block">
                  {entry.name}
                </strong>

                {entry.isCurrentUser && (
                  <span className="text-xs text-lime-400">
                    Você · subiu uma posição
                  </span>
                )}
              </div>
            </div>

            <span className="hidden md:block">
              {entry.exactScores}
            </span>

            <span className="hidden md:block">
              {entry.correctResults}
            </span>

            <strong className="text-right">
              {entry.points} pts
            </strong>
          </div>
        ))}
      </section>
    </div>
  );
}