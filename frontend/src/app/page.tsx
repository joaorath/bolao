import { ApiStatus } from "@/components/api-status";
import { LiveMatchCard } from "@/components/live-match-card";
import { PoolCard } from "@/components/pool-card";
import { RankingCard } from "@/components/ranking-card";

import {
  currentPrediction,
  liveMatch,
  pools,
  ranking,
} from "@/data/mock-data";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-extrabold tracking-[0.2em] text-lime-400">
            CAMPEONATO PARAENSE
          </span>

          <h1 className="mt-3 text-4xl font-extrabold tracking-tight">
            Olá, João! 👋
          </h1>

          <p className="mt-2 text-slate-400">
            Pronto para mais uma rodada?
          </p>
        </div>

        <button className="rounded-xl bg-lime-400 px-5 py-3 font-extrabold text-slate-950">
          + Novo bolão
        </button>
      </header>

      <div className="mb-6">
        <ApiStatus />
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <LiveMatchCard
          match={liveMatch}
          prediction={currentPrediction}
        />

        <RankingCard entries={ranking} />
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-extrabold">
          Seus bolões
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Acompanhe sua posição em cada disputa.
        </p>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {pools.map((pool) => (
            <PoolCard
              key={pool.id}
              pool={pool}
            />
          ))}
        </div>
      </section>
    </div>
  );
}