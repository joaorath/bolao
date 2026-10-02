import "server-only";

import type {
  ApiFutebolMatch,
  ApiFutebolRound,
} from "@/lib/api-futebol/types";

function getConfiguration() {
  const apiKey =
    process.env.API_FUTEBOL_KEY;

  const baseUrl =
    process.env.API_FUTEBOL_BASE_URL ??
    "https://api.api-futebol.com.br/v1";

  if (!apiKey) {
    throw new Error(
      "API_FUTEBOL_KEY não foi configurada.",
    );
  }

  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/$/, ""),
  };
}

async function apiFutebolRequest<T>(
  path: string,
): Promise<T> {
  const {
    apiKey,
    baseUrl,
  } = getConfiguration();

  const response = await fetch(
    `${baseUrl}${path}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const responseBody =
      await response.text();

    console.error(
      "Erro retornado pela API Futebol:",
      response.status,
      responseBody.slice(0, 500),
    );

    throw new Error(
      `API Futebol respondeu com status ${response.status}.`,
    );
  }

  return (await response.json()) as T;
}

export function getApiFutebolRound(
  championshipId: number,
  round: number,
) {
  return apiFutebolRequest<ApiFutebolRound>(
    `/campeonatos/${championshipId}/rodadas/${round}`,
  );
}

export function getApiFutebolMatch(
  matchId: number,
) {
  return apiFutebolRequest<ApiFutebolMatch>(
    `/partidas/${matchId}`,
  );
}