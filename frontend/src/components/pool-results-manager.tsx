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
        Atualize o andamento e o placar. Somente
        partidas encerradas contam pontos no
        ranking.
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

    if (newStatus === "CANCELLED") {
      const confirmed = window.confirm(
        `Cancelar a partida "${match.homeTeam.name} × ${match.awayTeam.name}"? Os palpites não serão pontuados.`,
      );

      if (!confirmed) {
        return;
      }
    }

    if (newStatus === "POSTPONED") {
      const confirmed = window.confirm(
        `Marcar a partida "${match.homeTeam.name} × ${match.awayTeam.name}" como adiada?`,
      );

      if (!confirmed) {
        return;
      }
    }

    const requiresScores =
      newStatus === "LIVE" ||
      newStatus === "HALFTIME" ||
      newStatus === "FINISHED";

    let scores: {
      homeScore: number | undefined;
      awayScore: number | undefined;
    };

    if (requiresScores) {
      const parsedScores =
        parseScores();

      if (!parsedScores) {
        setFeedback(
          "Informe um placar válido para os dois times.",
        );

        setFeedbackIsError(true);
        return;
      }

      scores = parsedScores;
    } else if (
      newStatus === "POSTPONED"
    ) {
      scores = {
        homeScore: match.homeScore,
        awayScore: match.awayScore,
      };
    } else {
      scores = {
        homeScore: undefined,
        awayScore: undefined,
      };
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

    if (
      newStatus === "OPEN" ||
      newStatus === "SCHEDULED" ||
      newStatus === "CANCELLED"
    ) {
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
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

          <div className="flex items-center justify-center gap-3 xl:justify-end">
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
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          <StatusButton
            label="Reabrir"
            loadingLabel="Reabrindo..."
            color="slate"
            targetStatus="OPEN"
            savingStatus={savingStatus}
            disabled={saving}
            onClick={updateMatchStatus}
          />

          <StatusButton
            label={
              match.status === "LIVE"
                ? "Atualizar ao vivo"
                : "Iniciar"
            }
            loadingLabel="Atualizando..."
            color="red"
            targetStatus="LIVE"
            savingStatus={savingStatus}
            disabled={saving}
            onClick={updateMatchStatus}
          />

          <StatusButton
            label="Intervalo"
            loadingLabel="Atualizando..."
            color="amber"
            targetStatus="HALFTIME"
            savingStatus={savingStatus}
            disabled={saving}
            onClick={updateMatchStatus}
          />

          <StatusButton
            label="Adiar"
            loadingLabel="Adiando..."
            color="purple"
            targetStatus="POSTPONED"
            savingStatus={savingStatus}
            disabled={saving}
            onClick={updateMatchStatus}
          />

          <StatusButton
            label="Cancelar"
            loadingLabel="Cancelando..."
            color="rose"
            targetStatus="CANCELLED"
            savingStatus={savingStatus}
            disabled={saving}
            onClick={updateMatchStatus}
          />

          <StatusButton
            label="Finalizar"
            loadingLabel="Finalizando..."
            color="lime"
            targetStatus="FINISHED"
            savingStatus={savingStatus}
            disabled={saving}
            onClick={updateMatchStatus}
          />
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

type StatusButtonColor =
  | "slate"
  | "red"
  | "amber"
  | "purple"
  | "rose"
  | "lime";

function StatusButton({
  label,
  loadingLabel,
  color,
  targetStatus,
  savingStatus,
  disabled,
  onClick,
}: {
  label: string;
  loadingLabel: string;
  color: StatusButtonColor;
  targetStatus: MatchStatus;
  savingStatus: MatchStatus | null;
  disabled: boolean;
  onClick: (
    status: MatchStatus,
  ) => void;
}) {
  const styles: Record<
    StatusButtonColor,
    string
  > = {
    slate:
      "border-slate-600 text-slate-300 hover:bg-slate-800",
    red:
      "border-red-400/40 text-red-400 hover:bg-red-400/10",
    amber:
      "border-amber-400/40 text-amber-400 hover:bg-amber-400/10",
    purple:
      "border-purple-400/40 text-purple-400 hover:bg-purple-400/10",
    rose:
      "border-rose-400/40 text-rose-400 hover:bg-rose-400/10",
    lime:
      "border-lime-400 bg-lime-400 text-slate-950 hover:bg-lime-300",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() =>
        onClick(targetStatus)
      }
      className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[color]}`}
    >
      {savingStatus === targetStatus
        ? loadingLabel
        : label}
    </button>
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
      "bg-rose-400/10 text-rose-400",
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

  if (status === "SCHEDULED") {
    return "Partida marcada como agendada.";
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

  if (status === "POSTPONED") {
    return "Partida marcada como adiada. Nenhum ponto será calculado.";
  }

  if (status === "CANCELLED") {
    return "Partida cancelada. Os palpites não serão pontuados.";
  }

  return "Partida atualizada.";
}