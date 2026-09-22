"use client";

import {
  useEffect,
  useState,
} from "react";

import { getPoolRanking } from "@/lib/api";

import type {
  ApiRankingEntry,
  ApiRankingResponse,
} from "@/types/api";

type RankingStatus =
  | "loading"
  | "success"
  | "error";

export function PoolRanking({
  poolId,
}: {
  poolId: string;
}) {
  const [status, setStatus] =
    useState<RankingStatus>("loading");

  const [response, setResponse] =
    useState<ApiRankingResponse | null>(null);

  async function loadRanking(
    signal?: AbortSignal,
  ) {
    setStatus("loading");

    try {
      const data = await getPoolRanking(
        poolId,
        signal,
      );

      setResponse(data);
      setStatus("success");
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      setStatus("error");
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    loadRanking(controller.signal);

    return () => controller.abort();
  }, [poolId]);

  if (status === "loading") {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0e2131] p-8 text-slate-400">
        Calculando ranking no servidor...
      </div>
    );
  }

  if (
    status === "error" ||
    !response
  ) {
    return (
      <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-6">
        <strong className="text-red-400">
          Não foi possível carregar o ranking
        </strong>

        <p className="mt-2 text-sm text-slate-400">
          Verifique se o backend está funcionando.
        </p>

        <button
          type="button"
          onClick={() => loadRanking()}
          className="mt-4 rounded-xl border border-red-400/40 px-4 py-2 text-sm font-bold text-red-300"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0e2131]">
      <div className="flex items-center justify-between border-b border-slate-800 p-6">
        <div>
          <h2 className="text-xl font-extrabold">
            Ranking do bolão
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Pontuação calculada pelo servidor.
          </p>
        </div>

        <span className="rounded-full bg-lime-400/10 px-3 py-1 text-xs font-bold text-lime-400">
          RODADA {response.round}
        </span>
      </div>

      <div className="divide-y divide-slate-800">
        {response.ranking.map((entry) => (
          <RankingRow
            key={entry.userId}
            entry={entry}
          />
        ))}
      </div>
    </section>
  );
}

function RankingRow({
  entry,
}: {
  entry: ApiRankingEntry;
}) {
  const isCurrentUser =
    entry.userId === "joao";

  return (
    <div
      className={`grid grid-cols-[48px_1fr_auto] items-center gap-4 p-5 ${
        isCurrentUser
          ? "bg-lime-400/5"
          : ""
      }`}
    >
      <strong
        className={
          entry.position <= 3
            ? "text-lime-400"
            : "text-slate-500"
        }
      >
        {entry.position}º
      </strong>

      <div>
        <strong>
          {entry.userName}
          {isCurrentUser ? " (você)" : ""}
        </strong>

        <p className="mt-1 text-xs text-slate-500">
          {entry.exactScores} exatos ·{" "}
          {entry.correctResults} resultados ·{" "}
          {entry.wrongPredictions} erros
        </p>
      </div>

      <strong className="text-lg">
        {entry.points} pts
      </strong>
    </div>
  );
}