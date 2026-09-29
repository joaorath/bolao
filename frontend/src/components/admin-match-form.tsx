"use client";

import {
  FormEvent,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

import type { Match } from "@/types";

type AdminMatchFormProps = {
  onMatchCreated: (
    match: Match,
  ) => void;
};

export function AdminMatchForm({
  onMatchCreated,
}: AdminMatchFormProps) {
  const [open, setOpen] =
    useState(false);

  const [competition, setCompetition] =
    useState("Campeonato Paraense");

  const [round, setRound] =
    useState("");

  const [stadium, setStadium] =
    useState("");

  const [startsAt, setStartsAt] =
    useState("");

  const [homeTeamName, setHomeTeamName] =
    useState("");

  const [
    homeTeamAbbreviation,
    setHomeTeamAbbreviation,
  ] = useState("");

  const [homeTeamColor, setHomeTeamColor] =
    useState("#334155");

  const [awayTeamName, setAwayTeamName] =
    useState("");

  const [
    awayTeamAbbreviation,
    setAwayTeamAbbreviation,
  ] = useState("");

  const [awayTeamColor, setAwayTeamColor] =
    useState("#334155");

  const [saving, setSaving] =
    useState(false);

  const [feedback, setFeedback] =
    useState("");

  const [
    feedbackIsError,
    setFeedbackIsError,
  ] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

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

    if (!startsAt) {
      setFeedback(
        "Informe a data e o horário da partida.",
      );

      setFeedbackIsError(true);
      return;
    }

    if (
      homeTeamName.trim().toLowerCase() ===
      awayTeamName.trim().toLowerCase()
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

    const { data, error } =
      await supabase.rpc(
        "create_official_match",
        {
          competition_value:
            competition.trim(),
          round_value: parsedRound,
          stadium_value:
            stadium.trim(),
          starts_at_value:
            startsAtIso,
          home_team_name_value:
            homeTeamName.trim(),
          home_team_abbreviation_value:
            homeTeamAbbreviation
              .trim()
              .toUpperCase(),
          home_team_color_value:
            homeTeamColor,
          away_team_name_value:
            awayTeamName.trim(),
          away_team_abbreviation_value:
            awayTeamAbbreviation
              .trim()
              .toUpperCase(),
          away_team_color_value:
            awayTeamColor,
        },
      );

    setSaving(false);

    if (error) {
      console.error(
        "Erro ao cadastrar partida:",
        error,
      );

      setFeedback(
        getCreateMatchErrorMessage(
          error.message,
        ),
      );

      setFeedbackIsError(true);
      return;
    }

    const matchId = String(data);

    onMatchCreated({
      id: matchId,
      competition:
        competition.trim(),
      round: parsedRound,
      stadium:
        stadium.trim() ||
        "Estádio não informado",
      startsAt: startsAtIso,
      status: "OPEN",
      homeTeam: {
        id: `${matchId}-home`,
        name: homeTeamName.trim(),
        abbreviation:
          homeTeamAbbreviation
            .trim()
            .toUpperCase(),
        primaryColor:
          homeTeamColor,
        secondaryColor: "#ffffff",
      },
      awayTeam: {
        id: `${matchId}-away`,
        name: awayTeamName.trim(),
        abbreviation:
          awayTeamAbbreviation
            .trim()
            .toUpperCase(),
        primaryColor:
          awayTeamColor,
        secondaryColor: "#ffffff",
      },
    });

    setFeedback(
      "Partida cadastrada e adicionada aos bolões.",
    );

    setFeedbackIsError(false);

    setStadium("");
    setStartsAt("");
    setHomeTeamName("");
    setHomeTeamAbbreviation("");
    setHomeTeamColor("#334155");
    setAwayTeamName("");
    setAwayTeamAbbreviation("");
    setAwayTeamColor("#334155");
  }

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-slate-800 bg-[#0e2131]">
      <button
        type="button"
        onClick={() =>
          setOpen((current) => !current)
        }
        className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6"
      >
        <div>
          <span className="text-xs font-extrabold tracking-[0.2em] text-lime-400">
            NOVA PARTIDA
          </span>

          <h2 className="mt-2 text-xl font-extrabold">
            Cadastrar partida
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            A partida será adicionada
            automaticamente aos bolões.
          </p>
        </div>

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-400 text-2xl font-bold text-slate-950">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="border-t border-slate-800 p-5 sm:p-6"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <TextField
              label="Competição"
              value={competition}
              onChange={setCompetition}
              placeholder="Campeonato Paraense"
            />

            <NumberField
              label="Rodada"
              value={round}
              onChange={setRound}
              min={1}
              placeholder="Ex.: 5"
            />

            <TextField
              label="Estádio"
              value={stadium}
              onChange={setStadium}
              placeholder="Ex.: Mangueirão"
              required={false}
            />

            <label className="block">
              <span className="text-sm font-bold text-slate-300">
                Data e horário
              </span>

              <input
                required
                type="datetime-local"
                value={startsAt}
                onChange={(event) =>
                  setStartsAt(
                    event.target.value,
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-lime-400"
              />
            </label>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <TeamFields
              title="Time mandante"
              name={homeTeamName}
              abbreviation={
                homeTeamAbbreviation
              }
              color={homeTeamColor}
              onNameChange={
                setHomeTeamName
              }
              onAbbreviationChange={
                setHomeTeamAbbreviation
              }
              onColorChange={
                setHomeTeamColor
              }
            />

            <TeamFields
              title="Time visitante"
              name={awayTeamName}
              abbreviation={
                awayTeamAbbreviation
              }
              color={awayTeamColor}
              onNameChange={
                setAwayTeamName
              }
              onAbbreviationChange={
                setAwayTeamAbbreviation
              }
              onColorChange={
                setAwayTeamColor
              }
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

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                setOpen(false)
              }
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-300"
            >
              Fechar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-lime-400 px-6 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              {saving
                ? "Cadastrando..."
                : "Cadastrar partida"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function TeamFields({
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
      <legend className="px-2 text-sm font-extrabold text-lime-400">
        {title}
      </legend>

      <div className="grid gap-4 sm:grid-cols-[1fr_110px]">
        <TextField
          label="Nome"
          value={name}
          onChange={onNameChange}
          placeholder="Nome do time"
        />

        <TextField
          label="Sigla"
          value={abbreviation}
          onChange={(value) =>
            onAbbreviationChange(
              value
                .toUpperCase()
                .slice(0, 5),
            )
          }
          placeholder="REM"
          minLength={2}
          maxLength={5}
        />
      </div>

      <label className="mt-4 flex items-center justify-between gap-4">
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

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required = true,
  minLength,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-300">
        {label}
      </span>

      <input
        required={required}
        type="text"
        value={value}
        minLength={minLength}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-lime-400"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  min: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-300">
        {label}
      </span>

      <input
        required
        type="number"
        inputMode="numeric"
        min={min}
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-lime-400"
      />
    </label>
  );
}

function getCreateMatchErrorMessage(
  message: string,
) {
  const normalized =
    message.toLowerCase();

  if (
    normalized.includes(
      "já está cadastrada",
    ) ||
    normalized.includes(
      "ja esta cadastrada",
    )
  ) {
    return "Esta partida já está cadastrada.";
  }

  if (
    normalized.includes(
      "permissão",
    ) ||
    normalized.includes(
      "permissao",
    )
  ) {
    return "Você não possui permissão para cadastrar partidas.";
  }

  if (
    normalized.includes("sigla")
  ) {
    return "As siglas devem possuir entre 2 e 5 caracteres.";
  }

  return (
    message ||
    "Não foi possível cadastrar a partida."
  );
}