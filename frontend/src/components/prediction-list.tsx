"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

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

type DatabaseMatch = {
  id: string;
  competition: string;
  round: number;
  stadium: string | null;
  starts_at: string;
  home_team_name: string;
  home_team_abbreviation: string;
  home_team_color: string;
  away_team_name: string;
  away_team_abbreviation: string;
  away_team_color: string;
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

  const [applyToAllPools, setApplyToAllPools] =
    useState(false);

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
          "Sua sessão expirou.",
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
              away_team_name,
              away_team_abbreviation,
              away_team_color
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
          .select(
            "id, competition",
          ),
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
          },
        });
      }

      loadedMatches.sort((first, second) => {
        return (
          new Date(first.startsAt).getTime() -
          new Date(second.startsAt).getTime()
        );
      });

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

      setPredictions(loadedPredictions);

      const currentPool =
        poolsResult.data?.find(
          (pool) => pool.id === poolId,
        );

      if (currentPool) {
        const compatibleIds =
          (poolsResult.data ?? [])
            .filter(
              (pool) =>
                pool.competition ===
                currentPool.competition,
            )
            .map((pool) => pool.id);

        setCompatiblePoolIds(
          compatibleIds.length > 0
            ? compatibleIds
            : [poolId],
        );
      }

      setLoading(false);
    }

    loadData();
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
            Seus palpites ficam salvos na sua
            conta e separados em cada bolão.
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={applyToAllPools}
            disabled={
              compatiblePoolIds.length < 2
            }
            onChange={(event) =>
              setApplyToAllPools(
                event.target.checked,
              )
            }
            className="h-4 w-4 accent-lime-400"
          />

          Aplicar aos meus bolões
        </label>
      </div>

      {matches.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-slate-800 bg-[#0e2131] p-6 text-slate-400">
          Nenhum jogo disponível neste bolão.
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {matches.map((match) => (
            <PredictionEditor
              key={`${poolId}-${match.id}`}
              poolId={poolId}
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
  poolId: string;
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
  poolId,
  userId,
  match,
  savedPrediction,
  targetPoolIds,
  applyToAllPools,
  onSaved,
}: PredictionEditorProps) {
  const [homeScore, setHomeScore] =
    useState("");

  const [awayScore, setAwayScore] =
    useState("");

  const [feedback, setFeedback] =
    useState("");

  const [feedbackIsError, setFeedbackIsError] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    setHomeScore(
      savedPrediction
        ? String(
            savedPrediction.homeScore,
          )
        : "",
    );

    setAwayScore(
      savedPrediction
        ? String(
            savedPrediction.awayScore,
          )
        : "",
    );

    setFeedback("");
    setFeedbackIsError(false);
  }, [
    poolId,
    match.id,
    savedPrediction,
  ]);

  const locked =
    match.status !== "OPEN" &&
    match.status !== "SCHEDULED";

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

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

    const supabase = createClient();

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

    const { error } = await supabase
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
        "Não foi possível salvar o palpite.",
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
        timeZone: "America/Belem",
      },
    ).format(
      new Date(match.startsAt),
    );

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-800 bg-[#0e2131] p-5"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-lime-400">
            Rodada {match.round}
          </span>

          <p className="mt-1 text-sm text-slate-400">
            {matchDate} · {match.stadium}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <TeamName
            abbreviation={
              match.homeTeam.abbreviation
            }
            name={match.homeTeam.name}
          />

          <ScoreInput
            label={`Placar do ${match.homeTeam.name}`}
            value={homeScore}
            disabled={locked || saving}
            onChange={setHomeScore}
          />

          <span className="font-extrabold text-slate-500">
            ×
          </span>

          <ScoreInput
            label={`Placar do ${match.awayTeam.name}`}
            value={awayScore}
            disabled={locked || saving}
            onChange={setAwayScore}
          />

          <TeamName
            abbreviation={
              match.awayTeam.abbreviation
            }
            name={match.awayTeam.name}
            align="right"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          {feedback ? (
            <span
              className={
                feedbackIsError
                  ? "text-red-400"
                  : "text-emerald-400"
              }
            >
              {feedback}
            </span>
          ) : savedPrediction ? (
            <span className="text-slate-400">
              Salvo:{" "}
              <strong className="text-white">
                {savedPrediction.homeScore} ×{" "}
                {savedPrediction.awayScore}
              </strong>
            </span>
          ) : (
            <span className="text-slate-500">
              Palpite ainda não preenchido
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={locked || saving}
          className="rounded-xl bg-lime-400 px-5 py-2.5 text-sm font-extrabold text-slate-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          {locked
            ? "Palpite encerrado"
            : saving
              ? "Salvando..."
              : "Salvar palpite"}
        </button>
      </div>
    </form>
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
  onChange: (value: string) => void;
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
        onChange(event.target.value)
      }
      className="h-12 w-14 rounded-xl border border-slate-700 bg-slate-950 text-center text-lg font-extrabold outline-none transition focus:border-lime-400 disabled:opacity-50"
    />
  );
}

function TeamName({
  abbreviation,
  name,
  align = "left",
}: {
  abbreviation: string;
  name: string;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`w-20 ${
        align === "right"
          ? "text-right"
          : "text-left"
      }`}
    >
      <strong className="block">
        {abbreviation}
      </strong>

      <span className="hidden text-xs text-slate-500 sm:block">
        {name}
      </span>
    </div>
  );
}