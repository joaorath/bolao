"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

import type { Match } from "@/types";

type AdminMatchEditorProps = {
  matches: Match[];
  onMatchUpdated: (
    match: Match,
  ) => void;
};

export function AdminMatchEditor({
  matches,
  onMatchUpdated,
}: AdminMatchEditorProps) {
  const [selectedMatchId, setSelectedMatchId] =
    useState("");

  const [competition, setCompetition] =
    useState("");

  const [round, setRound] =
    useState("");

  const [stadium, setStadium] =
    useState("");

  const [startsAt, setStartsAt] =
    useState("");

  const [homeName, setHomeName] =
    useState("");

  const [homeAbbreviation, setHomeAbbreviation] =
    useState("");

  const [homeColor, setHomeColor] =
    useState("#334155");

  const [awayName, setAwayName] =
    useState("");

  const [awayAbbreviation, setAwayAbbreviation] =
    useState("");

  const [awayColor, setAwayColor] =
    useState("#334155");

  const [saving, setSaving] =
    useState(false);

  const [feedback, setFeedback] =
    useState("");

  const [
    feedbackIsError,
    setFeedbackIsError,
  ] = useState(false);

  const editableMatches =
    matches.filter(
      (match) =>
        match.status !== "LIVE" &&
        match.status !== "HALFTIME" &&
        match.status !== "FINISHED",
    );

  const selectedMatch =
    matches.find(
      (match) =>
        match.id === selectedMatchId,
    );

  useEffect(() => {
    if (!selectedMatch) {
      return;
    }

    setCompetition(
      selectedMatch.competition,
    );

    setRound(
      String(selectedMatch.round),
    );

    setStadium(
      selectedMatch.stadium ===
        "Estádio não informado"
        ? ""
        : selectedMatch.stadium,
    );

    setStartsAt(
      toDateTimeLocalValue(
        selectedMatch.startsAt,
      ),
    );

    setHomeName(
      selectedMatch.homeTeam.name,
    );

    setHomeAbbreviation(
      selectedMatch.homeTeam.abbreviation,
    );

    setHomeColor(
      selectedMatch.homeTeam.primaryColor,
    );

    setAwayName(
      selectedMatch.awayTeam.name,
    );

    setAwayAbbreviation(
      selectedMatch.awayTeam.abbreviation,
    );

    setAwayColor(
      selectedMatch.awayTeam.primaryColor,
    );
  }, [selectedMatch]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedMatch) {
      setFeedback(
        "Selecione uma partida.",
      );

      setFeedbackIsError(true);
      return;
    }

    const parsedRound = Number(round);

    if (
      !Number.isInteger(parsedRound) ||
      parsedRound < 1
    ) {
      setFeedback(
        "Informe uma rodada válida.",
      );

      setFeedbackIsError(true);
      return;
    }

    if (
      homeName.trim().toLowerCase() ===
      awayName.trim().toLowerCase()
    ) {
      setFeedback(
        "Os times precisam ser diferentes.",
      );

      setFeedbackIsError(true);
      return;
    }

    setSaving(true);
    setFeedback("");
    setFeedbackIsError(false);

    const startsAtIso =
      new Date(startsAt).toISOString();

    const supabase = createClient();

    const { error } = await supabase.rpc(
      "update_official_match_details",
      {
        target_match_id:
          selectedMatch.id,
        competition_value:
          competition.trim(),
        round_value: parsedRound,
        stadium_value:
          stadium.trim(),
        starts_at_value:
          startsAtIso,
        home_team_name_value:
          homeName.trim(),
        home_team_abbreviation_value:
          homeAbbreviation
            .trim()
            .toUpperCase(),
        home_team_color_value:
          homeColor,
        away_team_name_value:
          awayName.trim(),
        away_team_abbreviation_value:
          awayAbbreviation
            .trim()
            .toUpperCase(),
        away_team_color_value:
          awayColor,
      },
    );

    setSaving(false);

    if (error) {
      console.error(
        "Erro ao editar partida:",
        error,
      );

      setFeedback(
        getUpdateErrorMessage(
          error.message,
        ),
      );

      setFeedbackIsError(true);
      return;
    }

    onMatchUpdated({
      ...selectedMatch,
      competition:
        competition.trim(),
      round: parsedRound,
      stadium:
        stadium.trim() ||
        "Estádio não informado",
      startsAt: startsAtIso,
      homeTeam: {
        ...selectedMatch.homeTeam,
        name: homeName.trim(),
        abbreviation:
          homeAbbreviation
            .trim()
            .toUpperCase(),
        primaryColor: homeColor,
      },
      awayTeam: {
        ...selectedMatch.awayTeam,
        name: awayName.trim(),
        abbreviation:
          awayAbbreviation
            .trim()
            .toUpperCase(),
        primaryColor: awayColor,
      },
    });

    setFeedback(
      "Dados da partida atualizados.",
    );
  }

  return (
    <section className="mb-8 rounded-2xl border border-slate-800 bg-[#0e2131] p-5 sm:p-6">
      <span className="text-xs font-extrabold tracking-[0.2em] text-sky-400">
        CORREÇÕES
      </span>

      <h2 className="mt-2 text-xl font-extrabold">
        Editar partida
      </h2>

      <p className="mt-2 text-sm text-slate-400">
        Apenas partidas que ainda não começaram
        podem ter seus dados alterados.
      </p>

      <label className="mt-5 block">
        <span className="text-sm font-bold text-slate-300">
          Escolha a partida
        </span>

        <select
          value={selectedMatchId}
          onChange={(event) => {
            setSelectedMatchId(
              event.target.value,
            );

            setFeedback("");
          }}
          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-sky-400"
        >
          <option value="">
            Selecione uma partida
          </option>

          {editableMatches.map((match) => (
            <option
              key={match.id}
              value={match.id}
            >
              Rodada {match.round} —{" "}
              {match.homeTeam.name} ×{" "}
              {match.awayTeam.name}
            </option>
          ))}
        </select>
      </label>

      {selectedMatch && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 border-t border-slate-800 pt-6"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <EditField
              label="Competição"
              value={competition}
              onChange={setCompetition}
            />

            <EditField
              label="Rodada"
              type="number"
              value={round}
              onChange={setRound}
            />

            <EditField
              label="Estádio"
              value={stadium}
              required={false}
              onChange={setStadium}
            />

            <EditField
              label="Data e horário"
              type="datetime-local"
              value={startsAt}
              onChange={setStartsAt}
            />
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <EditTeamFields
              title="Time mandante"
              name={homeName}
              abbreviation={
                homeAbbreviation
              }
              color={homeColor}
              onNameChange={setHomeName}
              onAbbreviationChange={
                setHomeAbbreviation
              }
              onColorChange={setHomeColor}
            />

            <EditTeamFields
              title="Time visitante"
              name={awayName}
              abbreviation={
                awayAbbreviation
              }
              color={awayColor}
              onNameChange={setAwayName}
              onAbbreviationChange={
                setAwayAbbreviation
              }
              onColorChange={setAwayColor}
            />
          </div>

          {feedback && (
            <p
              className={`mt-5 text-sm ${
                feedbackIsError
                  ? "text-red-400"
                  : "text-emerald-400"
              }`}
            >
              {feedback}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-6 w-full rounded-xl bg-sky-400 px-6 py-3 font-extrabold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:bg-slate-700 sm:w-auto"
          >
            {saving
              ? "Atualizando..."
              : "Salvar alterações"}
          </button>
        </form>
      )}
    </section>
  );
}

