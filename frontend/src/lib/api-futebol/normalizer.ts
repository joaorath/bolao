import type {
  Match,
  MatchStatus,
} from "@/types";

import type {
  ApiFutebolMatch,
} from "@/lib/api-futebol/types";

const teamColors = [
  "#84cc16",
  "#0ea5e9",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
  "#ec4899",
];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
}

export function mapApiFutebolStatus(
  status: string,
): MatchStatus {
  const normalizedStatus =
    normalizeText(status);

  switch (normalizedStatus) {
    case "agendado":
    case "agendada":
      return "OPEN";

    case "andamento":
    case "em-andamento":
    case "primeiro-tempo":
    case "segundo-tempo":
    case "1-tempo":
    case "2-tempo":
      return "LIVE";

    case "intervalo":
      return "HALFTIME";

    case "finalizado":
    case "finalizada":
    case "encerrado":
    case "encerrada":
      return "FINISHED";

    case "adiado":
    case "adiada":
      return "POSTPONED";

    case "cancelado":
    case "cancelada":
      return "CANCELLED";

    default:
      return "SCHEDULED";
  }
}

function getTeamColor(teamId: number) {
  return teamColors[
    Math.abs(teamId) % teamColors.length
  ];
}

function parseElapsedMinutes(
  value: number | string | null,
) {
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : undefined;
  }

  if (!value) {
    return undefined;
  }

  const minutes = Number.parseInt(
    value.replace(/\D/g, ""),
    10,
  );

  return Number.isFinite(minutes)
    ? minutes
    : undefined;
}

function convertApiDateToIso(
  apiDate: string,
) {
  const normalizedDate = apiDate.replace(
    /([+-]\d{2})(\d{2})$/,
    "$1:$2",
  );

  const date = new Date(normalizedDate);

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      `Data inválida recebida da API: ${apiDate}`,
    );
  }

  return date.toISOString();
}

export function normalizeApiFutebolMatch(
  apiMatch: ApiFutebolMatch,
  round: number,
): Match {
  return {
    id: `api-futebol:${apiMatch.partida_id}`,
    competition:
      apiMatch.campeonato.nome,
    round,
    stadium:
      apiMatch.estadio?.nome_popular ??
      "Estádio não informado",
    startsAt: convertApiDateToIso(
      apiMatch.data_realizacao_iso,
    ),
    status: mapApiFutebolStatus(
      apiMatch.status,
    ),
    elapsedMinutes:
      parseElapsedMinutes(
        apiMatch.cronometro,
      ),
    homeScore:
      apiMatch.placar_mandante ??
      undefined,
    awayScore:
      apiMatch.placar_visitante ??
      undefined,
    homeTeam: {
      id: `api-futebol-team:${apiMatch.time_mandante.time_id}`,
      name:
        apiMatch.time_mandante
          .nome_popular,
      abbreviation:
        apiMatch.time_mandante.sigla,
      primaryColor: getTeamColor(
        apiMatch.time_mandante.time_id,
      ),
      secondaryColor: "#ffffff",
      logoUrl:
        apiMatch.time_mandante.escudo ??
        undefined,
    },
    awayTeam: {
      id: `api-futebol-team:${apiMatch.time_visitante.time_id}`,
      name:
        apiMatch.time_visitante
          .nome_popular,
      abbreviation:
        apiMatch.time_visitante.sigla,
      primaryColor: getTeamColor(
        apiMatch.time_visitante.time_id,
      ),
      secondaryColor: "#ffffff",
      logoUrl:
        apiMatch.time_visitante.escudo ??
        undefined,
    },
  };
}