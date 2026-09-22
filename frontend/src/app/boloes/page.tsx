"use client";

import Link from "next/link";

import { PoolCard } from "@/components/pool-card";
import { useDemoStore } from "@/contexts/demo-store";

import type { PoolSummary } from "@/types";

export default function PoolsPage() {
  const {
    pools,
    removePool,
    ready,
  } = useDemoStore();

  function handleRemovePool(pool: PoolSummary) {
    const action = pool.isOwner
      ? "excluir"
      : "sair";

    const confirmed = window.confirm(
      `Tem certeza de que deseja ${action} do bolão "${pool.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    removePool(pool.id);
  }

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

        {!ready ? (
          <div className="mt-5 rounded-2xl border border-slate-800 bg-[#0e2131] p-6 text-slate-400">
            Carregando seus bolões...
          </div>
        ) : pools.length === 0 ? (
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
                onRemove={handleRemovePool}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}