function EditTeamFields({
  title,
  name,
  abbreviation,
  color,
  onNameChange,
  onAbbreviationChange,
  onColorChange,
}: {
  title: string;
  name: string;
  abbreviation: string;
  color: string;
  onNameChange: (value: string) => void;
  onAbbreviationChange: (
    value: string,
  ) => void;
  onColorChange: (
    value: string,
  ) => void;
}) {
  return (
    <fieldset className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
      <legend className="px-2 text-sm font-extrabold text-sky-400">
        {title}
      </legend>

      <div className="grid gap-4 sm:grid-cols-[1fr_110px]">
        <EditField
          label="Nome"
          value={name}
          onChange={onNameChange}
        />

        <EditField
          label="Sigla"
          value={abbreviation}
          maxLength={5}
          onChange={(value) =>
            onAbbreviationChange(
              value
                .toUpperCase()
                .slice(0, 5),
            )
          }
        />
      </div>

      <label className="mt-4 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-300">
          Cor principal
        </span>

        <input
          type="color"
          value={color}
          onChange={(event) =>
            onColorChange(
              event.target.value,
            )
          }
          className="h-10 w-16 cursor-pointer rounded-lg border border-slate-700 bg-slate-950 p-1"
        />
      </label>
    </fieldset>
  );
}

function EditField({
  label,
  value,
  onChange,
  type = "text",
  required = true,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-300">
        {label}
      </span>

      <input
        required={required}
        type={type}
        min={
          type === "number"
            ? 1
            : undefined
        }
        maxLength={maxLength}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-sky-400"
      />
    </label>
  );
}

function toDateTimeLocalValue(
  value: string,
) {
  const date = new Date(value);

  const timezoneOffset =
    date.getTimezoneOffset() * 60000;

  return new Date(
    date.getTime() - timezoneOffset,
  )
    .toISOString()
    .slice(0, 16);
}

function getUpdateErrorMessage(
  message: string,
) {
  const normalized =
    message.toLowerCase();

  if (
    normalized.includes(
      "partida iniciada",
    )
  ) {
    return "Esta partida já começou e não pode mais ser editada.";
  }

  if (
    normalized.includes(
      "já existe outra",
    ) ||
    normalized.includes(
      "ja existe outra",
    )
  ) {
    return "Já existe outra partida com estes dados.";
  }

  if (
    normalized.includes(
      "permissão",
    ) ||
    normalized.includes(
      "permissao",
    )
  ) {
    return "Você não possui permissão para editar partidas.";
  }

  return (
    message ||
    "Não foi possível atualizar a partida."
  );
}