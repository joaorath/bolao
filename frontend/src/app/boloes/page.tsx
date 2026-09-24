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
  owner_id: string;
  name: string;
  description: string | null;
  competition: string;
  visibility: string;
  invite_code: string;
  pool_members:
    | Array<{
        count: number;
      }>
    | null;
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
      pool_members(count)
    `)
    .order("created_at", {
      ascending: false,
    });

  const databasePools =
    (data ?? []) as DatabasePool[];

  const pools: PoolSummary[] =
    databasePools.map((pool) => {
      const participantCount =
        pool.pool_members?.[0]?.count ?? 0;

      return {
        id: pool.id,
        name: pool.name,
        description:
          pool.description ?? "",
        competition: pool.competition,
        participantCount,
        position: 1,
        points: 0,
        leaderPoints: 0,
        inviteCode: pool.invite_code,
        visibility:
          pool.visibility as PoolVisibility,
        matchSelectionMode: "ALL_COMPETITION",
        isOwner:
          pool.owner_id === user.id,
      };
    });

  return (
    <div className="mx-auto max-w-6xl">
      <header>
        <span className="text-xs font-extrabold tracking-[0.2em] text-lime-400">
          SUAS DISPUTAS
        </span>

        <h1 className="mt-3 text-4xl font-extrabold">
          Bolões
        </h1>

        <p className="mt-2 text-slate-400">
          Crie um bolão ou entre usando um código.
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
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold">
            Em andamento
          </h2>

          <span className="text-sm text-slate-500">
            {pools.length} bolões
          </span>
        </div>

        {pools.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-700 p-8 text-center">
            <h3 className="font-extrabold">
              Você ainda não participa de nenhum bolão
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              Crie um novo ou use um código de convite.
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