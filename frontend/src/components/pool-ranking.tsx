"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

type RankingStatus =
  | "loading"
  | "success"
  | "error";

type RankingEntry = {
  userId: string;
  userName: string;
  position: number;
  points: number;
  exactScores: number;
  correctResults: number;
  wrongPredictions: number;
};

type DatabaseRankingEntry = {
  user_id: string;
  user_name: string;
  position: number | string;
  points: number | string;
  exact_scores: number | string;
  correct_results: number | string;
  wrong_predictions: number | string;
};

export function PoolRanking({
  poolId,
}: {
  poolId: string;
}) {
  const [status, setStatus] =
    useState<RankingStatus>("loading");

  const [ranking, setRanking] =
    useState<RankingEntry[]>([]);

  const [currentUserId, setCurrentUserId] =
    useState("");

  const loadRanking =
    useCallback(async () => {
      setStatus("loading");

      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setStatus("error");
        return;
      }

      setCurrentUserId(user.id);

      const {
        data,
        error,
      } = await supabase.rpc(
        "get_pool_ranking",
        {
          target_pool_id: poolId,
        },
      );

      if (error) {
        console.error(
          "Erro ao carregar ranking:",
          error,
        );

        setStatus("error");
        return;
      }

      const entries =
        (data ??
          []) as DatabaseRankingEntry[];

      setRanking(
        entries.map((entry) => ({
          userId: entry.user_id,
          userName: entry.user_name,
          position:
            Number(entry.position),
          points:
            Number(entry.points),
          exactScores:
            Number(entry.exact_scores),
          correctResults:
            Number(
              entry.correct_results,
            ),
          wrongPredictions:
            Number(
              entry.wrong_predictions,
            ),
        })),
      );

      setStatus("success");
    }, [poolId]);

  useEffect(() => {
    loadRanking();
  }, [loadRanking]);

  if (status === "loading") {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0e2131] p-8 text-slate-400">
        Calculando ranking no servidor...
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-6">
        <strong className="text-red-400">
          Não foi possível carregar o ranking
        </strong>

        <p className="mt-2 text-sm text-slate-400">
          Tente atualizar os dados do bolão.
        </p>

        <button
          type="button"
          onClick={loadRanking}
          className="mt-4 rounded-xl border border-red-400/40 px-4 py-2 text-sm font-bold text-red-300"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0e2131]">
      <div className="flex flex-col gap-4 border-b border-slate-800 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold">
            Ranking do bolão
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            5 pontos pelo placar exato, 3 pelo
            resultado correto e 0 pelo erro.
          </p>
        </div>

        <button
          type="button"
          onClick={loadRanking}
          className="rounded-xl border border-lime-400/30 px-4 py-2 text-sm font-bold text-lime-400 transition hover:bg-lime-400/10"
        >
          Atualizar ranking
        </button>
      </div>

      {ranking.length === 0 ? (
        <div className="p-8 text-center text-slate-400">
          Nenhum participante encontrado.
        </div>
      ) : (
        <div className="divide-y divide-slate-800">
          {ranking.map((entry) => (
            <RankingRow
              key={entry.userId}
              entry={entry}
              isCurrentUser={
                entry.userId ===
                currentUserId
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

function RankingRow({
  entry,
  isCurrentUser,
}: {
  entry: RankingEntry;
  isCurrentUser: boolean;
}) {
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
          {isCurrentUser
            ? " (você)"
            : ""}
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