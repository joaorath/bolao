import Link from "next/link";

import type { PoolSummary } from "@/types";

type PoolCardProps = {
  pool: PoolSummary;
  onRemove?: (pool: PoolSummary) => void;
};

export function PoolCard({
  pool,
  onRemove,
}: PoolCardProps) {
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
        {pool.competition} ·{" "}
        {pool.participantCount} participantes
      </p>

      {pool.description && (
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {pool.description}
        </p>
      )}

      <div className="mt-6 grid grid-cols-3 gap-3">
        <PoolStatistic
          label="POSIÇÃO"
          value={`${pool.position}º`}
        />

        <PoolStatistic
          label="PONTOS"
          value={String(pool.points)}
        />

        <PoolStatistic
          label="LÍDER"
          value={String(pool.leaderPoints)}
        />
      </div>

      <div className="mt-6 flex gap-3">
        <Link
          href="/palpites"
          className="flex-1 rounded-xl bg-lime-400 px-4 py-3 text-center text-sm font-extrabold text-slate-950"
        >
          Abrir bolão
        </Link>

        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(pool)}
            className="rounded-xl border border-red-400/30 px-4 py-3 text-sm font-bold text-red-400 transition hover:bg-red-400/10"
          >
            {pool.isOwner ? "Excluir" : "Sair"}
          </button>
        )}
      </div>
    </article>
  );
}

function PoolStatistic({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <span className="text-[10px] font-bold tracking-wider text-slate-500">
        {label}
      </span>

      <strong className="mt-1 block text-xl">
        {value}
      </strong>
    </div>
  );
}