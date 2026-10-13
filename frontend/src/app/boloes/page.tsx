import Link from "next/link";
import { redirect } from "next/navigation";

import { PoolCard } from "@/components/pool-card";
import { createClient } from "@/lib/supabase/server";

import type {
  PoolSummary,
  PoolVisibility,
} from "@/types";

export const dynamic = "force-dynamic";

type PoolsPageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

type DatabasePool = {
  id: string;
  owner_id: string | null;
  name: string;
  description: string | null;
  competition: string;
  visibility: string;
  invite_code: string;
  is_global: boolean;
  pool_members:
    | Array<{
        count: number;
      }>
    | null;
};

type DatabaseRankingEntry = {
  user_id: string;
  ranking_position: number | string;
  points: number | string;
  is_current_user: boolean;
};

export default async function PoolsPage({
  searchParams,
}: PoolsPageProps) {
  const parameters = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data,
    error: poolsError,
  } = await supabase
    .from("pools")
    .select(`
      id,
      owner_id,
      name,
      description,
      competition,
      visibility,
      invite_code,
      is_global,
      pool_members(count)
    `)
    .order("created_at", {
      ascending: false,
    });

  const databasePools = (
    (data ?? []) as DatabasePool[]
  ).sort((firstPool, secondPool) => {
    if (
      firstPool.is_global !==
      secondPool.is_global
    ) {
      return firstPool.is_global ? -1 : 1;
    }

    return firstPool.name.localeCompare(
      secondPool.name,
      "pt-BR",
    );
  });

  const pools: PoolSummary[] =
  await Promise.all(
    databasePools.map(async (pool) => {
      const participantCount =
        pool.pool_members?.[0]?.count ?? 0;

      const {
        data: rankingData,
        error: rankingError,
      } = await supabase.rpc(
        "get_pool_ranking_summary",
        {
          target_pool_id: pool.id,
          ranking_limit: 100,
        },
      );

      if (rankingError) {
        console.error(
          `Erro ao carregar ranking do bolão ${pool.id}:`,
          rankingError,
        );
      }

      const ranking =
        (rankingData ??
          []) as DatabaseRankingEntry[];

      const currentUserEntry =
        ranking.find(
          (entry) =>
            entry.is_current_user,
        );

      const leaderEntry =
        ranking.find(
          (entry) =>
            Number(
              entry.ranking_position,
            ) === 1,
        );

      return {
        id: pool.id,
        name: pool.name,
        description:
          pool.description ?? "",
        competition:
          pool.competition,
        participantCount,
        position: currentUserEntry
          ? Number(
              currentUserEntry
                .ranking_position,
            )
          : 0,
        points: currentUserEntry
          ? Number(
              currentUserEntry.points,
            )
          : 0,
        leaderPoints: leaderEntry
          ? Number(leaderEntry.points)
          : 0,
        inviteCode:
          pool.invite_code,
        visibility:
          pool.visibility as PoolVisibility,
        matchSelectionMode:
          "ALL_COMPETITION",
        isOwner:
          !pool.is_global &&
          pool.owner_id === user.id,
        isGlobal:
          pool.is_global,
      };
    }),
  );

  const personalPools = pools.filter(
    (pool) => !pool.isGlobal,
  );

  return (
    <div className="mx-auto max-w-6xl">
      <header>
        <span className="text-xs font-extrabold tracking-[0.2em] text-lime-400">
          SUAS DISPUTAS
        </span>

        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
          Bolões
        </h1>

        <p className="mt-2 text-slate-400">
          Participe do Ranking Geral, crie um
          bolão ou entre usando um código.
        </p>
      </header>

      {parameters.message && (
        <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-emerald-300">
          {parameters.message}
        </div>
      )}

      {(parameters.error || poolsError) && (
        <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-300">
          {parameters.error ??
            "Não foi possível carregar os bolões."}
        </div>
      )}

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <Link
          href="/boloes/novo"
          className="flex min-h-36 flex-col items-start justify-center rounded-2xl border border-dashed border-slate-600 bg-slate-900/40 p-6 transition hover:border-lime-400"
        >
          <span className="text-3xl text-lime-400">
            +
          </span>

          <strong className="mt-2">
            Criar novo bolão
          </strong>

          <span className="mt-1 text-sm text-slate-400">
            Escolha as regras e convide seus amigos.
          </span>
        </Link>

        <Link
          href="/boloes/entrar"
          className="flex min-h-36 flex-col items-start justify-center rounded-2xl border border-dashed border-slate-600 bg-slate-900/40 p-6 transition hover:border-lime-400"
        >
          <span className="text-2xl text-lime-400">
            #
          </span>

          <strong className="mt-2">
            Entrar com código
          </strong>

          <span className="mt-1 text-sm text-slate-400">
            Use o convite enviado pelo organizador.
          </span>
        </Link>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold">
              Suas disputas
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Você participa automaticamente do
              Ranking Geral.
            </p>
          </div>

          <span className="whitespace-nowrap text-sm text-slate-500">
            {personalPools.length}{" "}
            {personalPools.length === 1
              ? "bolão particular"
              : "bolões particulares"}
          </span>
        </div>

        {pools.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-700 p-8 text-center">
            <span className="text-4xl">
              ⚽
            </span>

            <h3 className="mt-4 font-extrabold">
              Nenhuma disputa disponível
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              Não foi possível encontrar bolões
              associados à sua conta.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {pools.map((pool) => (
              <PoolCard
                key={pool.id}
                pool={pool}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}