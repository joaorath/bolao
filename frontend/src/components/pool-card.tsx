import type { PoolSummary } from "@/types";

type PoolCardProps = {
  pool: PoolSummary;
};

export function PoolCard({ pool }: PoolCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-[#0e2131] p-5 transition hover:-translate-y-1 hover:border-slate-600">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-400 font-extrabold text-slate-950">
          CL
        </div>

        <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-400">
          ATIVO
        </span>
      </div>

      <h3 className="mt-5 text-lg font-extrabold">
        {pool.name}
      </h3>

      <p className="mt-1 text-sm text-slate-400">
        {pool.competition} · {pool.participantCount} participantes
      </p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div>
          <span className="text-[10px] font-bold tracking-wider text-slate-500">
            POSIÇÃO
          </span>

          <strong className="mt-1 block text-xl">
            {pool.position}º
          </strong>
        </div>

        <div>
          <span className="text-[10px] font-bold tracking-wider text-slate-500">
            PONTOS
          </span>

          <strong className="mt-1 block text-xl">
            {pool.points}
          </strong>
        </div>

        <div>
          <span className="text-[10px] font-bold tracking-wider text-slate-500">
            LÍDER
          </span>

          <strong className="mt-1 block text-xl">
            {pool.leaderPoints}
          </strong>
        </div>
      </div>

      <button className="mt-6 w-full rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold transition hover:border-lime-400 hover:text-lime-400">
        Entrar no bolão
      </button>
    </article>
  );
}