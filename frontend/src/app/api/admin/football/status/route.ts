import { NextResponse } from "next/server";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  createClient,
} from "@/lib/supabase/server";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

const AUTOMATIC_REQUEST_LIMIT = 85;
const MANUAL_REQUEST_LIMIT = 15;
const TOTAL_REQUEST_LIMIT = 100;

export async function GET() {
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

  try {
    const adminSupabase =
      createAdminClient();

    const {
      data: state,
      error: stateError,
    } = await adminSupabase
      .from("football_sync_state")
      .select(`
        provider,
        championship_id,
        last_round,
        last_attempt_at,
        last_success_at,
        last_error,
        processed_count,
        inserted_count,
        updated_count,
        skipped_count,
        synchronized_pool_count,
        automatic_request_date,
        automatic_request_count,
        manual_request_date,
        manual_request_count
      `)
      .eq(
        "provider",
        "api-futebol",
      )
      .maybeSingle();

    if (stateError) {
      console.error(
        "Erro ao consultar monitor da API:",
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

    return NextResponse.json({
      state,
      automaticRequestLimit:
        AUTOMATIC_REQUEST_LIMIT,
      manualRequestLimit:
        MANUAL_REQUEST_LIMIT,
      totalRequestLimit:
        TOTAL_REQUEST_LIMIT,
    });
  } catch (error) {
    console.error(
      "Erro ao carregar monitor da API:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível carregar o monitor da API.",
      },
      {
        status: 500,
      },
    );
  }
}