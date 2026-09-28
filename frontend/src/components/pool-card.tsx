import Link from "next/link";

import { PoolCardActions } from "@/components/pool-card-actions";

import type { PoolSummary } from "@/types";

type PoolCardProps = {
  pool: PoolSummary;
  onRemove?: (pool: PoolSummary) => void;
};

export function PoolCard({
  pool,
  onRemove,
}: PoolCardProps) {
  const isGlobal = Boolean(
    pool.isGlobal,
  );

  return (
    <article
      className={`rounded-2xl border p-5 transition hover:-translate-y-1 ${
        isGlobal
          ? "border-lime-400/40 bg-gradient-to-br from-lime-400/10 to-[#0e2131] hover:border-lime-400"
          : "border-slate-800 bg-[#0e2131] hover:border-slate-600"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl font-extrabold text-slate-950 ${
            isGlobal
              ? "bg-lime-400"
              : "bg-sky-400"
          }`}
        >
          {isGlobal ? "🏆" : "CL"}
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            isGlobal
              ? "border border-lime-400/30 bg-lime-400/10 text-lime-400"
              : "bg-emerald-400/10 text-emerald-400"
          }`}
        >
          {isGlobal ? "OFICIAL" : "ATIVO"}
        </span>
      </div>

      <h3 className="mt-5 text-lg font-extrabold">
        {pool.name}
      </h3>

      <p className="mt-1 text-sm text-slate-400">
        {pool.competition}
        {" · "}
        {pool.participantCount}{" "}
        {pool.participantCount === 1
          ? "participante"
          : "participantes"}
      </p>

      {pool.description && (
        <p className="mt-3 text-sm leading-6 text-slate-400">
          {pool.description}
        </p>
      )}

      {isGlobal ? (
        <div className="mt-5 grid grid-cols-3 gap-3">
          <PoolStatistic
            label="ENTRADA"
            value="Auto"
          />

          <PoolStatistic
            label="ABRANGÊNCIA"
            value="Geral"
          />

          <PoolStatistic
            label="TIPO"
            value="Oficial"
          />
        </div>
      ) : (
        <>
          {pool.isOwner &&
            pool.inviteCode && (
              <div className="mt-4 rounded-xl bg-slate-950/40 p-3">
                <span className="text-[10px] font-bold tracking-wider text-slate-500">
                  CÓDIGO DE CONVITE
                </span>

                <strong className="mt-1 block tracking-[0.15em] text-lime-400">
                  {pool.inviteCode}
                </strong>
              </div>
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
              value={String(
                pool.leaderPoints,
              )}
            />
          </div>
        </>
      )}

      <div className="mt-6 flex gap-3">
        <Link
          href={`/boloes/${pool.id}`}
          className="flex-1 rounded-xl bg-lime-400 px-4 py-3 text-center text-sm font-extrabold text-slate-950 transition hover:bg-lime-300"
        >
          {isGlobal
            ? "Abrir Bolão Geral"
            : "Abrir bolão"}
        </Link>

        {!isGlobal &&
          (onRemove ? (
            <button
              type="button"
              onClick={() =>
                onRemove(pool)
              }
              className="rounded-xl border border-red-400/30 px-4 py-3 text-sm font-bold text-red-400 transition hover:bg-red-400/10"
            >
              {pool.isOwner
                ? "Excluir"
                : "Sair"}
            </button>
          ) : (
            <PoolCardActions
              poolId={pool.id}
              poolName={pool.name}
              isOwner={Boolean(
                pool.isOwner,
              )}
            />
          ))}
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
    <div className="min-w-0">
      <span className="block truncate text-[10px] font-bold tracking-wider text-slate-500">
        {label}
      </span>

      <strong className="mt-1 block truncate text-base sm:text-xl">
        {value}
      </strong>
    </div>
  );
}