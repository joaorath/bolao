"use client";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";
import {
  TeamIdentity,
} from "@/components/team-identity";

import type {
  Match,
  MatchStatus,
} from "@/types";

type PredictionListProps = {
  poolId: string;
};

type SavedPrediction = {
  matchId: string;
  homeScore: number;
  awayScore: number;
};

type PredictionEvaluation = {
  kind: "EXACT" | "RESULT" | "WRONG";
  points: 0 | 3 | 5;
  provisional: boolean;
};

type DatabaseMatch = {
  id: string;
  competition: string;
  round: number;
  stadium: string | null;
  starts_at: string;
  home_team_name: string;
  home_team_abbreviation: string;
  home_team_color: string;
  home_team_logo_url: string | null;
  away_team_name: string;
  away_team_abbreviation: string;
  away_team_color: string;
  away_team_logo_url: string | null;
};

type DatabasePoolMatch = {
  status: string;
  official_home_score: number | null;
  official_away_score: number | null;
  matches:
    | DatabaseMatch
    | DatabaseMatch[]
    | null;
};

type DatabaseMatchStatus = {
  match_id: string;
  status: string;
  official_home_score: number | null;
  official_away_score: number | null;
};

export function PredictionList({
  poolId,
}: PredictionListProps) {
  const [matches, setMatches] =
    useState<Match[]>([]);

  const [predictions, setPredictions] =
    useState<
      Record<string, SavedPrediction>
    >({});

  const [
    compatiblePoolIds,
    setCompatiblePoolIds,
  ] = useState<string[]>([poolId]);

  const [userId, setUserId] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  const [
    applyToAllPools,
    setApplyToAllPools,
  ] = useState(true);

  useEffect(() => {
    async function loadData() {
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

      setUserId(user.id);

      const [
        poolMatchesResult,
        predictionsResult,
        poolsResult,
      ] = await Promise.all([
        supabase
          .from("pool_matches")
          .select(`
            status,
            official_home_score,
            official_away_score,
            matches(
              id,
              competition,
              round,
              stadium,
              starts_at,
              home_team_name,
              home_team_abbreviation,
              home_team_color,
              home_team_logo_url,
              away_team_name,
              away_team_abbreviation,
              away_team_color,
              away_team_logo_url
            )
          `)
          .eq("pool_id", poolId),

        supabase
          .from("predictions")
          .select(
            "match_id, home_score, away_score",
          )
          .eq("pool_id", poolId)
          .eq("user_id", user.id),

        supabase
          .from("pools")
          .select("id, competition"),
      ]);

      if (poolMatchesResult.error) {
        console.error(
          "Erro ao carregar jogos:",
          poolMatchesResult.error,
        );

        setLoadError(
          "Não foi possível carregar os jogos.",
        );

        setLoading(false);
        return;
      }

      if (predictionsResult.error) {
        console.error(
          "Erro ao carregar palpites:",
          predictionsResult.error,
        );

        setLoadError(
          "Não foi possível carregar seus palpites.",
        );

        setLoading(false);
        return;
      }

      const loadedMatches: Match[] = [];

      for (
        const item of
        (poolMatchesResult.data ??
          []) as unknown as DatabasePoolMatch[]
      ) {
        const databaseMatch =
          Array.isArray(item.matches)
            ? item.matches[0]
            : item.matches;

        if (!databaseMatch) {
          continue;
        }

        loadedMatches.push({
          id: databaseMatch.id,
          competition:
            databaseMatch.competition,
          round: databaseMatch.round,
          stadium:
            databaseMatch.stadium ??
            "Estádio não informado",
          startsAt:
            databaseMatch.starts_at,
          status:
            item.status as MatchStatus,
          homeScore:
            item.official_home_score ??
            undefined,
          awayScore:
            item.official_away_score ??
            undefined,
          homeTeam: {
            id: `${databaseMatch.id}-home`,
            name:
              databaseMatch.home_team_name,
            abbreviation:
              databaseMatch
                .home_team_abbreviation,
            primaryColor:
              databaseMatch.home_team_color,
            secondaryColor: "#ffffff",
            logoUrl:
              databaseMatch
                .home_team_logo_url ??
              undefined,
          },
          awayTeam: {
            id: `${databaseMatch.id}-away`,
            name:
              databaseMatch.away_team_name,
            abbreviation:
              databaseMatch
                .away_team_abbreviation,
            primaryColor:
              databaseMatch.away_team_color,
            secondaryColor: "#ffffff",
            logoUrl:
              databaseMatch
                .away_team_logo_url ??
              undefined,
          },
        });
      }

      loadedMatches.sort(
        (first, second) =>
          new Date(
            first.startsAt,
          ).getTime() -
          new Date(
            second.startsAt,
          ).getTime(),
      );

      setMatches(loadedMatches);

      const loadedPredictions: Record<
        string,
        SavedPrediction
      > = {};

      for (
        const prediction of
        predictionsResult.data ?? []
      ) {
        loadedPredictions[
          prediction.match_id
        ] = {
          matchId:
            prediction.match_id,
          homeScore:
            prediction.home_score,
          awayScore:
            prediction.away_score,
        };
      }

      setPredictions(
        loadedPredictions,
      );

      if (poolsResult.error) {
        console.error(
          "Erro ao carregar bolões compatíveis:",
          poolsResult.error,
        );

        setCompatiblePoolIds([
          poolId,
        ]);
      } else {
        const currentPool =
          poolsResult.data?.find(
            (pool) =>
              pool.id === poolId,
          );

        if (currentPool) {
          const compatibleIds =
            (poolsResult.data ?? [])
              .filter(
                (pool) =>
                  pool.competition ===
                  currentPool.competition,
              )
              .map(
                (pool) => pool.id,
              );

          setCompatiblePoolIds(
            compatibleIds.length > 0
              ? compatibleIds
              : [poolId],
          );
        }
      }

      setLoading(false);
    }

    void loadData();
  }, [poolId]);

  useEffect(() => {
    const supabase =
      createClient();

    async function refreshMatchStatuses() {
      const { data, error } =
        await supabase
          .from("pool_matches")
          .select(`
            match_id,
            status,
            official_home_score,
            official_away_score
          `)
          .eq("pool_id", poolId);

      if (error) {
        console.error(
          "Erro ao atualizar status dos jogos:",
          error,
        );

        return;
      }

      const currentStatuses =
        (data ??
          []) as DatabaseMatchStatus[];

      setMatches(
        (currentMatches) =>
          currentMatches.map(
            (match) => {
              const updatedMatch =
                currentStatuses.find(
                  (item) =>
                    item.match_id ===
                    match.id,
                );

              if (!updatedMatch) {
                return match;
              }

              return {
                ...match,
                status:
                  updatedMatch
                    .status as MatchStatus,
                homeScore:
                  updatedMatch
                    .official_home_score ??
                  undefined,
                awayScore:
                  updatedMatch
                    .official_away_score ??
                  undefined,
              };
            },
          ),
      );
    }

    const interval =
      window.setInterval(() => {
        void refreshMatchStatuses();
      }, 10000);

    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void refreshMatchStatuses();
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      window.clearInterval(interval);

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [poolId]);

  function handlePredictionSaved(
    prediction: SavedPrediction,
  ) {
    setPredictions((current) => ({
      ...current,
      [prediction.matchId]:
        prediction,
    }));
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0e2131] p-6 text-slate-400">
        Carregando jogos e palpites...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-6 text-red-300">
        {loadError}
      </div>
    );
  }

  return (
    <section>
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-[#0e2131] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-extrabold">
            Palpites da rodada
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Seus palpites ficam salvos na
            sua conta e separados em cada
            bolão.
          </p>
        </div>

        <label
          className={`flex items-center gap-3 text-sm ${
            compatiblePoolIds.length <
            2
              ? "cursor-not-allowed text-slate-600"
              : "cursor-pointer text-slate-300"
          }`}
        >
          <input
            type="checkbox"
            checked={
              applyToAllPools
            }
            disabled={
              compatiblePoolIds.length <
              2
            }
            onChange={(event) =>
              setApplyToAllPools(
                event.target.checked,
              )
            }
            className="h-4 w-4 accent-lime-400"
          />

          Aplicar este palpite em todos
          os meus bolões
        </label>

        {compatiblePoolIds.length >
          1 &&
          !applyToAllPools && (
            <p className="text-xs leading-5 text-amber-400 sm:text-right">
              Atenção: o palpite será
              salvo somente neste bolão
              e pode não contar no
              Ranking Geral.
            </p>
          )}
      </div>

      {matches.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-slate-800 bg-[#0e2131] p-6 text-slate-400">
          Nenhum jogo disponível neste
          bolão.
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {matches.map((match) => (
            <PredictionEditor
              key={`${poolId}-${match.id}`}
              userId={userId}
              match={match}
              savedPrediction={
                predictions[match.id]
              }
              targetPoolIds={
                applyToAllPools
                  ? compatiblePoolIds
                  : [poolId]
              }
              applyToAllPools={
                applyToAllPools
              }
              onSaved={
                handlePredictionSaved
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

type PredictionEditorProps = {
  userId: string;
  match: Match;
  savedPrediction?: SavedPrediction;
  targetPoolIds: string[];
  applyToAllPools: boolean;
  onSaved: (
    prediction: SavedPrediction,
  ) => void;
};

function PredictionEditor({
  userId,
  match,
  savedPrediction,
  targetPoolIds,
  applyToAllPools,
  onSaved,
}: PredictionEditorProps) {
  const [homeScore, setHomeScore] =
    useState(() =>
      savedPrediction
        ? String(
            savedPrediction.homeScore,
          )
        : "",
    );

  const [awayScore, setAwayScore] =
    useState(() =>
      savedPrediction
        ? String(
            savedPrediction.awayScore,
          )
        : "",
    );

  const [feedback, setFeedback] =
    useState("");

  const [
    feedbackIsError,
    setFeedbackIsError,
  ] = useState(false);

  const [saving, setSaving] =
    useState(false);

  const [
    currentTimestamp,
    setCurrentTimestamp,
  ] = useState(() => Date.now());

  useEffect(() => {
    const interval =
      window.setInterval(() => {
        setCurrentTimestamp(
          Date.now(),
        );
      }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const predictionDeadline =
    new Date(
      match.startsAt,
    ).getTime();

  const deadlineReached =
    currentTimestamp >=
    predictionDeadline;

  const lockedByStatus =
    match.status !== "OPEN" &&
    match.status !== "SCHEDULED";

  const locked =
    deadlineReached ||
    lockedByStatus;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (locked) {
      setFeedback(
        "Os palpites desta partida estão encerrados.",
      );

      setFeedbackIsError(true);
      return;
    }

    const parsedHomeScore =
      Number(homeScore);

    const parsedAwayScore =
      Number(awayScore);

    const scoresAreValid =
      homeScore.trim() !== "" &&
      awayScore.trim() !== "" &&
      Number.isInteger(
        parsedHomeScore,
      ) &&
      Number.isInteger(
        parsedAwayScore,
      ) &&
      parsedHomeScore >= 0 &&
      parsedAwayScore >= 0 &&
      parsedHomeScore <= 99 &&
      parsedAwayScore <= 99;

    if (!scoresAreValid) {
      setFeedback(
        "Informe dois placares válidos.",
      );

      setFeedbackIsError(true);
      return;
    }

    setSaving(true);
    setFeedback("");
    setFeedbackIsError(false);

    const supabase =
      createClient();

    const predictionRows =
      targetPoolIds.map(
        (targetPoolId) => ({
          pool_id: targetPoolId,
          match_id: match.id,
          user_id: userId,
          home_score:
            parsedHomeScore,
          away_score:
            parsedAwayScore,
          updated_at:
            new Date().toISOString(),
        }),
      );

    const { error } =
      await supabase
        .from("predictions")
        .upsert(predictionRows, {
          onConflict:
            "pool_id,match_id,user_id",
        });

    setSaving(false);

    if (error) {
      console.error(
        "Erro ao salvar palpite:",
        error,
      );

      setFeedback(
        getPredictionErrorMessage(
          error.message,
        ),
      );

      setFeedbackIsError(true);
      return;
    }

    onSaved({
      matchId: match.id,
      homeScore:
        parsedHomeScore,
      awayScore:
        parsedAwayScore,
    });

    setFeedback(
      applyToAllPools
        ? `Palpite salvo em ${targetPoolIds.length} bolões.`
        : "Palpite salvo neste bolão.",
    );
  }

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
      new Date(match.startsAt),
    );

  const predictionEvaluation =
    evaluatePrediction(
      match,
      savedPrediction,
    );

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-2xl border bg-[#0e2131] p-4 sm:p-5 ${getPredictionCardStyle(
        predictionEvaluation,
        match.status,
      )}`}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-lime-400">
              Rodada {match.round}
            </span>

            <MatchStatusBadge
              status={match.status}
              deadlineReached={
                deadlineReached
              }
            />
          </div>

          <p className="mt-2 text-sm text-slate-400">
            {matchDate} ·{" "}
            {match.stadium}
          </p>
        </div>

        <div className="grid w-full grid-cols-[minmax(0,1fr)_56px_auto_56px_minmax(0,1fr)] items-center gap-2 md:w-auto md:gap-3">
          <TeamIdentity
            abbreviation={
              match.homeTeam
                .abbreviation
            }
            name={
              match.homeTeam.name
            }
            logoUrl={
              match.homeTeam.logoUrl
            }
          />

          <ScoreInput
            label={`Placar do ${match.homeTeam.name}`}
            value={homeScore}
            disabled={
              locked || saving
            }
            onChange={
              setHomeScore
            }
          />

          <span className="font-extrabold text-slate-500">
            ×
          </span>

          <ScoreInput
            label={`Placar do ${match.awayTeam.name}`}
            value={awayScore}
            disabled={
              locked || saving
            }
            onChange={
              setAwayScore
            }
          />

          <TeamIdentity
            abbreviation={
              match.awayTeam
                .abbreviation
            }
            name={
              match.awayTeam.name
            }
            logoUrl={
              match.awayTeam.logoUrl
            }
            align="right"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          aria-live="polite"
          aria-atomic="true"
          className="min-w-0 text-sm"
        >
          {predictionEvaluation &&
          savedPrediction ? (
            <PredictionEvaluationMessage
              evaluation={
                predictionEvaluation
              }
              prediction={
                savedPrediction
              }
              match={match}
            />
          ) : feedback ? (
            <span
              className={
                feedbackIsError
                  ? "text-red-400"
                  : "text-emerald-400"
              }
            >
              {feedback}
            </span>
          ) : locked ? (
            <span className="text-amber-400">
              {getLockedMessage(
                match.status,
                deadlineReached,
              )}
            </span>
          ) : savedPrediction ? (
            <span className="text-slate-400">
              Salvo:{" "}
              <strong className="text-white">
                {
                  savedPrediction
                    .homeScore
                }{" "}
                ×{" "}
                {
                  savedPrediction
                    .awayScore
                }
              </strong>
            </span>
          ) : (
            <span className="text-slate-500">
              Palpite ainda não
              preenchido
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={
            locked || saving
          }
          className="w-full rounded-xl bg-lime-400 px-5 py-2.5 text-sm font-extrabold text-slate-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 sm:w-auto"
        >
          {locked
            ? "Palpite encerrado"
            : saving
              ? "Salvando..."
              : savedPrediction
                ? "Atualizar palpite"
                : "Salvar palpite"}
        </button>
      </div>
    </form>
  );
}

function evaluatePrediction(
  match: Match,
  prediction?: SavedPrediction,
): PredictionEvaluation | null {
  const scoringStatuses: MatchStatus[] =
    [
      "LIVE",
      "HALFTIME",
      "FINISHED",
    ];

  if (
    !prediction ||
    !scoringStatuses.includes(
      match.status,
    ) ||
    match.homeScore === undefined ||
    match.awayScore === undefined
  ) {
    return null;
  }

  const provisional =
    match.status !== "FINISHED";

  if (
    prediction.homeScore ===
      match.homeScore &&
    prediction.awayScore ===
      match.awayScore
  ) {
    return {
      kind: "EXACT",
      points: 5,
      provisional,
    };
  }

  const predictedResult =
    Math.sign(
      prediction.homeScore -
        prediction.awayScore,
    );

  const officialResult =
    Math.sign(
      match.homeScore -
        match.awayScore,
    );

  if (
    predictedResult ===
    officialResult
  ) {
    return {
      kind: "RESULT",
      points: 3,
      provisional,
    };
  }

  return {
    kind: "WRONG",
    points: 0,
    provisional,
  };
}

function getPredictionCardStyle(
  evaluation:
    | PredictionEvaluation
    | null,
  status: MatchStatus,
) {
  if (
    evaluation?.kind === "EXACT"
  ) {
    return "border-emerald-400/60 shadow-[inset_4px_0_0_#34d399]";
  }

  if (
    evaluation?.kind === "RESULT"
  ) {
    return "border-amber-400/60 shadow-[inset_4px_0_0_#fbbf24]";
  }

  if (
    evaluation?.kind === "WRONG"
  ) {
    return "border-red-400/60 shadow-[inset_4px_0_0_#f87171]";
  }

  if (status === "LIVE") {
    return "border-red-400/40";
  }

  if (status === "HALFTIME") {
    return "border-amber-400/40";
  }

  return "border-slate-800";
}

function PredictionEvaluationMessage({
  evaluation,
  prediction,
  match,
}: {
  evaluation: PredictionEvaluation;
  prediction: SavedPrediction;
  match: Match;
}) {
  const labels = {
    EXACT: "Placar exato",
    RESULT: "Resultado correto",
    WRONG:
      "Resultado incorreto",
  };

  const styles = {
    EXACT: "text-emerald-400",
    RESULT: "text-amber-400",
    WRONG: "text-red-400",
  };

  const scoreLabel =
    evaluation.provisional
      ? "Placar atual"
      : "Placar final";

  const pointsLabel =
    evaluation.points === 0
      ? evaluation.provisional
        ? "0 pontos provisórios"
        : "0 pontos"
      : evaluation.provisional
        ? `+${evaluation.points} pontos provisórios`
        : `+${evaluation.points} pontos`;

  return (
    <span
      className={
        styles[evaluation.kind]
      }
    >
      <strong>
        {labels[evaluation.kind]}
      </strong>

      {" · "}Palpite{" "}
      {prediction.homeScore} ×{" "}
      {prediction.awayScore}

      {" · "}
      {scoreLabel}{" "}
      {match.homeScore} ×{" "}
      {match.awayScore}

      {" · "}
      <strong>
        {pointsLabel}
      </strong>
    </span>
  );
}

function ScoreInput({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (
    value: string,
  ) => void;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      max={99}
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(event) =>
        onChange(
          event.target.value,
        )
      }
      className="h-12 w-14 rounded-xl border border-slate-600 bg-[#071421] text-center text-lg font-extrabold text-white outline-none transition focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20 disabled:cursor-not-allowed disabled:border-slate-600 disabled:bg-slate-900 disabled:text-slate-200 disabled:opacity-100"
    />
  );
}

function MatchStatusBadge({
  status,
  deadlineReached,
}: {
  status: MatchStatus;
  deadlineReached: boolean;
}) {
  const closedByDeadline =
    deadlineReached &&
    (
      status === "OPEN" ||
      status === "SCHEDULED"
    );

  const labels: Record<
    MatchStatus,
    string
  > = {
    OPEN: "ABERTO",
    SCHEDULED: "AGENDADO",
    LIVE: "AO VIVO",
    HALFTIME: "INTERVALO",
    FINISHED: "ENCERRADO",
    POSTPONED: "ADIADO",
    CANCELLED: "CANCELADO",
  };

  const styles: Record<
    MatchStatus,
    string
  > = {
    OPEN:
      "bg-emerald-400/10 text-emerald-400",
    SCHEDULED:
      "bg-sky-400/10 text-sky-400",
    LIVE:
      "bg-red-400/10 text-red-400",
    HALFTIME:
      "bg-amber-400/10 text-amber-400",
    FINISHED:
      "bg-slate-500/10 text-slate-400",
    POSTPONED:
      "bg-purple-400/10 text-purple-400",
    CANCELLED:
      "bg-red-400/10 text-red-300",
  };

  const label =
    closedByDeadline
      ? "PALPITES ENCERRADOS"
      : labels[status];

  const style =
    closedByDeadline
      ? "bg-amber-400/10 text-amber-300"
      : styles[status];

  return (
    <span
      aria-label={`Status da partida: ${label}`}
      className={`rounded-full px-2 py-1 text-[10px] font-bold ${style}`}
    >
      {label}
    </span>
  );
}

function getLockedMessage(
  status: MatchStatus,
  deadlineReached = false,
) {
  if (
    deadlineReached &&
    (status === "OPEN" ||
      status === "SCHEDULED")
  ) {
    return "O horário da partida chegou. Seu palpite está bloqueado.";
  }

  if (status === "LIVE") {
    return "A partida está ao vivo. Seu palpite está bloqueado.";
  }

  if (status === "HALFTIME") {
    return "A partida está no intervalo. Seu palpite está bloqueado.";
  }

  if (status === "FINISHED") {
    return "Partida encerrada. O palpite não pode mais ser alterado.";
  }

  if (status === "POSTPONED") {
    return "Esta partida foi adiada.";
  }

  if (status === "CANCELLED") {
    return "Esta partida foi cancelada.";
  }

  return "Os palpites desta partida estão encerrados.";
}

function getPredictionErrorMessage(
  message: string,
) {
  const normalizedMessage =
    message.toLowerCase();

  if (
    normalizedMessage.includes(
      "encerrad",
    )
  ) {
    return "A partida já começou e o palpite não pode mais ser alterado.";
  }

  if (
    normalizedMessage.includes(
      "próprios palpites",
    ) ||
    normalizedMessage.includes(
      "proprios palpites",
    )
  ) {
    return "Você só pode alterar seus próprios palpites.";
  }

  if (
    normalizedMessage.includes(
      "row-level security",
    ) ||
    normalizedMessage.includes(
      "permission denied",
    )
  ) {
    return "Você não possui permissão para salvar este palpite.";
  }

  if (
    normalizedMessage.includes(
      "partida não encontrada",
    ) ||
    normalizedMessage.includes(
      "partida nao encontrada",
    )
  ) {
    return "Esta partida não está disponível no bolão selecionado.";
  }

  return "Não foi possível salvar o palpite. Tente novamente.";
}