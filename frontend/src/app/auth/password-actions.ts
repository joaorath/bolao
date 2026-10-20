"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type {
  AuthActionResult,
} from "@/app/auth/actions";

import {
  createClient,
} from "@/lib/supabase/server";

const RECOVERY_COOKIE =
  "charqueons_password_recovery";

function getText(
  formData: FormData,
  field: string,
) {
  const value =
    formData.get(field);

  return typeof value === "string"
    ? value.trim()
    : "";
}

function getApplicationUrl() {
  return (
    process.env
      .NEXT_PUBLIC_SITE_URL ??
    process.env.URL ??
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

function errorResult(
  message: string,
  invalidFields: string[] = [],
): AuthActionResult {
  return {
    message,
    invalidFields,
    success: false,
  };
}

function successResult(
  message: string,
): AuthActionResult {
  return {
    message,
    invalidFields: [],
    success: true,
  };
}

export async function requestPasswordReset(
  formData: FormData,
): Promise<AuthActionResult> {
  const email = getText(
    formData,
    "email",
  ).toLowerCase();

  if (!email) {
    return errorResult(
      "Informe seu e-mail.",
      ["email"],
    );
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email,
    )
  ) {
    return errorResult(
      "Informe um endereço de e-mail válido.",
      ["email"],
    );
  }

  const supabase =
    await createClient();

  const redirectUrl =
    new URL(
      "/auth/confirm",
      getApplicationUrl(),
    );

  redirectUrl.searchParams.set(
    "next",
    "/redefinir-senha",
  );

  redirectUrl.searchParams.set(
    "recovery",
    "1",
  );

  const { error } =
    await supabase.auth
      .resetPasswordForEmail(
        email,
        {
          redirectTo:
            redirectUrl.toString(),
        },
      );

  if (error) {
    console.error(
      "Erro ao solicitar recuperação de senha:",
      {
        message: error.message,
        status: error.status,
        code: error.code,
      },
    );
  }

  /*
   * A mensagem é sempre igual para impedir
   * a descoberta de quais e-mails possuem conta.
   */
  return successResult(
    "Se existir uma conta com esse e-mail, enviaremos um link para redefinir a senha. Verifique também a caixa de spam.",
  );
}

export async function updateRecoveredPassword(
  formData: FormData,
): Promise<AuthActionResult> {
  const passwordValue =
    formData.get("password");

  const confirmationValue =
    formData.get(
      "passwordConfirmation",
    );

  const password =
    typeof passwordValue === "string"
      ? passwordValue
      : "";

  const passwordConfirmation =
    typeof confirmationValue ===
    "string"
      ? confirmationValue
      : "";

  if (
    !password ||
    !passwordConfirmation
  ) {
    return errorResult(
      "Preencha e confirme a nova senha.",
      [
        ...(!password
          ? ["password"]
          : []),
        ...(!passwordConfirmation
          ? ["passwordConfirmation"]
          : []),
      ],
    );
  }

  if (password.length < 8) {
    return errorResult(
      "A nova senha precisa ter pelo menos 8 caracteres.",
      ["password"],
    );
  }

  if (
    password !==
    passwordConfirmation
  ) {
    return errorResult(
      "As senhas não são iguais.",
      [
        "password",
        "passwordConfirmation",
      ],
    );
  }

  const cookieStore =
    await cookies();

  if (
    cookieStore.get(
      RECOVERY_COOKIE,
    )?.value !== "1"
  ) {
    return errorResult(
      "O link de recuperação é inválido ou expirou. Solicite um novo link.",
    );
  }

  const supabase =
    await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (
    userError ||
    !user
  ) {
    return errorResult(
      "Sua sessão de recuperação expirou. Solicite um novo link.",
    );
  }

  const { error } =
    await supabase.auth.updateUser({
      password,
    });

  if (error) {
    console.error(
      "Erro ao atualizar senha:",
      {
        message: error.message,
        status: error.status,
        code: error.code,
      },
    );

    return errorResult(
      "Não foi possível atualizar sua senha. Solicite um novo link e tente novamente.",
    );
  }

  cookieStore.delete(
    RECOVERY_COOKIE,
  );

  await supabase.auth.signOut();

  redirect(
    `/login?message=${encodeURIComponent(
      "Senha alterada com sucesso. Entre usando sua nova senha.",
    )}`,
  );
}