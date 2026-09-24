import type { EmailOtpType } from "@supabase/supabase-js";

import {
  NextResponse,
  type NextRequest,
} from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
) {
  const tokenHash =
    request.nextUrl.searchParams.get(
      "token_hash",
    );

  const type =
    request.nextUrl.searchParams.get(
      "type",
    ) as EmailOtpType | null;

  if (tokenHash && type) {
    const supabase = await createClient();

    const { error } =
      await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });

    if (!error) {
      return NextResponse.redirect(
        new URL("/conta", request.url),
      );
    }
  }

  return NextResponse.redirect(
    new URL(
      "/login?error=O%20link%20de%20confirmação%20é%20inválido%20ou%20expirou.",
      request.url,
    ),
  );
}