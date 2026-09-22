"use client";

import {
  useEffect,
  useState,
} from "react";

import { calculateScore } from "@/lib/api";

import type {
  Match,
  Prediction,
} from "@/types";

import type { ApiPredictionScore } from "@/types/api";

type LiveMatchCardProps = {
  match: Match;
  prediction: Prediction;
};

const simulatedEvents = [
  {
    minute: 72,
    homeScore: 1,
    awayScore: 1,
    message: "Gol do Paysandu",
  },
  {
    minute: 78,
    homeScore: 2,
    awayScore: 1,
    message: "Gol do Remo",
  },
  {
    minute: 90,
    homeScore: 2,
    awayScore: 1,
    message: "Fim de jogo",
  },
];

export function LiveMatchCard({
  match,
  prediction,
}: LiveMatchCardProps) {
  const [homeScore, setHomeScore] = useState(
    match.homeScore ?? 0,
  );

  const [awayScore, setAwayScore] = useState(
    match.awayScore ?? 0,
  );

  const [minute, setMinute] = useState(
    match.elapsedMinutes ?? 0,
  );

  const [eventIndex, setEventIndex] =
    useState(0);

  const [lastEvent, setLastEvent] =
    useState(
      "Gol do Remo aos 67 minutos",
    );

  const [
    projectedScore,
    setProjectedScore,
  ] = useState<ApiPredictionScore | null>(
    null,
  );

  const [scoreError, setScoreError] =
    useState(false);

  useEffect(() => {
    const controller =
      new AbortController();

    async function updateProjectedScore() {
      setProjectedScore(null);
      setScoreError(false);

      try {
        const score = await calculateScore(
          {
            predictedHomeScore:
              prediction.homeScore,

            predictedAwayScore:
              prediction.awayScore,

            officialHomeScore:
              homeScore,

            officialAwayScore:
              awayScore,
          },
          controller.signal,
        );

        setProjectedScore(score);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setProjectedScore(null);
        setScoreError(true);
      }
    }

    updateProjectedScore();

    return () => {
      controller.abort();
    };
  }, [
    homeScore,
    awayScore,
    prediction.homeScore,
    prediction.awayScore,
  ]);

  function simulateNextEvent() {
    const event =
      simulatedEvents[eventIndex];

    if (!event) {
      return;
    }

    setHomeScore(event.homeScore);
    setAwayScore(event.awayScore);
    setMinute(event.minute);
    setLastEvent(event.message);

    setEventIndex(
      (currentIndex) =>
        currentIndex + 1,
    );
  }

  const finished =
    eventIndex >= simulatedEvents.length;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-[#15334a] to-[#0b1d2b] p-6">
      <div className="flex items-center justify-between">
        <span
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold ${
            finished
              ? "bg-slate-500/10 text-slate-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              finished
                ? "bg-slate-500"
                : "bg-red-500"
            }`}
          />

          {finished
            ? "ENCERRADO"
            : "AO VIVO"}
        </span>

        <strong
          className={
            finished
              ? "text-slate-400"
              : "text-lime-400"
          }
        >
          {finished
            ? "FIM"
            : `${minute}'`}
        </strong>
      </div>

      <p className="mt-5 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
        {match.competition} · Rodada{" "}
        {match.round}
      </p>

      <div className="my-7 grid grid-cols-[1fr_auto_1fr] items-center gap-5">
        <div className="text-center">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-lg font-extrabold"
            style={{
              backgroundColor:
                match.homeTeam.primaryColor,
            }}
          >
            {match.homeTeam.abbreviation}
          </div>

          <strong className="mt-3 block">
            {match.homeTeam.name}
          </strong>
        </div>

        <div className="flex items-center gap-4">
          <strong className="text-5xl">
            {homeScore}
          </strong>

          <span className="text-slate-500">
            ×
          </span>

          <strong className="text-5xl">
            {awayScore}
          </strong>
        </div>

        <div className="text-center">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-lg font-extrabold"
            style={{
              backgroundColor:
                match.awayTeam.primaryColor,
            }}
          >
            {match.awayTeam.abbreviation}
          </div>

          <strong className="mt-3 block">
            {match.awayTeam.name}
          </strong>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl bg-slate-950/40 p-4 sm:grid-cols-2">
        <div>
          <span className="text-xs font-bold text-slate-500">
            SEU PALPITE
          </span>

          <strong className="mt-1 block">
            {prediction.homeScore} ×{" "}
            {prediction.awayScore}
          </strong>
        </div>

        <div className="sm:text-right">
          <span className="text-xs font-bold text-slate-500">
            SE TERMINASSE AGORA
          </span>

          {scoreError ? (
            <strong className="mt-1 block text-red-400">
              Servidor indisponível
            </strong>
          ) : !projectedScore ? (
            <strong className="mt-1 block text-slate-400">
              Calculando...
            </strong>
          ) : (
            <strong
              className={`mt-1 block ${
                projectedScore.points === 0
                  ? "text-red-400"
                  : "text-emerald-400"
              }`}
            >
              {projectedScore.points === 0
                ? "0 pontos"
                : `+${projectedScore.points} pontos`}
            </strong>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-slate-400">
        Último evento: {lastEvent}
      </p>

      <button
        type="button"
        onClick={simulateNextEvent}
        disabled={finished}
        className="mt-4 w-full rounded-xl bg-lime-400 px-4 py-3 font-extrabold text-slate-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
      >
        {finished
          ? "Partida encerrada"
          : "Simular próximo lance"}
      </button>
    </article>
  );
}