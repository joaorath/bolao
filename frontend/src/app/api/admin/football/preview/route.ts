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

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
) {
  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error:
          "É necessário estar autenticado.",
      },
      {
        status: 401,
      },
    );
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
    return NextResponse.json(
      {
        error:
          "Acesso permitido apenas para administradores.",
      },
      {
        status: 403,
      },
    );
  }

  const requestUrl =
    new URL(request.url);

  const roundParameter =
    requestUrl.searchParams.get(
      "round",
    );

  const round = Number(
    roundParameter ?? "31",
  );

  if (
    !Number.isInteger(round) ||
    round < 1 ||
    round > 100
  ) {
    return NextResponse.json(
      {
        error: "Rodada inválida.",
      },
      {
        status: 400,
      },
    );
  }

  const championshipId = Number(
    process.env
      .API_FUTEBOL_COMPETITION_ID ??
      "14",
  );

  if (
    !Number.isInteger(
      championshipId,
    )
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