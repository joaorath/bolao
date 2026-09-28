"use client";

import {
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

import type {
  Match,
  MatchStatus,
} from "@/types";

type PoolResultsManagerProps = {
  matches: Match[];
  onResultSaved: (
    matchId: string,
    homeScore: number | undefined,
    awayScore: number | undefined,
    status: MatchStatus,
  ) => void;
};

export function PoolResultsManager({
  matches,
  onResultSaved,
}: PoolResultsManagerProps) {
  const [checkingAdmin, setCheckingAdmin] =
    useState(true);

  const [isAdmin, setIsAdmin] =
    useState(false);

  useEffect(() => {
    async function checkAdministrator() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCheckingAdmin(false);
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

        setCheckingAdmin(false);
        return;
      }

      setIsAdmin(
        Boolean(data?.is_admin),
      );

      setCheckingAdmin(false);
    }

    checkAdministrator();
  }, []);

  if (checkingAdmin || !isAdmin) {
    return null;
  }

  return (
    <section className="mb-8 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5 sm:p-6">
      <span className="text-xs font-extrabold tracking-[0.2em] text-amber-400">
        PAINEL DO ADMINISTRADOR
      </span>

      <h2 className="mt-3 text-xl font-extrabold">
        Controle das partidas
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        Inicie o jogo, atualize o placar durante a
        partida e finalize para calcular os pontos
        do ranking.
      </p>

      {matches.length === 0 ? (
        <div className="mt-6 rounded-xl border border-slate-800 bg-[#0e2131] p-5 text-slate-400">
          Nenhuma partida disponível.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {matches.map((match) => (
            <ResultEditor
              key={match.id}
              match={match}
              onResultSaved={onResultSaved}
            />
          ))}
        </div>
      )}
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
    homeScore: number | undefined,
    awayScore: number | undefined,
    status: MatchStatus,
  ) => void;
}) {
  const [homeScore, setHomeScore] =
    useState(
      match.homeScore !== undefined
        ? String(match.homeScore)
        : "0",
    );

  const [awayScore, setAwayScore] =
    useState(
      match.awayScore !== undefined
        ? String(match.awayScore)
        : "0",
    );

  const [feedback, setFeedback] =
    useState("");

  const [
    feedbackIsError,
    setFeedbackIsError,
  ] = useState(false);

  const [savingStatus, setSavingStatus] =
    useState<MatchStatus | null>(null);

  useEffect(() => {
    setHomeScore(
      match.homeScore !== undefined
        ? String(match.homeScore)
        : "0",
    );

    setAwayScore(
      match.awayScore !== undefined
        ? String(match.awayScore)
        : "0",
    );
  }, [
    match.homeScore,
    match.awayScore,
  ]);

  function parseScores() {
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
      return null;
    }

    return {
      homeScore: parsedHomeScore,
      awayScore: parsedAwayScore,
    };
  }

  async function updateMatchStatus(
    newStatus: MatchStatus,
  ) {
    setFeedback("");
    setFeedbackIsError(false);

    const reopening =
      newStatus === "OPEN";

    const scores = reopening
      ? {
          homeScore: undefined,
          awayScore: undefined,
        }
      : parseScores();

    if (!scores) {
      setFeedback(
        "Informe um placar válido para os dois times.",
      );

      setFeedbackIsError(true);
      return;
    }

    setSavingStatus(newStatus);

    const supabase = createClient();

    const { error } = await supabase.rpc(
      "update_official_match_state",
      {
        target_match_id: match.id,
        new_status: newStatus,
        home_score_value:
          scores.homeScore ?? null,
        away_score_value:
          scores.awayScore ?? null,
      },
    );

    setSavingStatus(null);

    if (error) {
      console.error(
        "Erro ao atualizar partida:",
        error,
      );

      setFeedback(
        error.message ||
          "Não foi possível atualizar a partida.",
      );

      setFeedbackIsError(true);
      return;
    }

    if (reopening) {
      setHomeScore("0");
      setAwayScore("0");
    }

    onResultSaved(
      match.id,
      scores.homeScore,
      scores.awayScore,
      newStatus,
    );

    setFeedback(
      getSuccessMessage(newStatus),
    );
  }

  const saving = savingStatus !== null;

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0e2131] p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <strong>
              {match.homeTeam.name} ×{" "}
              {match.awayTeam.name}
            </strong>

            <MatchStatusBadge
              status={match.status}
            />
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Rodada {match.round} ·{" "}
            {match.stadium}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center justify-center gap-3">
            <label>
              <span className="sr-only">
                Placar do{" "}
                {match.homeTeam.name}
              </span>

              <input
                type="number"
                min={0}
                max={99}
                value={homeScore}
                disabled={saving}
                onChange={(event) =>
                  setHomeScore(
                    event.target.value,
                  )
                }
                className="h-11 w-14 rounded-xl border border-slate-700 bg-slate-950 text-center font-extrabold outline-none focus:border-amber-400 disabled:opacity-50"
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
                type="number"
                min={0}
                max={99}
                value={awayScore}
                disabled={saving}
                onChange={(event) =>
                  setAwayScore(
                    event.target.value,
                  )
                }
                className="h-11 w-14 rounded-xl border border-slate-700 bg-slate-950 text-center font-extrabold outline-none focus:border-amber-400 disabled:opacity-50"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                updateMatchStatus("OPEN")
              }
              className="rounded-xl border border-slate-600 px-3 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingStatus === "OPEN"
                ? "Salvando..."
                : "Reabrir"}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                updateMatchStatus("LIVE")
              }
              className="rounded-xl border border-red-400/40 px-3 py-2.5 text-xs font-bold text-red-400 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingStatus === "LIVE"
                ? "Salvando..."
                : match.status === "LIVE"
                  ? "Atualizar ao vivo"
                  : "Iniciar"}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                updateMatchStatus(
                  "HALFTIME",
                )
              }
              className="rounded-xl border border-amber-400/40 px-3 py-2.5 text-xs font-bold text-amber-400 transition hover:bg-amber-400/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingStatus === "HALFTIME"
                ? "Salvando..."
                : "Intervalo"}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                updateMatchStatus(
                  "FINISHED",
                )
              }
              className="rounded-xl bg-amber-400 px-3 py-2.5 text-xs font-extrabold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              {savingStatus === "FINISHED"
                ? "Salvando..."
                : "Finalizar"}
            </button>
          </div>
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
    </div>
  );
}

function MatchStatusBadge({
  status,
}: {
  status: MatchStatus;
}) {
  const styles: Record<
    string,
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

  const labels: Record<
    string,
    string
  > = {
    OPEN: "PALPITES ABERTOS",
    SCHEDULED: "AGENDADO",
    LIVE: "AO VIVO",
    HALFTIME: "INTERVALO",
    FINISHED: "ENCERRADO",
    POSTPONED: "ADIADO",
    CANCELLED: "CANCELADO",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-[10px] font-bold ${
        styles[status] ??
        "bg-slate-500/10 text-slate-400"
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function getSuccessMessage(
  status: MatchStatus,
) {
  if (status === "OPEN") {
    return "Partida reaberta e palpites liberados.";
  }

  if (status === "LIVE") {
    return "Placar ao vivo atualizado.";
  }

  if (status === "HALFTIME") {
    return "Partida marcada como intervalo.";
  }

  if (status === "FINISHED") {
    return "Partida finalizada e ranking atualizado.";
  }

  return "Partida atualizada.";
}