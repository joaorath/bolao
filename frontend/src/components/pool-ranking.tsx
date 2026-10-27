"use client";

import {
  useCallback,
  useEffect,
  useRef,
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

type RankingMode =
  | "general"
  | "round";

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

type DatabaseAvailableRound = {
  round_number:
    | number
    | string;
  first_match_at: string;
  has_live_matches: boolean;
  has_open_matches: boolean;
};

type AvailableRound = {
  roundNumber: number;
  firstMatchAt: string;
  hasLiveMatches: boolean;
  hasOpenMatches: boolean;
};

type SelectedPlayer = {
  userId: string;
  userName: string;
};

function chooseDefaultRound(
  rounds: AvailableRound[],
) {
  const liveRound =
    rounds.find(
      (round) =>
        round.hasLiveMatches,
    );

  if (liveRound) {
    return liveRound.roundNumber;
  }

  const openRounds =
    rounds
      .filter(
        (round) =>
          round.hasOpenMatches,
      )
      .sort(
        (first, second) =>
          new Date(
            first.firstMatchAt,
          ).getTime() -
          new Date(
            second.firstMatchAt,
          ).getTime(),
      );

  if (openRounds[0]) {
    return openRounds[0].roundNumber;
  }

  if (rounds.length === 0) {
    return null;
  }

  return Math.max(
    ...rounds.map(
      (round) =>
        round.roundNumber,
    ),
  );
}

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
    rankingMode,
    setRankingMode,
  ] =
    useState<RankingMode>(
      "general",
    );

  const [
    availableRounds,
    setAvailableRounds,
  ] = useState<AvailableRound[]>(
    [],
  );

  const [
    selectedRound,
    setSelectedRound,
  ] =
    useState<number | null>(
      null,
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

  const requestSequence =
    useRef(0);

  const loadRanking = useCallback(
    async (
      showLoading = true,
    ) => {
      const requestId =
        requestSequence.current + 1;

      requestSequence.current =
        requestId;

      if (showLoading) {
        setStatus("loading");
      }

      const supabase =
        createClient();

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (
        requestId !==
        requestSequence.current
      ) {
        return;
      }

      if (!user) {
        setStatus("error");
        return;
      }

      const roundsResult =
        await supabase.rpc(
          "get_pool_available_rounds",
          {
            target_pool_id:
              poolId,
          },
        );

      if (
        requestId !==
        requestSequence.current
      ) {
        return;
      }

      if (roundsResult.error) {
        console.error(
          "Erro ao carregar rodadas do bolão:",
          roundsResult.error,
        );

        if (showLoading) {
          setStatus("error");
        }

        return;
      }

      const loadedRounds: AvailableRound[] =
        (
          (
            roundsResult.data ??
            []
          ) as DatabaseAvailableRound[]
        )
          .map(
            (
              round,
            ): AvailableRound => ({
              roundNumber:
                Number(
                  round.round_number,
                ),
              firstMatchAt:
                round.first_match_at,
              hasLiveMatches:
                round.has_live_matches,
              hasOpenMatches:
                round.has_open_matches,
            }),
          )
          .sort(
            (
              first:
                AvailableRound,
              second:
                AvailableRound,
            ) =>
              second.roundNumber -
              first.roundNumber,
          );

      setAvailableRounds(
        loadedRounds,
      );

      const selectedRoundExists =
        selectedRound !== null &&
        loadedRounds.some(
          (round) =>
            round.roundNumber ===
            selectedRound,
        );

      const effectiveRound =
        selectedRoundExists
          ? selectedRound
          : chooseDefaultRound(
              loadedRounds,
            );

      if (
        effectiveRound !==
        selectedRound
      ) {
        setSelectedRound(
          effectiveRound,
        );
      }

      if (
        rankingMode ===
          "round" &&
        effectiveRound === null
      ) {
        setRanking([]);
        setIsProvisional(false);
        setStatus("success");
        return;
      }

      let rankingResult;
      let liveDeltaResult;

      if (
        rankingMode ===
        "round"
      ) {
        [
          rankingResult,
          liveDeltaResult,
        ] = await Promise.all([
          supabase.rpc(
            "get_pool_round_ranking_summary",
            {
              target_pool_id:
                poolId,
              target_round:
                effectiveRound!,
              ranking_limit:
                100,
            },
          ),

          supabase.rpc(
            "get_pool_round_live_prediction_deltas",
            {
              target_pool_id:
                poolId,
              target_round:
                effectiveRound!,
            },
          ),
        ]);
      } else {
        [
          rankingResult,
          liveDeltaResult,
        ] = await Promise.all([
          supabase.rpc(
            "get_pool_ranking_summary",
            {
              target_pool_id:
                poolId,
              ranking_limit:
                100,
            },
          ),

          supabase.rpc(
            "get_pool_live_prediction_deltas",
            {
              target_pool_id:
                poolId,
            },
          ),
        ]);
      }

      if (
        requestId !==
        requestSequence.current
      ) {
        return;
      }

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
        liveDeltaResult.error
      ) {
        console.error(
          "Erro ao carregar destaques ao vivo:",
          liveDeltaResult.error,
        );
      }

      const provisional =
        rankingMode === "round"
          ? loadedRounds.some(
              (round) =>
                round.roundNumber ===
                  effectiveRound &&
                round.hasLiveMatches,
            )
          : loadedRounds.some(
              (round) =>
                round.hasLiveMatches,
            );

      setIsProvisional(
        provisional,
      );

      const liveDeltaMap =
        new Map<
          string,
          DatabaseLiveDelta
        >();

      for (
        const delta of
        (
          liveDeltaResult.data ??
          []
        ) as DatabaseLiveDelta[]
      ) {
        liveDeltaMap.set(
          delta.user_id,
          delta,
        );
      }

      const entries =
        (
          rankingResult.data ??
          []
        ) as DatabaseRankingEntry[];

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
              position:
                Number(
                  entry.ranking_position,
                ),
              points:
                Number(
                  entry.points,
                ),
              exactScores:
                Number(
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
              livePoints:
                Number(
                  liveDelta
                    ?.live_points ??
                    0,
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
    [
      poolId,
      rankingMode,
      selectedRound,
    ],
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
      requestSequence.current += 1;

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

  function changeRankingMode(
    newMode: RankingMode,
  ) {
    if (
      newMode === rankingMode
    ) {
      return;
    }

    requestSequence.current += 1;
    setStatus("loading");
    setRankingMode(newMode);
  }

  function changeRound(
    roundNumber: number,
  ) {
    if (
      roundNumber ===
      selectedRound
    ) {
      return;
    }

    requestSequence.current += 1;
    setStatus("loading");
    setSelectedRound(
      roundNumber,
    );
  }

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
      ?.totalParticipants ??
    0;

  function openPlayer(
    entry: RankingEntry,
  ) {
    setSelectedPlayer({
      userId:
        entry.userId,
      userName:
        entry.userName,
    });
  }

  const rankingTitle =
    rankingMode === "round" &&
    selectedRound !== null
      ? `Classificação da rodada ${selectedRound}`
      : "Classificação geral";

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0e2131]">
        <div className="border-b border-slate-800 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
                Visualizar ranking
              </span>

              <div className="mt-2 inline-flex w-full rounded-xl border border-slate-700 bg-slate-950/50 p-1 sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    changeRankingMode(
                      "general",
                    );
                  }}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition sm:flex-none ${
                    rankingMode ===
                    "general"
                      ? "bg-lime-400 text-slate-950"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  Geral
                </button>

                <button
                  type="button"
                  disabled={
                    availableRounds.length ===
                    0
                  }
                  onClick={() => {
                    changeRankingMode(
                      "round",
                    );
                  }}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none ${
                    rankingMode ===
                    "round"
                      ? "bg-lime-400 text-slate-950"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  Por rodada
                </button>
              </div>
            </div>

            {rankingMode ===
              "round" &&
              availableRounds.length >
                0 && (
                <label className="block w-full lg:w-auto">
                  <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
                    Rodada
                  </span>

                  <select
                    value={
                      selectedRound ??
                      ""
                    }
                    onChange={(
                      event,
                    ) => {
                      changeRound(
                        Number(
                          event.target
                            .value,
                        ),
                      );
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 font-bold text-white outline-none transition focus:border-lime-400 lg:min-w-48"
                  >
                    {availableRounds.map(
                      (round) => (
                        <option
                          key={
                            round.roundNumber
                          }
                          value={
                            round.roundNumber
                          }
                        >
                          Rodada{" "}
                          {
                            round.roundNumber
                          }
                          {round.hasLiveMatches
                            ? " — ao vivo"
                            : ""}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              )}
          </div>
        </div>

        <header className="flex flex-col gap-4 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-extrabold">
                {rankingTitle}
              </h2>

              {isProvisional && (
                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                  Provisório
                </span>
              )}
            </div>

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

            {rankingMode ===
              "round" &&
              selectedRound !==
                null && (
                <p className="mt-2 text-xs font-bold text-lime-400">
                  Mostrando apenas os pontos da
                  rodada {selectedRound}.
                </p>
              )}

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
          <div className="p-8 text-center">
            <span className="text-3xl">
              🏆
            </span>

            <strong className="mt-3 block text-white">
              Nenhuma pontuação encontrada
            </strong>

            <p className="mt-2 text-sm text-slate-400">
              {rankingMode ===
                "round" &&
              selectedRound !== null
                ? `Ainda não existem palpites pontuados na rodada ${selectedRound}.`
                : "Nenhum participante foi encontrado neste bolão."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {topRanking.map(
              (entry) => (
                <RankingRow
                  key={
                    entry.userId
                  }
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
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="flex min-w-0 max-w-full items-center gap-1.5">
            <strong className="min-w-0 truncate transition group-hover:text-lime-300">
              {entry.userName}
            </strong>

            {entry.isCurrentUser && (
              <span className="shrink-0 rounded-full bg-lime-400/15 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-lime-400 sm:text-[10px]">
                Você
              </span>
            )}
          </div>

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
              entry.liveExactScores >
              0
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
              entry.liveCorrectResults >
              0
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
              entry.liveWrongPredictions >
              0
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