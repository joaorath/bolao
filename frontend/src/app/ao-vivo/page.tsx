import type { Metadata } from "next";

import { LiveMatchCard } from "@/components/live-match-card";

import {
  currentPrediction,
  liveMatch,
} from "@/data/mock-data";

export const metadata: Metadata = {
  title: "Ao vivo",
};

export default function LivePage() {
  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-xs font-extrabold text-red-400">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          AO VIVO AGORA
        </span>

        <h1 className="mt-4 text-4xl font-extrabold">
          Remo × Paysandu
        </h1>

        <p className="mt-2 text-slate-400">
          Campeonato Paraense · Rodada 4 · Mangueirão
        </p>
      </header>

      <LiveMatchCard
        match={liveMatch}
        prediction={currentPrediction}
      />

      <section className="mt-6 rounded-2xl border border-slate-800 bg-[#0e2131] p-6">
        <h2 className="text-xl font-extrabold">
          Seu palpite
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          O palpite foi bloqueado no início da partida.
        </p>

        <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-950/40 p-5">
          <span>Remo</span>

          <strong className="text-2xl">
            2 × 1
          </strong>

          <span>Paysandu</span>
        </div>
      </section>
    </div>
  );
}