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
  if (
    process.env.NODE_ENV ===
    "production"
  ) {
    return "https://charqueons-league.netlify.app";
  }

  return (
    process.env
      .NEXT_PUBLIC_SITE_URL ??
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

function getPasswordUpdateErrorMessage(
  error: {
    message: string;
    code?: string;
    status?: number;
  },
) {
  const normalizedMessage =
    error.message.toLowerCase();

  if (
    error.code === "same_password" ||
    normalizedMessage.includes(
      "same password",
    ) ||
    normalizedMessage.includes(
      "different from the old password",
    )
  ) {
    return "A nova senha precisa ser diferente da senha atual.";
  }

  if (
    error.code === "weak_password" ||
    normalizedMessage.includes(
      "password should be at least",
    ) ||
    normalizedMessage.includes(
      "password is too weak",
    )
  ) {
    return "A nova senha não atende aos requisitos de segurança. Use pelo menos 8 caracteres.";
  }

  if (
    error.status === 429 ||
    error.code ===
      "over_request_rate_limit"
  ) {
    return "Muitas tentativas foram realizadas. Aguarde alguns minutos e tente novamente.";
  }

  if (
    error.status === 401 ||
    error.code ===
      "session_not_found" ||
    error.code ===
      "refresh_token_not_found" ||
    error.code === "bad_jwt"
  ) {
    return "Sua sessão de recuperação expirou. Solicite um novo link.";
  }

  return "Não foi possível atualizar sua senha. Tente novamente.";
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

  const cookieStore =
    await cookies();

    cookieStore.delete(
    RECOVERY_COOKIE,
    );

  const supabase =
    await createClient();

  const redirectUrl =
    new URL(
        "/auth/recovery",
        getApplicationUrl(),
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

  const recoveryUserId =
    cookieStore.get(
      RECOVERY_COOKIE,
    )?.value;

  if (!recoveryUserId) {
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
    cookieStore.delete(
      RECOVERY_COOKIE,
    );

    return errorResult(
      "Sua sessão de recuperação expirou. Solicite um novo link.",
    );
  }

  /*
   * Impede que uma sessão que já estava aberta
   * altere a senha de uma conta diferente.
   */
  if (
    user.id !==
    recoveryUserId
  ) {
    cookieStore.delete(
      RECOVERY_COOKIE,
    );

    console.error(
      "Sessão incompatível com a recuperação:",
      {
        authenticatedUserId:
          user.id,
        recoveryUserId,
      },
    );

    return errorResult(
      "A conta autenticada não corresponde ao link de recuperação. Solicite um novo link.",
    );
  }

  const {
    data: updateData,
    error,
  } = await supabase.auth.updateUser({
    password,
  });

  if (
    error ||
    !updateData.user
  ) {
    if (error) {
      console.error(
        "Erro ao atualizar senha:",
        {
          message: error.message,
          status: error.status,
          code: error.code,
        },
      );
    }

    return errorResult(
      error
        ? getPasswordUpdateErrorMessage(
            error,
          )
        : "Não foi possível confirmar a alteração da senha. Tente novamente.",
    );
  }

  cookieStore.delete(
    RECOVERY_COOKIE,
  );

  const { error: signOutError } =
    await supabase.auth.signOut();

  if (signOutError) {
    console.error(
      "A senha foi alterada, mas houve erro ao encerrar a sessão:",
      signOutError,
    );
  }

  redirect(
    `/login?message=${encodeURIComponent(
      "Senha alterada com sucesso. Entre usando sua nova senha.",
    )}`,
  );
}