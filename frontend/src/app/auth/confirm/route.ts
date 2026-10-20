import type {
  EmailOtpType,
} from "@supabase/supabase-js";

import {
  NextResponse,
  type NextRequest,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

const RECOVERY_COOKIE =
  "charqueons_password_recovery";

function getSafeNext(
  value: string | null,
  fallback: string,
) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return fallback;
  }

  return value;
}

export async function GET(
  request: NextRequest,
) {
  const tokenHash =
    request.nextUrl.searchParams.get(
      "token_hash",
    );

  const code =
    request.nextUrl.searchParams.get(
      "code",
    );

  const type =
    request.nextUrl.searchParams.get(
      "type",
    ) as EmailOtpType | null;

  const recoveryRequested =
    request.nextUrl.searchParams.get(
      "recovery",
    ) === "1" ||
    type === "recovery";

  const fallbackPath =
    recoveryRequested
      ? "/redefinir-senha"
      : "/perfil";

  const nextPath =
    getSafeNext(
      request.nextUrl.searchParams.get(
        "next",
      ),
      fallbackPath,
    );

  const supabase =
    await createClient();

  let verificationSucceeded =
    false;

  if (tokenHash && type) {
    const { error } =
      await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });

    verificationSucceeded =
      !error;

    if (error) {
      console.error(
        "Erro ao verificar token de autenticação:",
        error,
      );
    }
  } else if (code) {
    const { error } =
      await supabase.auth
        .exchangeCodeForSession(
          code,
        );

    verificationSucceeded =
      !error;

    if (error) {
      console.error(
        "Erro ao trocar código por sessão:",
        error,
      );
    }
  }

  if (verificationSucceeded) {
    const response =
      NextResponse.redirect(
        new URL(
          nextPath,
          request.url,
        ),
      );

    if (recoveryRequested) {
      response.cookies.set(
        RECOVERY_COOKIE,
        "1",
        {
          httpOnly: true,
          sameSite: "lax",
          secure:
            process.env
              .NODE_ENV ===
            "production",
          path: "/",
          maxAge: 15 * 60,
        },
      );
    }

    return response;
  }

  const loginUrl =
    new URL(
      "/login",
      request.url,
    );

  loginUrl.searchParams.set(
    "error",
    recoveryRequested
      ? "O link de recuperação é inválido ou expirou. Solicite um novo link."
      : "O link de confirmação é inválido ou expirou.",
  );

  return NextResponse.redirect(
    loginUrl,
  );
}