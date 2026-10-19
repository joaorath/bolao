import {
  timingSafeEqual,
} from "node:crypto";

import { NextResponse } from "next/server";

import {
  synchronizeApiFutebolRound,
} from "@/lib/api-futebol/synchronizer";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

export const maxDuration = 25;

type AutomaticMatch = {
  round: number;
  status: string;
  starts_at: string;
  last_synced_at: string | null;
};

function isAuthorized(
  request: Request,
) {
  const expectedSecret =
    process.env.FOOTBALL_SYNC_SECRET;

  const authorization =
    request.headers.get(
      "authorization",
    );

  const providedSecret =
    authorization?.startsWith(
      "Bearer ",
    )
      ? authorization.slice(7)
      : "";

  if (
    !expectedSecret ||
    !providedSecret
  ) {
    return false;
  }

  const expectedBuffer =
    Buffer.from(expectedSecret);

  const providedBuffer =
    Buffer.from(providedSecret);

  if (
    expectedBuffer.length !==
    providedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    expectedBuffer,
    providedBuffer,
  );
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
    throw new Error(
      "Campeonato da API inválido.",
    );
  }

  return championshipId;
}

function getInitialRound() {
  const round = Number(
    process.env
      .API_FUTEBOL_INITIAL_ROUND ??
      "33",
  );

  if (
    !Number.isInteger(round) ||
    round < 1 ||
    round > 100
  ) {
    throw new Error(
      "Rodada inicial inválida.",
    );
  }

  return round;
}

function chooseRound(
  matches: AutomaticMatch[],
) {
  const liveMatch =
    matches.find(
      (match) =>
        match.status === "LIVE" ||
        match.status === "HALFTIME",
    );

  if (liveMatch) {
    return liveMatch.round;
  }

  const now = Date.now();

  const scheduledMatches =
    matches
      .filter(
        (match) =>
          match.status === "OPEN" ||
          match.status === "SCHEDULED",
      )
      .filter(
        (match) =>
          new Date(
            match.starts_at,
          ).getTime() >
          now - 6 * 60 * 60 * 1000,
      )
      .sort(
        (first, second) =>
          new Date(
            first.starts_at,
          ).getTime() -
          new Date(
            second.starts_at,
          ).getTime(),
      );

  if (scheduledMatches[0]) {
    return scheduledMatches[0].round;
  }

  const existingRounds =
    matches.map(
      (match) => match.round,
    );

  if (existingRounds.length > 0) {
    return Math.min(
      Math.max(...existingRounds) + 1,
      100,
    );
  }

  return getInitialRound();
}

function getIntervalMinutes(
  matches: AutomaticMatch[],
  targetRound: number,
) {
  const roundMatches =
    matches.filter(
      (match) =>
        match.round === targetRound,
    );

  const hasLiveMatch =
    roundMatches.some(
      (match) =>
        match.status === "LIVE" ||
        match.status === "HALFTIME",
    );

  if (hasLiveMatch) {
    return 5;
  }

  const now = Date.now();

  const nearMatch =
    roundMatches.some((match) => {
      const difference =
        new Date(
          match.starts_at,
        ).getTime() - now;

      return (
        difference >=
          -4 * 60 * 60 * 1000 &&
        difference <=
          3 * 60 * 60 * 1000
      );
    });

  return nearMatch ? 10 : 60;
}

