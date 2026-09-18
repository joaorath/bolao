"use client";

import { useState } from "react";

import type { Match, Prediction } from "@/types";

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

function getResult(
  homeScore: number,
  awayScore: number,
) {
  if (homeScore > awayScore) {
    return "HOME_WIN";
  }

  if (homeScore < awayScore) {
    return "AWAY_WIN";
  }

  return "DRAW";
}

function calculateProjectedPoints(
  homeScore: number,
  awayScore: number,
  prediction: Prediction,
) {
  const exactScore =
    homeScore === prediction.homeScore &&
    awayScore === prediction.awayScore;

  if (exactScore) {
    return 5;
  }

  const currentResult = getResult(
    homeScore,
    awayScore,
  );

  const predictedResult = getResult(
    prediction.homeScore,
    prediction.awayScore,
  );

  return currentResult === predictedResult ? 3 : 0;
}

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

  const [eventIndex, setEventIndex] = useState(0);
  const [lastEvent, setLastEvent] = useState(
    "Gol do Remo aos 67 minutos",
  );

  const projectedPoints = calculateProjectedPoints(
    homeScore,
    awayScore,
    prediction,
  );

  function simulateNextEvent() {
    const event = simulatedEvents[eventIndex];

    if (!event) {
      return;
    }

    setHomeScore(event.homeScore);
    setAwayScore(event.awayScore);
    setMinute(event.minute);
    setLastEvent(event.message);
    setEventIndex((current) => current + 1);
  }

  const finished = eventIndex >= simulatedEvents.length;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-[#15334a] to-[#0b1d2b] p-6">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-xs font-extrabold text-red-400">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          {finished ? "ENCERRADO" : "AO VIVO"}
        </span>

        <strong className="text-lime-400">
          {finished ? "FIM" : `${minute}'`}
        </strong>
      </div>

      <p className="mt-5 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
        {match.competition} · Rodada {match.round}
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

          <span className="text-slate-500">×</span>

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

          <strong className="mt-1 block text-emerald-400">
            +{projectedPoints} pontos
          </strong>
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