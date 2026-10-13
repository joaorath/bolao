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
  totalParticipants: number;
  isCurrentUser: boolean;
  isTopEntry: boolean;
};

type DatabaseRankingEntry = {
  user_id: string;
  user_name: string;
  ranking_position: number | string;
  points: number | string;
  exact_scores: number | string;
  correct_results: number | string;
  wrong_predictions: number | string;
  total_participants: number | string;
  is_current_user: boolean;
  is_top_entry: boolean;
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

      const { data, error } =
        await supabase.rpc(
          "get_pool_ranking_summary",
          {
            target_pool_id: poolId,
            ranking_limit: 100,
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
          position: Number(
            entry.ranking_position,
          ),
          points: Number(entry.points),
          exactScores: Number(
            entry.exact_scores,
          ),
          correctResults: Number(
            entry.correct_results,
          ),
          wrongPredictions: Number(
            entry.wrong_predictions,
          ),
          totalParticipants: Number(
            entry.total_participants,
          ),
          isCurrentUser:
            entry.is_current_user,
          isTopEntry:
            entry.is_top_entry,
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
          Tente atualizar a classificação.
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

  const topRanking = ranking.filter(
    (entry) => entry.isTopEntry,
  );

  const currentUserOutsideTop =
    ranking.find(
      (entry) =>
        entry.isCurrentUser &&
        !entry.isTopEntry,
    );

  const totalParticipants =
    ranking[0]?.totalParticipants ?? 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0e2131]">
      <header className="flex flex-col gap-4 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="text-xl font-extrabold">
            Classificação
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            {totalParticipants}{" "}
            {totalParticipants === 1
              ? "participante"
              : "participantes"}
            {" · "}
            5 pontos pelo placar exato e 3 pelo
            resultado correto.
          </p>
        </div>

        <button
          type="button"
          onClick={loadRanking}
          className="w-full rounded-xl border border-lime-400/30 px-4 py-2 text-sm font-bold text-lime-400 transition hover:bg-lime-400/10 sm:w-auto"
        >
          Atualizar ranking
        </button>
      </header>

      {topRanking.length === 0 ? (
        <div className="p-8 text-center text-slate-400">
          Nenhum participante encontrado.
        </div>
      ) : (
        <div className="divide-y divide-slate-800">
          {topRanking.map((entry) => (
            <RankingRow
              key={entry.userId}
              entry={entry}
            />
          ))}
        </div>
      )}

      {currentUserOutsideTop && (
        <div className="border-t border-slate-700 bg-slate-950/30 p-4 sm:p-5">
          <span className="mb-3 block text-xs font-extrabold uppercase tracking-[0.15em] text-lime-400">
            Sua posição
          </span>

          <div className="overflow-hidden rounded-xl border border-lime-400/40">
            <RankingRow
              entry={currentUserOutsideTop}
              showTotal
            />
          </div>
        </div>
      )}
    </section>
  );
}

function RankingRow({
  entry,
  showTotal = false,
}: {
  entry: RankingEntry;
  showTotal?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 p-4 sm:grid-cols-[60px_minmax(0,1fr)_auto] sm:gap-4 sm:p-5 ${
        entry.isCurrentUser
          ? "bg-lime-400/10 shadow-[inset_4px_0_0_#a3e635]"
          : ""
      }`}
    >
      <strong
        className={
          entry.position <= 3
            ? "text-lime-400"
            : "text-slate-400"
        }
      >
        {entry.position}º
      </strong>

      <div className="min-w-0">
        <strong className="block truncate">
          {entry.userName}

          {entry.isCurrentUser && (
            <span className="ml-1 text-lime-400">
              (você)
            </span>
          )}
        </strong>

        <p className="mt-1 text-xs text-slate-500">
          {showTotal && (
            <>
              {entry.position} de{" "}
              {entry.totalParticipants}
              {" · "}
            </>
          )}

          {entry.exactScores} exatos
          {" · "}
          {entry.correctResults} resultados
          {" · "}
          {entry.wrongPredictions} erros
        </p>
      </div>

      <strong className="whitespace-nowrap text-sm sm:text-lg">
        {entry.points}{" "}
        <span className="hidden sm:inline">
          pts
        </span>
      </strong>
    </div>
  );
}