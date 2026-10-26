import {
  createServerClient,
} from "@supabase/ssr";

import type {
  EmailOtpType,
} from "@supabase/supabase-js";

import {
  NextResponse,
  type NextRequest,
} from "next/server";

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

  /*
   * Uma recuperação de senha sempre deve
   * terminar na página de redefinição.
   */
  const nextPath =
    recoveryRequested
      ? "/redefinir-senha"
      : getSafeNext(
          request.nextUrl.searchParams.get(
            "next",
          ),
          "/perfil",
        );

  const destinationUrl =
    request.nextUrl.clone();

  destinationUrl.pathname =
    nextPath;

  destinationUrl.search = "";
  destinationUrl.hash = "";

  /*
   * Os cookies criados pelo Supabase são
   * colocados diretamente na resposta de
   * redirecionamento. Isso é importante no
   * Netlify e em navegadores móveis.
   */
  const successResponse =
    NextResponse.redirect(
      destinationUrl,
    );

  const supabase =
    createServerClient(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL!,
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },

          setAll(cookiesToSet) {
            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
                request.cookies.set(
                  name,
                  value,
                );

                successResponse.cookies.set(
                  name,
                  value,
                  options,
                );
              },
            );
          },
        },
      },
    );

  let verifiedUserId:
    string | null = null;

  if (tokenHash && type) {
    const {
      data,
      error,
    } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (error) {
      console.error(
        "Erro ao verificar token de autenticação:",
        {
          message: error.message,
          status: error.status,
          code: error.code,
        },
      );
    } else {
      verifiedUserId =
        data.user?.id ?? null;
    }
  } else if (code) {
    /*
     * Mantém compatibilidade com links PKCE
     * que já tenham sido enviados.
     */
    const {
      data,
      error,
    } = await supabase.auth
      .exchangeCodeForSession(
        code,
      );

    if (error) {
      console.error(
        "Erro ao trocar código por sessão:",
        {
          message: error.message,
          status: error.status,
          code: error.code,
        },
      );
    } else {
      verifiedUserId =
        data.user?.id ?? null;
    }
  }

  if (verifiedUserId) {
    if (recoveryRequested) {
      /*
       * O cookie agora identifica exatamente
       * qual usuário autorizou a recuperação.
       */
      successResponse.cookies.set(
        RECOVERY_COOKIE,
        verifiedUserId,
        {
          httpOnly: true,
          sameSite: "lax",
          secure:
            process.env.NODE_ENV ===
            "production",
          path: "/",
          maxAge: 15 * 60,
        },
      );
    }

    return successResponse;
  }

  const loginUrl =
    new URL(
      "/login",
      request.url,
    );

  loginUrl.searchParams.set(
    "error",
    recoveryRequested
      ? "O link de recuperação é inválido, já foi utilizado ou expirou. Solicite um novo link."
      : "O link de confirmação é inválido ou expirou.",
  );

  const failureResponse =
    NextResponse.redirect(
      loginUrl,
    );

  failureResponse.cookies.delete(
    RECOVERY_COOKIE,
  );

  return failureResponse;
}