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
  is_global: boolean;
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
          "Sua sessão expirou. Entre novamente.",
        );

        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("pools")
        .select(
          "id, name, competition, is_global",
        )
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Erro ao carregar rankings:",
          error,
        );

        setLoadError(
          "Não foi possível carregar os rankings.",
        );

        setLoading(false);
        return;
      }

      const loadedPools = (
        (data ?? []) as UserPool[]
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

      setPools(loadedPools);

      const globalPool = loadedPools.find(
        (pool) => pool.is_global,
      );

      setSelectedPoolId(
        globalPool?.id ??
          loadedPools[0]?.id ??
          "",
      );

      setLoading(false);
    }

    loadPools();
  }, []);

  const selectedPool = pools.find(
    (pool) =>
      pool.id === selectedPoolId,
  );

  const globalPool = pools.find(
    (pool) => pool.is_global,
  );

  const personalPools = pools.filter(
    (pool) => !pool.is_global,
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl rounded-2xl border border-slate-800 bg-[#0e2131] p-8 text-slate-400">
        Carregando o ranking geral...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="text-xs font-extrabold tracking-[0.2em] text-lime-400">
            CLASSIFICAÇÃO
          </span>

          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            Ranking Geral
          </h1>

          <p className="mt-2 max-w-2xl text-slate-400">
            Acompanhe a classificação de todos os
            participantes ou consulte um dos seus
            bolões.
          </p>
        </div>

        {pools.length > 0 && (
          <label className="block w-full lg:w-auto">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Visualizar ranking
            </span>

            <select
              value={selectedPoolId}
              onChange={(event) =>
                setSelectedPoolId(
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-slate-700 bg-[#0e2131] px-4 py-3 font-bold outline-none transition focus:border-lime-400 lg:min-w-72"
            >
              {globalPool && (
                <option value={globalPool.id}>
                  Ranking Geral
                </option>
              )}

              {personalPools.length > 0 && (
                <optgroup label="Meus bolões">
                  {personalPools.map((pool) => (
                    <option
                      key={pool.id}
                      value={pool.id}
                    >
                      {pool.name}
                    </option>
                  ))}
                </optgroup>
              )}
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
        <div className="mt-8 rounded-2xl border border-dashed border-slate-700 p-8 text-center sm:p-10">
          <span className="text-4xl">
            🏆
          </span>

          <h2 className="mt-4 text-xl font-extrabold">
            Ranking indisponível
          </h2>

          <p className="mt-2 text-slate-400">
            Não foi possível encontrar um ranking
            associado à sua conta.
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
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {selectedPool.competition}
              </span>

              <h2 className="mt-1 text-2xl font-extrabold">
                {selectedPool.name}
              </h2>
            </div>

            {selectedPool.is_global && (
              <span className="w-fit rounded-full border border-lime-400/30 bg-lime-400/10 px-3 py-1.5 text-xs font-extrabold text-lime-400">
                TODOS OS PARTICIPANTES
              </span>
            )}
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