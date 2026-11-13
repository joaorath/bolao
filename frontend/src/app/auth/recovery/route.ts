import {
  createServerClient,
} from "@supabase/ssr";

import {
  NextResponse,
  type NextRequest,
} from "next/server";

const RECOVERY_COOKIE =
  "charqueons_password_recovery";

export async function GET(
  request: NextRequest,
) {
  const tokenHash =
    request.nextUrl.searchParams.get(
      "token_hash",
    );

  if (!tokenHash) {
    const loginUrl =
      new URL(
        "/login",
        request.url,
      );

    loginUrl.searchParams.set(
      "error",
      "O link de recuperação está incompleto. Solicite um novo link.",
    );

    return NextResponse.redirect(
      loginUrl,
    );
  }

  const resetPasswordUrl =
    new URL(
      "/redefinir-senha",
      request.url,
    );

  const successResponse =
    NextResponse.redirect(
      resetPasswordUrl,
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
                /*
                 * Atualiza a requisição para que
                 * o cliente atual enxergue a nova
                 * sessão imediatamente.
                 */
                request.cookies.set(
                  name,
                  value,
                );

                /*
                 * Envia os cookies da sessão na
                 * resposta de redirecionamento.
                 */
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

  const {
    data,
    error,
  } = await supabase.auth.verifyOtp({
    type: "recovery",
    token_hash: tokenHash,
  });

  if (
    error ||
    !data.user
  ) {
    console.error(
      "Erro ao validar recuperação de senha:",
      {
        message:
          error?.message ??
          "Usuário não retornado.",
        status:
          error?.status,
        code:
          error?.code,
      },
    );

    const loginUrl =
      new URL(
        "/login",
        request.url,
      );

    loginUrl.searchParams.set(
      "error",
      "O link de recuperação é inválido, já foi utilizado ou expirou. Solicite um novo link.",
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

  /*
   * O cookie guarda o ID da conta realmente
   * validada pelo token de recuperação.
   */
  successResponse.cookies.set(
    RECOVERY_COOKIE,
    data.user.id,
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

  return successResponse;
}