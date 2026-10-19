"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

type PredictionResult =
  | "EXACT"
  | "RESULT"
  | "WRONG"
  | "PENDING";

type PredictionHistoryEntry = {
  user_id: string;
  user_name: string;
  match_id: string;
  competition: string;
  round: number;
  starts_at: string;
  match_status: string;
  home_team_name: string;
  home_team_abbreviation: string;
  away_team_name: string;
  away_team_abbreviation: string;
  prediction_home_score: number;
  prediction_away_score: number;
  official_home_score: number | null;
  official_away_score: number | null;
  prediction_result: PredictionResult;
  prediction_points: number;
  is_provisional: boolean;
};

type PlayerPredictionHistoryProps = {
  poolId: string;
  userId: string;
  userName: string;
  onClose: () => void;
};

export function PlayerPredictionHistory({
  poolId,
  userId,
  userName,
  onClose,
}: PlayerPredictionHistoryProps) {
  const [
    entries,
    setEntries,
  ] = useState<
    PredictionHistoryEntry[]
  >([]);

  const [
    status,
    setStatus,
  ] = useState<
    "loading" | "success" | "error"
  >("loading");

  const loadHistory = useCallback(
    async (
      showLoading = false,
    ) => {
      if (showLoading) {
        setStatus("loading");
      }

      const supabase =
        createClient();

      const {
        data,
        error,
      } = await supabase.rpc(
        "get_pool_member_prediction_history",
        {
          target_pool_id:
            poolId,
          target_user_id:
            userId,
        },
      );

      if (error) {
        console.error(
          "Erro ao carregar palpites do participante:",
          error,
        );

        if (showLoading) {
          setStatus("error");
        }

        return;
      }

      const loadedEntries = [
        ...(
            (data ??
            []) as PredictionHistoryEntry[]
        ),
        ].sort(
        (
            firstEntry,
            secondEntry,
        ) => {
            const roundDifference =
            firstEntry.round -
            secondEntry.round;

            if (
            roundDifference !== 0
            ) {
            return roundDifference;
            }

            const dateDifference =
            new Date(
                firstEntry.starts_at,
            ).getTime() -
            new Date(
                secondEntry.starts_at,
            ).getTime();

            if (
            dateDifference !== 0
            ) {
            return dateDifference;
            }

            return firstEntry.match_id.localeCompare(
            secondEntry.match_id,
            "pt-BR",
            );
        },
        );

        setEntries(loadedEntries);

      setStatus("success");
    },
    [
      poolId,
      userId,
    ],
  );

  useEffect(() => {
    const initialTimeout =
      window.setTimeout(() => {
        void loadHistory(true);
      }, 0);

    const interval =
      window.setInterval(() => {
        void loadHistory(false);
      }, 10000);

    return () => {
      window.clearTimeout(
        initialTimeout,
      );

      window.clearInterval(
        interval,
      );
    };
  }, [loadHistory]);

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [onClose]);

  const summary = useMemo(() => {
    return {
      exact: entries.filter(
        (entry) =>
          entry.prediction_result ===
          "EXACT",
      ).length,

      results: entries.filter(
        (entry) =>
          entry.prediction_result ===
          "RESULT",
      ).length,

      wrong: entries.filter(
        (entry) =>
          entry.prediction_result ===
          "WRONG",
      ).length,

      points: entries.reduce(
        (
          total,
          entry,
        ) =>
          total +
          entry.prediction_points,
        0,
      ),
    };
  }, [entries]);

  const hasProvisional =
    entries.some(
      (entry) =>
        entry.is_provisional,
    );

  return (
    <div
      role="presentation"
      onMouseDown={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Palpites de ${userName}`}
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-slate-700 bg-[#0e2131] shadow-2xl sm:rounded-3xl"
      >
        <header className="sticky top-0 z-10 border-b border-slate-800 bg-[#0e2131]/95 p-5 backdrop-blur sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-lime-400">
                PALPITES LIBERADOS
              </span>

              <h2 className="mt-2 text-2xl font-extrabold">
                {userName}
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Somente partidas que já
                começaram aparecem aqui.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar histórico"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-700 text-xl text-slate-300 transition hover:border-red-400 hover:text-red-300"
            >
              ×
            </button>
          </div>

          {status === "success" &&
            entries.length > 0 && (
              <div className="mt-5 grid grid-cols-4 gap-2">
                <SummaryCard
                  label="Exatos"
                  value={summary.exact}
                  color="emerald"
                />

                <SummaryCard
                  label="Resultados"
                  value={summary.results}
                  color="amber"
                />

                <SummaryCard
                  label="Erros"
                  value={summary.wrong}
                  color="red"
                />

                <SummaryCard
                  label={
                    hasProvisional
                      ? "Pts. agora"
                      : "Pontos"
                  }
                  value={summary.points}
                  color="lime"
                />
              </div>
            )}

          {hasProvisional && (
            <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs font-bold leading-5 text-amber-300">
              Existem partidas ao vivo.
              As classificações e os pontos
              abaixo são provisórios.
            </p>
          )}
        </header>

        <div className="p-4 sm:p-6">
          {status === "loading" && (
            <div className="rounded-2xl border border-slate-800 p-8 text-center text-slate-400">
              Carregando palpites...
            </div>
          )}

          {status === "error" && (
            <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-6 text-center">
              <strong className="text-red-300">
                Não foi possível carregar os
                palpites
              </strong>

              <button
                type="button"
                onClick={() => {
                  void loadHistory(true);
                }}
                className="mx-auto mt-4 block rounded-xl border border-red-400/40 px-4 py-2 text-sm font-bold text-red-300"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {status === "success" &&
            entries.length === 0 && (
              <div className="rounded-2xl border border-slate-800 p-8 text-center">
                <span className="text-3xl">
                  🔒
                </span>

                <h3 className="mt-3 font-extrabold">
                  Nenhum palpite liberado
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Os palpites deste participante
                  aparecerão quando as partidas
                  começarem.
                </p>
              </div>
            )}

          {status === "success" &&
            entries.length > 0 && (
              <div className="space-y-4">
                {entries.map(
                  (entry) => (
                    <PredictionCard
                      key={`${entry.match_id}-${entry.user_id}`}
                      entry={entry}
                      userName={
                        userName
                      }
                    />
                  ),
                )}
              </div>
            )}
        </div>
      </section>
    </div>
  );
}

function PredictionCard({
  entry,
  userName,
}: {
  entry: PredictionHistoryEntry;
  userName: string;
}) {
  const evaluation =
    getEvaluation(entry);

  const matchDate =
    new Intl.DateTimeFormat(
      "pt-BR",
      {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        timeZone:
          "America/Belem",
      },
    ).format(
      new Date(entry.starts_at),
    );

  const officialScoreAvailable =
    entry.official_home_score !==
      null &&
    entry.official_away_score !==
      null;

  return (
    <article
      className={`overflow-hidden rounded-2xl border ${evaluation.cardStyle}`}
    >
      <div className="flex flex-col gap-3 border-b border-current/10 bg-slate-950/20 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Rodada {entry.round}
          </span>

          <p className="mt-1 text-xs text-slate-500">
            {matchDate}
            {" · "}
            {entry.competition}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <MatchStatusBadge
            status={
              entry.match_status
            }
          />

          {entry.is_provisional && (
            <span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-[10px] font-extrabold uppercase text-amber-300">
              Provisório
            </span>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
          <div className="min-w-0">
            <strong className="block truncate">
              {entry.home_team_name}
            </strong>

            <span className="text-xs text-slate-500">
              {
                entry
                  .home_team_abbreviation
              }
            </span>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-center">
            {officialScoreAvailable ? (
              <strong className="whitespace-nowrap text-xl">
                {
                  entry
                    .official_home_score
                }
                {" × "}
                {
                  entry
                    .official_away_score
                }
              </strong>
            ) : (
              <strong className="text-slate-500">
                ×
              </strong>
            )}

            <span className="mt-1 block text-[9px] font-bold uppercase tracking-wider text-slate-500">
              Placar atual
            </span>
          </div>

          <div className="min-w-0 text-right">
            <strong className="block truncate">
              {entry.away_team_name}
            </strong>

            <span className="text-xs text-slate-500">
              {
                entry
                  .away_team_abbreviation
              }
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-xl bg-slate-950/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Palpite de {userName}
            </span>

            <strong className="mt-1 block text-xl">
              {
                entry
                  .prediction_home_score
              }
              {" × "}
              {
                entry
                  .prediction_away_score
              }
            </strong>
          </div>

          <div className="sm:text-right">
            <strong
              className={`block text-sm ${evaluation.textStyle}`}
            >
              {evaluation.label}
            </strong>

            <span
              className={`mt-1 block text-xs font-extrabold ${evaluation.textStyle}`}
            >
              {evaluation.pointsLabel}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function getEvaluation(
  entry: PredictionHistoryEntry,
) {
  if (
    entry.prediction_result ===
    "EXACT"
  ) {
    return {
      label: entry.is_provisional
        ? "Placar exato agora"
        : "Placar exato",
      pointsLabel:
        entry.is_provisional
          ? "+5 provisórios"
          : "+5 pontos",
      textStyle:
        "text-emerald-400",
      cardStyle:
        "border-emerald-400/40 bg-emerald-400/5",
    };
  }

  if (
    entry.prediction_result ===
    "RESULT"
  ) {
    return {
      label: entry.is_provisional
        ? "Resultado correto agora"
        : "Resultado correto",
      pointsLabel:
        entry.is_provisional
          ? "+3 provisórios"
          : "+3 pontos",
      textStyle:
        "text-amber-400",
      cardStyle:
        "border-amber-400/40 bg-amber-400/5",
    };
  }

  if (
    entry.prediction_result ===
    "WRONG"
  ) {
    return {
      label: entry.is_provisional
        ? "Errado neste momento"
        : "Palpite incorreto",
      pointsLabel: "0 pontos",
      textStyle:
        "text-red-400",
      cardStyle:
        "border-red-400/40 bg-red-400/5",
    };
  }

  return {
    label: "Aguardando placar",
    pointsLabel:
      "Ainda sem avaliação",
    textStyle:
      "text-slate-400",
    cardStyle:
      "border-slate-700 bg-slate-900/20",
  };
}

function MatchStatusBadge({
  status,
}: {
  status: string;
}) {
  const labels: Record<
    string,
    string
  > = {
    LIVE: "AO VIVO",
    HALFTIME: "INTERVALO",
    FINISHED: "ENCERRADO",
  };

  const styles: Record<
    string,
    string
  > = {
    LIVE:
      "bg-red-400/10 text-red-400",
    HALFTIME:
      "bg-amber-400/10 text-amber-400",
    FINISHED:
      "bg-slate-700 text-slate-300",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase ${
        styles[status] ??
        "bg-slate-700 text-slate-300"
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color:
    | "emerald"
    | "amber"
    | "red"
    | "lime";
}) {
  const styles = {
    emerald:
      "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    amber:
      "border-amber-400/30 bg-amber-400/10 text-amber-300",
    red:
      "border-red-400/30 bg-red-400/10 text-red-300",
    lime:
      "border-lime-400/30 bg-lime-400/10 text-lime-300",
  };

  return (
    <div
      className={`rounded-xl border p-2 text-center sm:p-3 ${styles[color]}`}
    >
      <strong className="block text-lg">
        {value}
      </strong>

      <span className="mt-0.5 block text-[9px] font-extrabold uppercase tracking-wider opacity-80 sm:text-[10px]">
        {label}
      </span>
    </div>
  );
}