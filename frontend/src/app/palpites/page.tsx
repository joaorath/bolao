"use client";

import Link from "next/link";
import { useState } from "react";

import { PredictionList } from "@/components/prediction-list";
import { useDemoStore } from "@/contexts/demo-store";

export default function PredictionsPage() {
  const {
    pools,
    ready,
  } = useDemoStore();

  const [
    selectedPoolId,
    setSelectedPoolId,
  ] = useState<string | null>(null);

  const activePoolId =
    selectedPoolId &&
    pools.some(
      (pool) => pool.id === selectedPoolId,
    )
      ? selectedPoolId
      : pools[0]?.id;

  if (!ready) {
    return (
      <div className="mx-auto max-w-4xl text-slate-400">
        Carregando palpites...
      </div>
    );
  }

  if (!activePoolId) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-extrabold">
          Palpites
        </h1>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-[#0e2131] p-8 text-center">
          <p className="text-slate-400">
            Entre em um bolão para começar a
            palpitar.
          </p>

          <Link
            href="/boloes"
            className="mt-5 inline-block rounded-xl bg-lime-400 px-5 py-3 font-extrabold text-slate-950"
          >
            Ver bolões
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header>
        <span className="text-xs font-extrabold tracking-[0.2em] text-lime-400">
          SEUS JOGOS
        </span>

        <h1 className="mt-3 text-4xl font-extrabold">
          Palpites
        </h1>

        <p className="mt-2 text-slate-400">
          Escolha um bolão e registre os placares.
        </p>
      </header>

      <div className="mt-8">
        <label
          htmlFor="pool-selector"
          className="mb-2 block text-sm font-bold text-slate-300"
        >
          Bolão selecionado
        </label>

        <select
          id="pool-selector"
          value={activePoolId}
          onChange={(event) =>
            setSelectedPoolId(
              event.target.value,
            )
          }
          className="w-full rounded-xl border border-slate-700 bg-[#0e2131] px-4 py-3 outline-none focus:border-lime-400"
        >
          {pools.map((pool) => (
            <option
              key={pool.id}
              value={pool.id}
            >
              {pool.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        <PredictionList
          poolId={activePoolId}
        />
      </div>
    </div>
  );
}