export async function POST(
  request: Request,
) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        error: "Não autorizado.",
      },
      {
        status: 401,
      },
    );
  }

  const supabase =
    createAdminClient();

  const championshipId =
    getChampionshipId();

  const {
    data: matchesData,
    error: matchesError,
  } = await supabase
    .from("matches")
    .select(`
      round,
      status,
      starts_at,
      last_synced_at
    `)
    .eq("provider", "api-futebol")
    .eq(
      "automatic_sync_enabled",
      true,
    );

  if (matchesError) {
    console.error(
      "Erro ao consultar partidas automáticas:",
      matchesError,
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível consultar as partidas automáticas.",
      },
      {
        status: 500,
      },
    );
  }

  const matches =
    (matchesData ??
      []) as AutomaticMatch[];

  const targetRound =
    chooseRound(matches);

  const intervalMinutes =
    getIntervalMinutes(
      matches,
      targetRound,
    );

  const {
    data: state,
    error: stateError,
  } = await supabase
    .from("football_sync_state")
    .select(`
      last_round,
      last_attempt_at
    `)
    .eq(
      "provider",
      "api-futebol",
    )
    .eq(
      "championship_id",
      championshipId,
    )
    .maybeSingle();

  if (stateError) {
    console.error(
      "Erro ao consultar estado:",
      stateError,
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível consultar o estado da sincronização.",
      },
      {
        status: 500,
      },
    );
  }

  const lastAttempt =
    state?.last_attempt_at
      ? new Date(
          state.last_attempt_at,
        ).getTime()
      : 0;

  const elapsedMinutes =
    (Date.now() - lastAttempt) /
    60000;

  const sameRound =
    state?.last_round ===
    targetRound;

  /*
  * A Netlify pode iniciar a função alguns
  * segundos antes ou depois do minuto exato.
  * A tolerância impede que uma execução de
  * cinco minutos seja adiada por mais cinco.
  */
  const synchronizationToleranceMinutes =
    1;

  const minimumElapsedMinutes =
    Math.max(
      0,
      intervalMinutes -
        synchronizationToleranceMinutes,
    );

  if (
    sameRound &&
    elapsedMinutes <
      minimumElapsedMinutes
  ) {
    return NextResponse.json({
      synchronized: false,
      reason:
        "A sincronização ainda não é necessária.",
      round: targetRound,
      nextAttemptInMinutes:
        Math.ceil(
          minimumElapsedMinutes -
            elapsedMinutes,
        ),
    });
  }

  const attemptTime =
    new Date().toISOString();

  const {
    error: attemptError,
  } = await supabase
    .from("football_sync_state")
    .upsert(
      {
        provider:
          "api-futebol",
        championship_id:
          championshipId,
        last_round:
          targetRound,
        last_attempt_at:
          attemptTime,
        last_error:
          null,
      },
      {
        onConflict:
          "provider,championship_id",
      },
    );

  if (attemptError) {
    console.error(
      "Erro ao registrar tentativa:",
      attemptError,
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível registrar a sincronização.",
      },
      {
        status: 500,
      },
    );
  }

  try {
    const result =
      await synchronizeApiFutebolRound(
        supabase,
        championshipId,
        targetRound,
      );

    const synchronization =
      result.synchronization;

    const skippedCount =
      Math.max(
        0,
        synchronization
          .processed_count -
          synchronization
            .inserted_count -
          synchronization
            .updated_count,
      );

    const successTime =
      new Date().toISOString();

    await supabase
      .from("football_sync_state")
      .upsert(
        {
          provider:
            "api-futebol",
          championship_id:
            championshipId,
          last_round:
            result.round,
          last_attempt_at:
            successTime,
          last_success_at:
            successTime,
          last_error:
            null,
          processed_count:
            synchronization
              .processed_count,
          inserted_count:
            synchronization
              .inserted_count,
          updated_count:
            synchronization
              .updated_count,
          skipped_count:
            skippedCount,
          synchronized_pool_count:
            synchronization
              .synchronized_pool_count,
        },
        {
          onConflict:
            "provider,championship_id",
        },
      );

    return NextResponse.json({
      synchronized: true,
      championshipId,
      round: result.round,
      roundName:
        result.roundName,
      matchCount:
        result.matchCount,
      skippedCount,
      synchronization,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Erro desconhecido.";

    console.error(
      "Erro na sincronização automática:",
      error,
    );

    await supabase
      .from("football_sync_state")
      .upsert(
        {
          provider:
            "api-futebol",
          championship_id:
            championshipId,
          last_round:
            targetRound,
          last_attempt_at:
            new Date().toISOString(),
          last_error:
            errorMessage.slice(
              0,
              1000,
            ),
        },
        {
          onConflict:
            "provider,championship_id",
        },
      );

    return NextResponse.json(
      {
        synchronized: false,
        round: targetRound,
        error:
          "A sincronização automática falhou.",
      },
      {
        status: 502,
      },
    );
  }
}