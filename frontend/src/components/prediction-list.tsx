"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useDemoStore } from "@/contexts/demo-store";
import { upcomingMatches } from "@/data/mock-data";

import type { Match } from "@/types";

type PredictionListProps = {
  poolId: string;
};

export function PredictionList({
  poolId,
}: PredictionListProps) {
  const { pools } = useDemoStore();

  const [applyToAllPools, setApplyToAllPools] =
    useState(false);

  const currentPool = pools.find(
    (pool) => pool.id === poolId,
  );

  const compatiblePools = pools.filter(
    (pool) =>
      pool.competition === currentPool?.competition,
  );

  return (
    <section>
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-[#0e2131] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-extrabold">
            Palpites da rodada
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Os palpites ficam salvos separadamente em
            cada bolão.
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={applyToAllPools}
            disabled={compatiblePools.length < 2}
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

      <div className="mt-5 space-y-4">
        {upcomingMatches.map((match) => (
          <PredictionEditor
            key={`${poolId}-${match.id}`}
            poolId={poolId}
            match={match}
            applyToAllPools={applyToAllPools}
          />
        ))}
      </div>
    </section>
  );
}

type PredictionEditorProps = {
  poolId: string;
  match: Match;
  applyToAllPools: boolean;
};

function PredictionEditor({
  poolId,
  match,
  applyToAllPools,
}: PredictionEditorProps) {
  const {
    pools,
    getPrediction,
    savePrediction,
  } = useDemoStore();

  const savedPrediction = getPrediction(
    poolId,
    match.id,
  );

  const [homeScore, setHomeScore] =
    useState("");

  const [awayScore, setAwayScore] =
    useState("");

  const [feedback, setFeedback] =
    useState("");

  useEffect(() => {
    setHomeScore(
      savedPrediction
        ? String(savedPrediction.homeScore)
        : "",
    );

    setAwayScore(
      savedPrediction
        ? String(savedPrediction.awayScore)
        : "",
    );

    setFeedback("");
  }, [
    poolId,
    match.id,
    savedPrediction,
  ]);

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const parsedHomeScore = Number(homeScore);
    const parsedAwayScore = Number(awayScore);

    const scoresAreValid =
      homeScore.trim() !== "" &&
      awayScore.trim() !== "" &&
      Number.isInteger(parsedHomeScore) &&
      Number.isInteger(parsedAwayScore) &&
      parsedHomeScore >= 0 &&
      parsedAwayScore >= 0 &&
      parsedHomeScore <= 99 &&
      parsedAwayScore <= 99;

    if (!scoresAreValid) {
      setFeedback(
        "Informe dois placares válidos.",
      );

      return;
    }

    const targetPoolIds = applyToAllPools
      ? pools
          .filter(
            (pool) =>
              pool.competition ===
              match.competition,
          )
          .map((pool) => pool.id)
      : [poolId];

    targetPoolIds.forEach((targetPoolId) => {
      savePrediction({
        poolId: targetPoolId,
        matchId: match.id,
        homeScore: parsedHomeScore,
        awayScore: parsedAwayScore,
      });
    });

    setFeedback(
      applyToAllPools
        ? `Palpite salvo em ${targetPoolIds.length} bolões.`
        : "Palpite salvo neste bolão.",
    );
  }

  const matchDate = new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Belem",
    },
  ).format(new Date(match.startsAt));

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
            disabled={savedPrediction?.locked}
            onChange={setHomeScore}
          />

          <span className="font-extrabold text-slate-500">
            ×
          </span>

          <ScoreInput
            label={`Placar do ${match.awayTeam.name}`}
            value={awayScore}
            disabled={savedPrediction?.locked}
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
                feedback.includes("válidos")
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
          disabled={savedPrediction?.locked}
          className="rounded-xl bg-lime-400 px-5 py-2.5 text-sm font-extrabold text-slate-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          {savedPrediction?.locked
            ? "Palpite encerrado"
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