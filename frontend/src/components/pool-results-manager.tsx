"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

import type { Match } from "@/types";

type PoolResultsManagerProps = {
  matches: Match[];
  onResultSaved: (
    matchId: string,
    homeScore: number,
    awayScore: number,
  ) => void;
};

export function PoolResultsManager({
  matches,
  onResultSaved,
}: PoolResultsManagerProps) {
  const [checkingPermission, setCheckingPermission] =
    useState(true);

  const [isAdministrator, setIsAdministrator] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkPermission() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) {
          setCheckingPermission(false);
        }

        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error(
          "Erro ao verificar administrador:",
          error,
        );
      }

      if (!cancelled) {
        setIsAdministrator(
          Boolean(data?.is_admin),
        );

        setCheckingPermission(false);
      }
    }

    checkPermission();

    return () => {
      cancelled = true;
    };
  }, []);

  if (
    checkingPermission ||
    !isAdministrator
  ) {
    return null;
  }

  return (
    <section className="mb-8 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5 sm:p-6">
      <span className="text-xs font-extrabold tracking-[0.2em] text-amber-400">
        PAINEL DO ADMINISTRADOR
      </span>

      <h2 className="mt-3 text-xl font-extrabold">
        Informar resultados oficiais
      </h2>

      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
        O resultado será aplicado ao Ranking Geral
        e a todos os bolões que possuem esta
        partida.
      </p>

      <div className="mt-6 space-y-4">
        {matches.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#0e2131] p-5 text-sm text-slate-400">
            Nenhuma partida disponível.
          </div>
        ) : (
          matches.map((match) => (
            <ResultEditor
              key={match.id}
              match={match}
              onResultSaved={onResultSaved}
            />
          ))
        )}
      </div>
    </section>
  );
}

function ResultEditor({
  match,
  onResultSaved,
}: {
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
      Number.isInteger(parsedHomeScore) &&
      Number.isInteger(parsedAwayScore) &&
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

    const { error } = await supabase.rpc(
      "save_official_match_result",
      {
        target_match_id: match.id,
        home_score_value:
          parsedHomeScore,
        away_score_value:
          parsedAwayScore,
      },
    );

    setSaving(false);

    if (error) {
      console.error(
        "Erro ao salvar resultado oficial:",
        error,
      );

      setFeedback(
        error.message.includes(
          "administradores",
        )
          ? "Sua conta não possui permissão administrativa."
          : "Não foi possível salvar o resultado.",
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
      "Resultado oficial salvo. Todos os rankings foram atualizados.",
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-800 bg-[#0e2131] p-4"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <strong className="block">
            {match.homeTeam.name} ×{" "}
            {match.awayTeam.name}
          </strong>

          <p className="mt-1 text-xs text-slate-500">
            Rodada {match.round}
            {" · "}
            {match.stadium}
          </p>

          {match.status === "FINISHED" && (
            <span className="mt-2 inline-block rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-extrabold text-emerald-400">
              RESULTADO CADASTRADO
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label>
            <span className="sr-only">
              Placar do{" "}
              {match.homeTeam.name}
            </span>

            <input
              required
              type="number"
              inputMode="numeric"
              min={0}
              max={99}
              value={homeScore}
              onChange={(event) =>
                setHomeScore(
                  event.target.value,
                )
              }
              className="h-11 w-14 rounded-xl border border-slate-700 bg-slate-950 text-center font-extrabold outline-none transition focus:border-amber-400"
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
              inputMode="numeric"
              min={0}
              max={99}
              value={awayScore}
              onChange={(event) =>
                setAwayScore(
                  event.target.value,
                )
              }
              className="h-11 w-14 rounded-xl border border-slate-700 bg-slate-950 text-center font-extrabold outline-none transition focus:border-amber-400"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="min-w-24 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-extrabold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            {saving
              ? "Salvando..."
              : match.status === "FINISHED"
                ? "Corrigir"
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