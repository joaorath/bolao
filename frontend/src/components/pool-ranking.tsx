"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  PlayerPredictionHistory,
} from "@/components/player-prediction-history";

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
  livePoints: number;
  liveExactScores: number;
  liveCorrectResults: number;
  liveWrongPredictions: number;
};

type DatabaseRankingEntry = {
  user_id: string;
  user_name: string;
  ranking_position:
    | number
    | string;
  points: number | string;
  exact_scores:
    | number
    | string;
  correct_results:
    | number
    | string;
  wrong_predictions:
    | number
    | string;
  total_participants:
    | number
    | string;
  is_current_user: boolean;
  is_top_entry: boolean;
};

type DatabaseLiveDelta = {
  user_id: string;
  live_points:
    | number
    | string;
  live_exact_scores:
    | number
    | string;
  live_correct_results:
    | number
    | string;
  live_wrong_predictions:
    | number
    | string;
};

type SelectedPlayer = {
  userId: string;
  userName: string;
};

export function PoolRanking({
  poolId,
}: {
  poolId: string;
}) {
  const [
    status,
    setStatus,
  ] = useState<RankingStatus>(
    "loading",
  );

  const [
    ranking,
    setRanking,
  ] = useState<RankingEntry[]>(
    [],
  );

  const [
    isProvisional,
    setIsProvisional,
  ] = useState(false);

  const [
    selectedPlayer,
    setSelectedPlayer,
  ] =
    useState<SelectedPlayer | null>(
      null,
    );

  const loadRanking = useCallback(
    async (
      showLoading = true,
    ) => {
      if (showLoading) {
        setStatus("loading");
      }

      const supabase =
        createClient();

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        setStatus("error");
        return;
      }

      const [
        rankingResult,
        liveMatchesResult,
        liveDeltaResult,
      ] = await Promise.all([
        supabase.rpc(
          "get_pool_ranking_summary",
          {
            target_pool_id:
              poolId,
            ranking_limit: 100,
          },
        ),

        supabase
          .from("pool_matches")
          .select("match_id", {
            count: "exact",
            head: true,
          })
          .eq(
            "pool_id",
            poolId,
          )
          .in("status", [
            "LIVE",
            "HALFTIME",
          ]),

        supabase.rpc(
          "get_pool_live_prediction_deltas",
          {
            target_pool_id:
              poolId,
          },
        ),
      ]);

      if (
        rankingResult.error
      ) {
        console.error(
          "Erro ao carregar ranking:",
          rankingResult.error,
        );

        if (showLoading) {
          setStatus("error");
        }

        return;
      }

      if (
        liveMatchesResult.error
      ) {
        console.error(
          "Erro ao verificar partidas ao vivo:",
          liveMatchesResult.error,
        );
      } else {
        setIsProvisional(
          (liveMatchesResult.count ??
            0) > 0,
        );
      }

      if (
        liveDeltaResult.error
      ) {
        console.error(
          "Erro ao carregar destaques ao vivo:",
          liveDeltaResult.error,
        );
      }

      const liveDeltaMap =
        new Map<
          string,
          DatabaseLiveDelta
        >();

      for (
        const delta of
        (liveDeltaResult.data ??
          []) as DatabaseLiveDelta[]
      ) {
        liveDeltaMap.set(
          delta.user_id,
          delta,
        );
      }

      const entries =
        (rankingResult.data ??
          []) as DatabaseRankingEntry[];

      setRanking(
        entries.map(
          (entry) => {
            const liveDelta =
              liveDeltaMap.get(
                entry.user_id,
              );

            return {
              userId:
                entry.user_id,
              userName:
                entry.user_name,
              position: Number(
                entry.ranking_position,
              ),
              points: Number(
                entry.points,
              ),
              exactScores: Number(
                entry.exact_scores,
              ),
              correctResults:
                Number(
                  entry.correct_results,
                ),
              wrongPredictions:
                Number(
                  entry.wrong_predictions,
                ),
              totalParticipants:
                Number(
                  entry.total_participants,
                ),
              isCurrentUser:
                entry.is_current_user,
              isTopEntry:
                entry.is_top_entry,
              livePoints: Number(
                liveDelta
                  ?.live_points ?? 0,
              ),
              liveExactScores:
                Number(
                  liveDelta
                    ?.live_exact_scores ??
                    0,
                ),
              liveCorrectResults:
                Number(
                  liveDelta
                    ?.live_correct_results ??
                    0,
                ),
              liveWrongPredictions:
                Number(
                  liveDelta
                    ?.live_wrong_predictions ??
                    0,
                ),
            };
          },
        ),
      );

      setStatus("success");
    },
    [poolId],
  );

  useEffect(() => {
    const initialTimeout =
      window.setTimeout(() => {
        void loadRanking(true);
      }, 0);

    const interval =
      window.setInterval(() => {
        void loadRanking(false);
      }, 10000);

    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void loadRanking(false);
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      window.clearTimeout(
        initialTimeout,
      );

      window.clearInterval(
        interval,
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
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
          Não foi possível carregar o
          ranking
        </strong>

        <p className="mt-2 text-sm text-slate-400">
          Tente atualizar a classificação.
        </p>

        <button
          type="button"
          onClick={() => {
            void loadRanking(true);
          }}
          className="mt-4 rounded-xl border border-red-400/40 px-4 py-2 text-sm font-bold text-red-300"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const topRanking =
    ranking.filter(
      (entry) =>
        entry.isTopEntry,
    );

  const currentUserOutsideTop =
    ranking.find(
      (entry) =>
        entry.isCurrentUser &&
        !entry.isTopEntry,
    );

  const totalParticipants =
    ranking[0]
      ?.totalParticipants ?? 0;

  function openPlayer(
    entry: RankingEntry,
  ) {
    setSelectedPlayer({
      userId: entry.userId,
      userName:
        entry.userName,
    });
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0e2131]">
        <header className="flex flex-col gap-4 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-xl font-extrabold">
              {isProvisional
                ? "Classificação provisória"
                : "Classificação"}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {totalParticipants}{" "}
              {totalParticipants === 1
                ? "participante"
                : "participantes"}
              {" · "}
              5 pontos pelo placar exato e
              3 pelo resultado correto.
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Clique em um participante para
              ver os palpites já liberados.
            </p>

            {isProvisional && (
              <p className="mt-2 text-xs font-bold text-amber-400">
                Atualização automática durante
                a partida. Os pontos ainda
                podem mudar.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              void loadRanking(true);
            }}
            className="w-full rounded-xl border border-lime-400/30 px-4 py-2 text-sm font-bold text-lime-400 transition hover:bg-lime-400/10 sm:w-auto"
          >
            {isProvisional
              ? "Atualizar agora"
              : "Atualizar ranking"}
          </button>
        </header>

        {topRanking.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            Nenhum participante encontrado.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {topRanking.map(
              (entry) => (
                <RankingRow
                  key={entry.userId}
                  entry={entry}
                  provisional={
                    isProvisional
                  }
                  onSelect={() => {
                    openPlayer(
                      entry,
                    );
                  }}
                />
              ),
            )}
          </div>
        )}

        {currentUserOutsideTop && (
          <div className="border-t border-slate-700 bg-slate-950/30 p-4 sm:p-5">
            <span className="mb-3 block text-xs font-extrabold uppercase tracking-[0.15em] text-lime-400">
              Sua posição
            </span>

            <div className="overflow-hidden rounded-xl border border-lime-400/40">
              <RankingRow
                entry={
                  currentUserOutsideTop
                }
                showTotal
                provisional={
                  isProvisional
                }
                onSelect={() => {
                  openPlayer(
                    currentUserOutsideTop,
                  );
                }}
              />
            </div>
          </div>
        )}
      </section>

      {selectedPlayer && (
        <PlayerPredictionHistory
          poolId={poolId}
          userId={
            selectedPlayer.userId
          }
          userName={
            selectedPlayer.userName
          }
          onClose={() => {
            setSelectedPlayer(
              null,
            );
          }}
        />
      )}
    </>
  );
}

