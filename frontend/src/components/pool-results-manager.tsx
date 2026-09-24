"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

import type { Match } from "@/types";

type PoolResultsManagerProps = {
  poolId: string;
  matches: Match[];
  onResultSaved: (
    matchId: string,
    homeScore: number,
    awayScore: number,
  ) => void;
};

export function PoolResultsManager({
  poolId,
  matches,
  onResultSaved,
}: PoolResultsManagerProps) {
  return (
    <section className="mb-8 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-6">
      <span className="text-xs font-extrabold tracking-[0.2em] text-amber-400">
        PAINEL DO ADMINISTRADOR
      </span>

      <h2 className="mt-3 text-xl font-extrabold">
        Informar resultados
      </h2>

      <p className="mt-2 text-sm text-slate-400">
        Ao finalizar um jogo, os pontos e o
        ranking serão recalculados
        automaticamente.
      </p>

      <div className="mt-6 space-y-4">
        {matches.map((match) => (
          <ResultEditor
            key={match.id}
            poolId={poolId}
            match={match}
            onResultSaved={onResultSaved}
          />
        ))}
      </div>
    </section>
  );
}

function ResultEditor({
  poolId,
  match,
  onResultSaved,
}: {
  poolId: string;
  match: Match;
  onResultSaved: (
    matchId: string,
    homeScore: number,
    awayScore: number,
  ) => void;
}) {
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
      match.homeScore !== undefined
        ? String(match.homeScore)
        : "",
    );

    setAwayScore(
      match.awayScore !== undefined
        ? String(match.awayScore)
        : "",
    );
  }, [
    match.homeScore,
    match.awayScore,
  ]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const parsedHomeScore =
      Number(homeScore);

    const parsedAwayScore =
      Number(awayScore);

    const valid =
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

    if (!valid) {
      setFeedback(
        "Informe um placar válido.",
      );

      setFeedbackIsError(true);
      return;
    }

    setSaving(true);
    setFeedback("");
    setFeedbackIsError(false);

    const supabase = createClient();

    const { error } = await supabase
      .from("pool_matches")
      .update({
        official_home_score:
          parsedHomeScore,
        official_away_score:
          parsedAwayScore,
        status: "FINISHED",
        updated_at:
          new Date().toISOString(),
      })
      .eq("pool_id", poolId)
      .eq("match_id", match.id);

    setSaving(false);

    if (error) {
      console.error(
        "Erro ao salvar resultado:",
        error,
      );

      setFeedback(
        "Não foi possível salvar o resultado.",
      );

      setFeedbackIsError(true);
      return;
    }

    onResultSaved(
      match.id,
      parsedHomeScore,
      parsedAwayScore,
    );

    setFeedback(
      "Resultado salvo. O ranking foi atualizado.",
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-800 bg-[#0e2131] p-4"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <strong>
            {match.homeTeam.name} ×{" "}
            {match.awayTeam.name}
          </strong>

          <p className="mt-1 text-xs text-slate-500">
            Rodada {match.round} ·{" "}
            {match.stadium}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label>
            <span className="sr-only">
              Placar do{" "}
              {match.homeTeam.name}
            </span>

            <input
              required
              type="number"
              min={0}
              max={99}
              value={homeScore}
              onChange={(event) =>
                setHomeScore(
                  event.target.value,
                )
              }
              className="h-11 w-14 rounded-xl border border-slate-700 bg-slate-950 text-center font-extrabold outline-none focus:border-amber-400"
            />
          </label>

          <span className="font-extrabold text-slate-500">
            ×
          </span>

          <label>
            <span className="sr-only">
              Placar do{" "}
              {match.awayTeam.name}
            </span>

            <input
              required
              type="number"
              min={0}
              max={99}
              value={awayScore}
              onChange={(event) =>
                setAwayScore(
                  event.target.value,
                )
              }
              className="h-11 w-14 rounded-xl border border-slate-700 bg-slate-950 text-center font-extrabold outline-none focus:border-amber-400"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-extrabold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {saving
              ? "Salvando..."
              : match.status === "FINISHED"
                ? "Atualizar"
                : "Finalizar"}
          </button>
        </div>
      </div>

      {feedback && (
        <p
          className={`mt-3 text-sm ${
            feedbackIsError
              ? "text-red-400"
              : "text-emerald-400"
          }`}
        >
          {feedback}
        </p>
      )}
    </form>
  );
}