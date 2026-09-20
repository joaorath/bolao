"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

import { useDemoStore } from "@/contexts/demo-store";
import { upcomingMatches } from "@/data/mock-data";

import type {
  Match,
  Prediction,
} from "@/types";

const ACTIVE_POOL_ID = "charqueons-resenha";

export default function PredictionsPage() {
  const {
    predictions,
    getPrediction,
    savePrediction,
  } = useDemoStore();

  const completedPredictions =
    upcomingMatches.filter((match) =>
      getPrediction(ACTIVE_POOL_ID, match.id),
    ).length;

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/boloes"
        className="text-sm font-bold text-lime-400"
      >
        ← Voltar para bolões
      </Link>

      <header className="mt-6">
        <span className="text-xs font-extrabold tracking-[0.2em] text-lime-400">
          CHARQUEONS DA RESENHA
        </span>

        <h1 className="mt-3 text-4xl font-extrabold">
          Palpites da rodada
        </h1>

        <p className="mt-2 text-slate-400">
          Rodada 4 · Edite até o início de
          cada partida.
        </p>
      </header>

      <section className="mt-7 rounded-2xl border border-slate-800 bg-[#0e2131] p-5">
        <div className="flex justify-between">
          <span className="text-sm text-slate-400">
            Palpites enviados
          </span>

          <strong>
            {completedPredictions}/
            {upcomingMatches.length}
          </strong>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full rounded-full bg-lime-400 transition-all"
            style={{
              width: `${
                (completedPredictions /
                  upcomingMatches.length) *
                100
              }%`,
            }}
          />
        </div>
      </section>

      <section className="mt-6 space-y-4">
        {upcomingMatches.map((match) => (
          <PredictionCard
            key={match.id}
            match={match}
            savedPrediction={getPrediction(
              ACTIVE_POOL_ID,
              match.id,
            )}
            onSave={(homeScore, awayScore) =>
              savePrediction({
                poolId: ACTIVE_POOL_ID,
                matchId: match.id,
                homeScore,
                awayScore,
              })
            }
          />
        ))}
      </section>

      <p className="mt-6 text-center text-xs text-slate-500">
        {predictions.length} palpites armazenados
        neste navegador.
      </p>
    </div>
  );
}

type PredictionCardProps = {
  match: Match;
  savedPrediction?: Prediction;
  onSave: (
    homeScore: number,
    awayScore: number,
  ) => void;
};

function PredictionCard({
  match,
  savedPrediction,
  onSave,
}: PredictionCardProps) {
  const [homeScore, setHomeScore] = useState(
    savedPrediction?.homeScore ?? 0,
  );

  const [awayScore, setAwayScore] = useState(
    savedPrediction?.awayScore ?? 0,
  );

  const [saved, setSaved] = useState(
    Boolean(savedPrediction),
  );

  useEffect(() => {
    if (!savedPrediction) {
      return;
    }

    setHomeScore(savedPrediction.homeScore);
    setAwayScore(savedPrediction.awayScore);
    setSaved(true);
  }, [savedPrediction]);

  const locked =
    match.status === "LIVE" ||
    match.status === "HALFTIME" ||
    match.status === "FINISHED";

  function handleSave() {
    if (locked) {
      return;
    }

    onSave(homeScore, awayScore);
    setSaved(true);
  }

  return (
    <article className="rounded-2xl border border-slate-800 bg-[#0e2131] p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500">
          {match.competition} · Rodada{" "}
          {match.round}
        </span>

        <span
          className={`rounded-full px-3 py-1 text-[10px] font-bold ${
            locked
              ? "bg-red-500/10 text-red-400"
              : "bg-emerald-400/10 text-emerald-400"
          }`}
        >
          {locked
            ? "BLOQUEADO"
            : "PALPITE ABERTO"}
        </span>
      </div>

      <div className="my-7 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <TeamDisplay
          name={match.homeTeam.name}
          abbreviation={
            match.homeTeam.abbreviation
          }
          color={
            match.homeTeam.primaryColor
          }
        />

        <div className="flex items-center gap-3">
          <ScoreInput
            value={homeScore}
            disabled={locked}
            label={`Gols de ${match.homeTeam.name}`}
            onChange={(value) => {
              setHomeScore(value);
              setSaved(false);
            }}
          />

          <span className="text-slate-500">
            ×
          </span>

          <ScoreInput
            value={awayScore}
            disabled={locked}
            label={`Gols de ${match.awayTeam.name}`}
            onChange={(value) => {
              setAwayScore(value);
              setSaved(false);
            }}
          />
        </div>

        <TeamDisplay
          name={match.awayTeam.name}
          abbreviation={
            match.awayTeam.abbreviation
          }
          color={
            match.awayTeam.primaryColor
          }
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-slate-500">
          {match.stadium} ·{" "}
          {new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(match.startsAt))}
        </span>

        <button
          type="button"
          disabled={locked}
          onClick={handleSave}
          className={`rounded-xl px-5 py-2.5 text-sm font-extrabold ${
            saved
              ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
              : "bg-lime-400 text-slate-950"
          } disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400`}
        >
          {locked
            ? "Palpite bloqueado"
            : saved
              ? "Salvo ✓"
              : "Salvar palpite"}
        </button>
      </div>
    </article>
  );
}

function TeamDisplay({
  name,
  abbreviation,
  color,
}: {
  name: string;
  abbreviation: string;
  color: string;
}) {
  return (
    <div className="text-center">
      <span
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl text-xs font-extrabold"
        style={{
          backgroundColor: color,
        }}
      >
        {abbreviation}
      </span>

      <strong className="mt-2 block text-sm">
        {name}
      </strong>
    </div>
  );
}

function ScoreInput({
  value,
  disabled,
  label,
  onChange,
}: {
  value: number;
  disabled: boolean;
  label: string;
  onChange: (value: number) => void;
}) {
  return (
    <input
      type="number"
      min={0}
      max={20}
      value={value}
      disabled={disabled}
      aria-label={label}
      onChange={(event) => {
        const newValue = Number(
          event.target.value,
        );

        onChange(
          Number.isNaN(newValue)
            ? 0
            : Math.min(
                20,
                Math.max(0, newValue),
              ),
        );
      }}
      className="h-12 w-14 rounded-xl border border-slate-700 bg-slate-950/60 text-center text-xl font-extrabold outline-none focus:border-lime-400 disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}