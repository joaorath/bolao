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

function isValidEmail(
  email: string,
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email,
  );
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
    return "Sua sessão de recuperação expirou. Solicite um novo código.";
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

  if (!isValidEmail(email)) {
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

  /*
   * O e-mail utilizará {{ .Token }}.
   * Portanto, não precisamos mais transportar
   * um token descartável dentro de um link.
   */
  const { error } =
    await supabase.auth
      .resetPasswordForEmail(
        email,
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
   * A mensagem é sempre igual para não revelar
   * quais endereços possuem uma conta.
   */
  return successResult(
    "Se existir uma conta com esse e-mail, enviaremos um código de recuperação. Verifique também a caixa de spam.",
  );
}

export async function verifyPasswordRecoveryCode(
  formData: FormData,
): Promise<AuthActionResult> {
  const email = getText(
    formData,
    "email",
  ).toLowerCase();

  const token = getText(
    formData,
    "token",
  ).replace(/\s+/g, "");

  if (!email) {
    return errorResult(
      "Informe o e-mail que recebeu o código.",
      ["email"],
    );
  }

  if (!isValidEmail(email)) {
    return errorResult(
      "Informe um endereço de e-mail válido.",
      ["email"],
    );
  }

  if (!token) {
    return errorResult(
      "Informe o código recebido por e-mail.",
      ["token"],
    );
  }

  if (!/^\d{6}$/.test(token)) {
    return errorResult(
      "O código deve possuir 6 números.",
      ["token"],
    );
  }

  const cookieStore =
    await cookies();

  cookieStore.delete(
    RECOVERY_COOKIE,
  );

  const supabase =
    await createClient();

  const {
    data,
    error,
  } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "recovery",
  });

  if (
    error ||
    !data.user
  ) {
    console.error(
      "Erro ao verificar código de recuperação:",
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

    if (
      error?.status === 429 ||
      error?.code ===
        "over_request_rate_limit"
    ) {
      return errorResult(
        "Muitas tentativas foram realizadas. Aguarde alguns minutos e tente novamente.",
        ["token"],
      );
    }

    return errorResult(
      "O código é inválido, já foi utilizado ou expirou. Solicite um novo código.",
      ["token"],
    );
  }

  cookieStore.set(
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

  redirect(
    "/redefinir-senha",
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
      "A autorização de recuperação é inválida ou expirou. Solicite um novo código.",
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
      "Sua sessão de recuperação expirou. Solicite um novo código.",
    );
  }

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
      "A conta autenticada não corresponde à recuperação solicitada. Solicite um novo código.",
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