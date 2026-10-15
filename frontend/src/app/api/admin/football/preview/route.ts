import { NextResponse } from "next/server";

import {
  getApiFutebolRound,
} from "@/lib/api-futebol/client";

import {
  normalizeApiFutebolMatch,
} from "@/lib/api-futebol/normalizer";

import {
  createClient,
} from "@/lib/supabase/server";

import type {
  Json,
} from "@/types/database.types";

export const dynamic =
  "force-dynamic";

function parseRound(
  value: unknown,
) {
  const round = Number(
    value ?? "33",
  );

  if (
    !Number.isInteger(round) ||
    round < 1 ||
    round > 100
  ) {
    return null;
  }

  return round;
}

function getChampionshipId() {
  const championshipId = Number(
    process.env
      .API_FUTEBOL_COMPETITION_ID ??
      "14",
  );

  if (
    !Number.isInteger(
      championshipId,
    ) ||
    championshipId < 1
  ) {
    return null;
  }

  return championshipId;
}

async function authorizeAdministrator() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      response: NextResponse.json(
        {
          error:
            "É necessário estar autenticado.",
        },
        {
          status: 401,
        },
      ),
    };
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile?.is_admin
  ) {
    return {
      response: NextResponse.json(
        {
          error:
            "Acesso permitido apenas para administradores.",
        },
        {
          status: 403,
        },
      ),
    };
  }

  return {
    supabase,
  };
}

async function loadNormalizedRound(
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

  return {
    apiRound,
    matches,
  };
}

export async function GET(
  request: Request,
) {
  const authorization =
    await authorizeAdministrator();

  if (
    "response" in authorization
  ) {
    return authorization.response;
  }

  const requestUrl =
    new URL(request.url);

  const round = parseRound(
    requestUrl.searchParams.get(
      "round",
    ),
  );

  if (round === null) {
    return NextResponse.json(
      {
        error:
          "Rodada inválida.",
      },
      {
        status: 400,
      },
    );
  }

  const championshipId =
    getChampionshipId();

  if (
    championshipId === null
  ) {
    return NextResponse.json(
      {
        error:
          "O campeonato não foi configurado corretamente.",
      },
      {
        status: 500,
      },
    );
  }

  try {
    const {
      apiRound,
      matches,
    } =
      await loadNormalizedRound(
        championshipId,
        round,
      );

    return NextResponse.json({
      provider: "api-futebol",
      championshipId,
      round: apiRound.rodada,
      roundName: apiRound.nome,
      status: apiRound.status,
      matchCount: matches.length,
      matches,
    });
  } catch (error) {
    console.error(
      "Erro na pré-visualização da API:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível consultar as partidas.",
      },
      {
        status: 502,
      },
    );
  }
}

export async function POST(
  request: Request,
) {
  const authorization =
    await authorizeAdministrator();

  if (
    "response" in authorization
  ) {
    return authorization.response;
  }

  const { supabase } =
    authorization;

  let requestBody: {
    round?: unknown;
  };

  try {
    requestBody =
      (await request.json()) as {
        round?: unknown;
      };
  } catch {
    return NextResponse.json(
      {
        error:
          "O corpo da requisição é inválido.",
      },
      {
        status: 400,
      },
    );
  }

  const round = parseRound(
    requestBody.round,
  );

  if (round === null) {
    return NextResponse.json(
      {
        error:
          "Rodada inválida.",
      },
      {
        status: 400,
      },
    );
  }

  const championshipId =
    getChampionshipId();

  if (
    championshipId === null
  ) {
    return NextResponse.json(
      {
        error:
          "O campeonato não foi configurado corretamente.",
      },
      {
        status: 500,
      },
    );
  }

  try {
    const {
      apiRound,
      matches,
    } =
      await loadNormalizedRound(
        championshipId,
        round,
      );

    if (
      matches.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "A API não retornou partidas para essa rodada.",
        },
        {
          status: 422,
        },
      );
    }

    const matchesPayload =
      matches.map((match) => ({
        id: match.id,
        provider:
          "api-futebol",
        provider_match_id:
          match.id.replace(
            "api-futebol:",
            "",
          ),
        competition:
          match.competition,
        round: match.round,
        stadium:
          match.stadium,
        starts_at:
          match.startsAt,
        status:
          match.status,
        home_score:
          match.homeScore ??
          null,
        away_score:
          match.awayScore ??
          null,
        elapsed_minutes:
          match.elapsedMinutes ??
          null,
        home_team_name:
          match.homeTeam.name,
        home_team_abbreviation:
          match.homeTeam
            .abbreviation,
        home_team_color:
          match.homeTeam
            .primaryColor,
        home_team_logo_url:
          match.homeTeam
            .logoUrl ??
          null,
        away_team_name:
          match.awayTeam.name,
        away_team_abbreviation:
          match.awayTeam
            .abbreviation,
        away_team_color:
          match.awayTeam
            .primaryColor,
        away_team_logo_url:
          match.awayTeam
            .logoUrl ??
          null,
      }));

    const {
      data,
      error,
    } = await supabase.rpc(
      "sync_api_football_matches",
      {
        matches_payload:
          matchesPayload as Json,
      },
    );

    if (error) {
      console.error(
        "Erro ao sincronizar partidas:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível salvar as partidas no banco.",
        },
        {
          status: 500,
        },
      );
    }

    const synchronization =
      data?.[0] ?? {
        processed_count: 0,
        inserted_count: 0,
        updated_count: 0,
        synchronized_pool_count:
          0,
      };

    return NextResponse.json({
      provider:
        "api-futebol",
      championshipId,
      competition:
        matches[0]?.competition ??
        "Campeonato não informado",
      round:
        apiRound.rodada,
      roundName:
        apiRound.nome,
      matchCount:
        matches.length,
      synchronization,
    });
  } catch (error) {
    console.error(
      "Erro ao consultar e sincronizar a API:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível sincronizar a rodada.",
      },
      {
        status: 502,
      },
    );
  }
}