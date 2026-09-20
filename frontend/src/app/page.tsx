"use client";

import Link from "next/link";
import { useState } from "react";

import { PoolCard } from "@/components/pool-card";
import { useDemoStore } from "@/contexts/demo-store";

import type { PoolSummary } from "@/types";

export default function PoolsPage() {
  const { pools, removePool } = useDemoStore();

  const [selectedPool, setSelectedPool] =
    useState<PoolSummary | null>(null);

  const [feedback, setFeedback] = useState("");

  function confirmRemoval() {
    if (!selectedPool) {
      return;
    }

    removePool(selectedPool.id);

    setFeedback(
      selectedPool.isOwner
        ? `${selectedPool.name} foi excluído.`
        : `Você saiu de ${selectedPool.name}.`,
    );

    setSelectedPool(null);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-extrabold tracking-[0.2em] text-lime-400">
            SUAS DISPUTAS
          </span>

          <h1 className="mt-3 text-4xl font-extrabold">
            Bolões
          </h1>

          <p className="mt-2 text-slate-400">
            Crie um bolão ou entre usando um código.
          </p>
        </div>

        <Link
          href="/palpites"
          className="rounded-xl border border-lime-400 px-5 py-3 text-center font-bold text-lime-400"
        >
          Palpites da rodada
        </Link>
      </header>

      {feedback && (
        <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-emerald-300">
          {feedback}
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
          <div className="mt-5 rounded-2xl border border-dashed border-slate-700 p-10 text-center">
            <span className="text-4xl">⚽</span>

            <h3 className="mt-4 text-xl font-extrabold">
              Nenhum bolão ativo
            </h3>

            <p className="mt-2 text-slate-400">
              Crie um bolão ou entre utilizando
              um código.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {pools.map((pool) => (
              <PoolCard
                key={pool.id}
                pool={pool}
                onRemove={setSelectedPool}
              />
            ))}
          </div>
        )}
      </section>

      {selectedPool && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-5 backdrop-blur-sm">
          <section className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0e2131] p-6">
            <span className="text-3xl">
              {selectedPool.isOwner ? "⚠️" : "🚪"}
            </span>

            <h2 className="mt-4 text-2xl font-extrabold">
              {selectedPool.isOwner
                ? "Excluir bolão?"
                : "Sair do bolão?"}
            </h2>

            <p className="mt-3 leading-6 text-slate-400">
              {selectedPool.isOwner
                ? `O bolão "${selectedPool.name}" será removido. Esta ação não poderá ser desfeita nesta demonstração.`
                : `Você deixará de participar de "${selectedPool.name}".`}
            </p>

            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setSelectedPool(null)
                }
                className="flex-1 rounded-xl border border-slate-600 px-4 py-3 font-bold"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmRemoval}
                className="flex-1 rounded-xl bg-red-500 px-4 py-3 font-extrabold text-white"
              >
                {selectedPool.isOwner
                  ? "Excluir"
                  : "Sair"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}