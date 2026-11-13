import "server-only";

import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import {
  getApiFutebolRound,
} from "@/lib/api-futebol/client";

import {
  normalizeApiFutebolMatch,
} from "@/lib/api-futebol/normalizer";

import type {
  Database,
  Json,
} from "@/types/database.types";

export async function synchronizeApiFutebolRound(
  supabase: SupabaseClient<Database>,
  championshipId: number,
  round: number,
) {
  const apiRound =
    await getApiFutebolRound(
      championshipId,
      round,
    );

  const matches =
    apiRound.partidas.map(
      (apiMatch) =>
        normalizeApiFutebolMatch(
          apiMatch,
          apiRound.rodada,
        ),
    );

  if (matches.length === 0) {
    throw new Error(
      `A API não retornou partidas para a rodada ${round}.`,
    );
  }

  const matchesPayload =
    matches.map((match) => ({
      id: match.id,
      provider: "api-futebol",

      provider_match_id:
        match.id.replace(
          "api-futebol:",
          "",
        ),

      competition:
        match.competition,

      round:
        match.round,

      stadium:
        match.stadium,

      starts_at:
        match.startsAt,

      status:
        match.status,

      home_score:
        match.homeScore ?? null,

      away_score:
        match.awayScore ?? null,

      elapsed_minutes:
        match.elapsedMinutes ?? null,

      home_team_name:
        match.homeTeam.name,

      home_team_abbreviation:
        match.homeTeam.abbreviation,

      home_team_color:
        match.homeTeam.primaryColor,

      home_team_logo_url:
        match.homeTeam.logoUrl ?? null,

      away_team_name:
        match.awayTeam.name,

      away_team_abbreviation:
        match.awayTeam.abbreviation,

      away_team_color:
        match.awayTeam.primaryColor,

      away_team_logo_url:
        match.awayTeam.logoUrl ?? null,
    }));

  const { data, error } =
    await supabase.rpc(
      "sync_api_football_matches",
      {
        matches_payload:
          matchesPayload as Json,
      },
    );

  if (error) {
    throw new Error(error.message);
  }

  const synchronization =
    data?.[0] ?? {
      processed_count: 0,
      inserted_count: 0,
      updated_count: 0,
      synchronized_pool_count: 0,
    };

  return {
    round: apiRound.rodada,
    roundName: apiRound.nome,
    matchCount: matches.length,
    synchronization,
  };
}