"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import { PoolRanking } from "@/components/pool-ranking";
import { createClient } from "@/lib/supabase/client";

type UserPool = {
  id: string;
  name: string;
  competition: string;
};

export default function RankingPage() {
  const [pools, setPools] =
    useState<UserPool[]>([]);

  const [selectedPoolId, setSelectedPoolId] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  useEffect(() => {
    async function loadPools() {
      setLoading(true);
      setLoadError("");

      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoadError(
          "Sua sessão expirou.",
        );

        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("pools")
        .select(
          "id, name, competition",
        )
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Erro ao carregar bolões:",
          error,
        );

        setLoadError(
          "Não foi possível carregar seus bolões.",
        );

        setLoading(false);
        return;
      }

      const loadedPools =
        (data ?? []) as UserPool[];

      setPools(loadedPools);

      if (loadedPools.length > 0) {
        setSelectedPoolId(
          loadedPools[0].id,
        );
      }

      setLoading(false);
    }

    loadPools();
  }, []);

  const selectedPool = pools.find(
    (pool) =>
      pool.id === selectedPoolId,
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl rounded-2xl border border-slate-800 bg-[#0e2131] p-8 text-slate-400">
        Carregando seus rankings...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-extrabold tracking-[0.2em] text-lime-400">
            SUAS DISPUTAS
          </span>

          <h1 className="mt-3 text-4xl font-extrabold">
            Ranking
          </h1>

          <p className="mt-2 text-slate-400">
            Classificação atualizada de cada
            bolão.
          </p>
        </div>

        {pools.length > 0 && (
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Escolha o bolão
            </span>

            <select
              value={selectedPoolId}
              onChange={(event) =>
                setSelectedPoolId(
                  event.target.value,
                )
              }
              className="min-w-64 rounded-xl border border-slate-700 bg-[#0e2131] px-4 py-3 font-bold outline-none focus:border-lime-400"
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
          </label>
        )}
      </header>

      {loadError && (
        <div className="mt-8 rounded-xl border border-red-400/30 bg-red-400/10 p-5 text-red-300">
          {loadError}
        </div>
      )}

      {!loadError && pools.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-700 p-10 text-center">
          <span className="text-4xl">
            🏆
          </span>

          <h2 className="mt-4 text-xl font-extrabold">
            Você ainda não participa de um
            bolão
          </h2>

          <p className="mt-2 text-slate-400">
            Crie ou entre em um bolão para
            acompanhar a classificação.
          </p>

          <Link
            href="/boloes"
            className="mt-6 inline-block rounded-xl bg-lime-400 px-5 py-3 font-extrabold text-slate-950"
          >
            Ver bolões
          </Link>
        </div>
      )}

      {selectedPool && (
        <section className="mt-8">
          <div className="mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {selectedPool.competition}
            </span>

            <h2 className="mt-1 text-2xl font-extrabold">
              {selectedPool.name}
            </h2>
          </div>

          <PoolRanking
            key={selectedPool.id}
            poolId={selectedPool.id}
          />
        </section>
      )}
    </div>
  );
}