function RankingRow({
  entry,
  showTotal = false,
  provisional = false,
  onSelect,
}: {
  entry: RankingEntry;
  showTotal?: boolean;
  provisional?: boolean;
  onSelect: () => void;
}) {
  const hasLiveEvaluation =
    entry.liveExactScores > 0 ||
    entry.liveCorrectResults > 0 ||
    entry.liveWrongPredictions > 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      title={`Ver palpites liberados de ${entry.userName}`}
      aria-label={`Ver palpites liberados de ${entry.userName}`}
      className={`group grid w-full cursor-pointer grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 p-4 text-left transition duration-200 hover:bg-slate-800/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lime-400 sm:grid-cols-[60px_minmax(0,1fr)_auto] sm:gap-4 sm:p-5 ${
        entry.isCurrentUser
          ? "bg-lime-400/10 shadow-[inset_4px_0_0_#a3e635]"
          : ""
      }`}
    >
      <strong
        className={`transition ${
          entry.position <= 3
            ? "text-lime-400"
            : "text-slate-400 group-hover:text-white"
        }`}
      >
        {entry.position}º
      </strong>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="min-w-0 truncate transition group-hover:text-lime-300">
            {entry.userName}

            {entry.isCurrentUser && (
              <span className="ml-1 text-lime-400">
                (você)
              </span>
            )}
          </strong>

          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-700 bg-slate-950/50 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-slate-400 transition group-hover:border-lime-400/50 group-hover:bg-lime-400/10 group-hover:text-lime-300 sm:text-[10px]">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-3.5 w-3.5"
            >
              <path
                d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <circle
                cx="12"
                cy="12"
                r="2.5"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>

            Ver palpites
          </span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
          {showTotal && (
            <span className="text-slate-500">
              {entry.position} de{" "}
              {entry.totalParticipants}
              {" · "}
            </span>
          )}

          <span
            className={
              entry.liveExactScores > 0
                ? "font-extrabold text-emerald-400"
                : "text-slate-500"
            }
          >
            {entry.exactScores} exatos
          </span>

          <span className="text-slate-700">
            ·
          </span>

          <span
            className={
              entry.liveCorrectResults > 0
                ? "font-extrabold text-amber-400"
                : "text-slate-500"
            }
          >
            {entry.correctResults} resultados
          </span>

          <span className="text-slate-700">
            ·
          </span>

          <span
            className={
              entry.liveWrongPredictions > 0
                ? "font-extrabold text-red-400"
                : "text-slate-500"
            }
          >
            {entry.wrongPredictions} erros
          </span>
        </div>
      </div>

      <div className="text-right">
        <strong className="whitespace-nowrap text-sm sm:text-lg">
          {entry.points}{" "}
          <span className="text-xs text-slate-400 sm:text-sm">
            {provisional
              ? "pts prov."
              : "pts"}
          </span>
        </strong>

        {provisional &&
          hasLiveEvaluation && (
            <span
              className={`mt-1 block text-xs font-extrabold ${
                entry.livePoints > 0
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {entry.livePoints > 0
                ? `+${entry.livePoints} ao vivo`
                : "0 ao vivo"}
            </span>
          )}

        <span className="mt-2 block text-xs font-bold text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-lime-400">
          Abrir →
        </span>
      </div>
    </button>
  );
}