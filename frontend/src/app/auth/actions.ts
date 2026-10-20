"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  isValidBirthDate,
  normalizeBirthDate,
} from "@/lib/birth-date";

export type AuthActionResult = {
  message: string;
  invalidFields: string[];
  success?: boolean;
};

function getText(
  formData: FormData,
  field: string,
) {
  const value = formData.get(field);

  return typeof value === "string"
    ? value.trim()
    : "";
}

function authError(
  message: string,
  invalidFields: string[] = [],
): AuthActionResult {
  return {
    message,
    invalidFields,
  };
}

export async function login(
  formData: FormData,
): Promise<AuthActionResult> {
  const email = getText(
    formData,
    "email",
  ).toLowerCase();

  const passwordValue =
    formData.get("password");

  const password =
    typeof passwordValue === "string"
      ? passwordValue
      : "";

  if (!email || !password) {
    return authError(
      "Preencha o e-mail e a senha.",
      [
        ...(!email ? ["email"] : []),
        ...(!password
          ? ["password"]
          : []),
      ],
    );
  }

  const supabase = await createClient();

  const { error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Erro no login:", {
        message: error.message,
        status: error.status,
        code: error.code,
      });

      const normalizedMessage =
        error.message.toLowerCase();

      return authError(
        normalizedMessage.includes(
          "email not confirmed",
        )
          ? "Confirme seu e-mail antes de entrar. Verifique também a caixa de spam."
          : error.status === 400
            ? "E-mail ou senha incorretos."
            : "Não foi possível entrar. Tente novamente.",
        ["email", "password"],
      );
    }

  revalidatePath("/", "layout");
  redirect("/perfil");
}

export async function signup(
  formData: FormData,
) {
  const fullName = getText(
    formData,
    "fullName",
  ).replace(/\s+/g, " ");

  const username = getText(
    formData,
    "username",
  ).toLowerCase();

  const birthDate = normalizeBirthDate(
    getText(
      formData,
      "birthDate",
    ),
  );

  const favoriteTeamId = getText(
    formData,
    "favoriteTeamId",
  );

  const allowedSocialNetworks: string[] = [
    "INSTAGRAM",
    "YOUTUBE",
    "TIKTOK",
    "FACEBOOK",
  ];

  const submittedSocialNetworks =
    formData
      .getAll(
        "followedSocialNetworks",
      )
      .filter(
        (
          value,
        ): value is string =>
          typeof value === "string",
      )
      .map((value) =>
        value.trim().toUpperCase(),
      );

  const hasInvalidSocialNetwork =
    submittedSocialNetworks.some(
      (network) =>
        !allowedSocialNetworks.includes(
          network,
        ),
    );

  if (hasInvalidSocialNetwork) {
    return authError(
      "Foi selecionada uma rede social inválida.",
      ["followedSocialNetworks"],
    );
  }

  const socialFollowingAnswered =
    getText(
      formData,
      "socialFollowingAnswered",
    ) === "true";

  const followedSocialNetworks =
    socialFollowingAnswered
      ? Array.from(
          new Set(
            submittedSocialNetworks,
          ),
        )
      : [];

  const email = getText(
    formData,
    "email",
  ).toLowerCase();

  const emailConfirmation = getText(
    formData,
    "emailConfirmation",
  ).toLowerCase();

  const passwordValue =
    formData.get("password");

  const confirmationValue =
    formData.get("passwordConfirmation");

  const password =
    typeof passwordValue === "string"
      ? passwordValue
      : "";

  const passwordConfirmation =
    typeof confirmationValue === "string"
      ? confirmationValue
      : "";

  if (
    !fullName ||
    !username ||
    !birthDate ||
    !favoriteTeamId ||
    !email ||
    !emailConfirmation ||
    !password ||
    !passwordConfirmation
  ) {
    return authError(
      "Preencha todos os campos obrigatórios.",
      [
        ...(!fullName ? ["fullName"] : []),
        ...(!username ? ["username"] : []),
        ...(!birthDate
          ? ["birthDate"]
          : []),
        ...(!favoriteTeamId
          ? ["favoriteTeamId"]
          : []),
        ...(!email ? ["email"] : []),
        ...(!emailConfirmation
          ? ["emailConfirmation"]
          : []),
        ...(!password
          ? ["password"]
          : []),
        ...(!passwordConfirmation
          ? ["passwordConfirmation"]
          : []),
      ],
    );
  }

  if (
    fullName.length < 3 ||
    fullName.length > 120 ||
    fullName.split(" ").length < 2
  ) {
    return authError(
      "Informe seu nome completo.",
      ["fullName"],
    );
  }

  if (
    !/^[a-z0-9_]{3,24}$/.test(
      username,
    )
  ) {
    return authError(
      "O usuário deve ter entre 3 e 24 caracteres e usar apenas letras minúsculas, números ou _.",
      ["username"],
    );
  }

  if (!isValidBirthDate(birthDate)) {
    return authError(
      "Informe uma data de nascimento válida.",
      ["birthDate"],
    );
  }

  if (email !== emailConfirmation) {
    return authError(
      "Os endereços de e-mail não são iguais.",
      ["email", "emailConfirmation"],
    );
  }

  if (password.length < 8) {
    return authError(
      "A senha precisa ter pelo menos 8 caracteres.",
      ["password"],
    );
  }

  if (password !== passwordConfirmation) {
    return authError(
      "As senhas não são iguais.",
      [
        "password",
        "passwordConfirmation",
      ],
    );
  }



  const supabase = await createClient();

  const [
    usernameResult,
    teamResult,
  ] = await Promise.all([
    supabase.rpc(
      "is_username_available",
      {
        username_value: username,
      },
    ),

    supabase
      .from("teams")
      .select("id")
      .eq("id", favoriteTeamId)
      .eq("active", true)
      .maybeSingle(),
  ]);

  if (usernameResult.error) {
    console.error(
      "Erro ao verificar usuário:",
      usernameResult.error,
    );

    return authError(
      "Não foi possível verificar o nome de usuário.",
      ["username"],
    );
  }

  if (!usernameResult.data) {
    return authError(
      "Esse nome de usuário já está sendo utilizado.",
      ["username"],
    );
  }

  if (
    teamResult.error ||
    !teamResult.data
  ) {
    console.error(
      "Erro ao verificar time:",
      teamResult.error,
    );

    return authError(
      "Selecione um time válido.",
      ["favoriteTeamId"],
    );
  }

  const { data, error } =
    await supabase.auth.signUp({
      email,
      password,
      options: {
         emailRedirectTo:
          `${
            (
              process.env.NEXT_PUBLIC_SITE_URL ??
              process.env.URL ??
              "http://localhost:3000"
            ).replace(/\/+$/, "")
          }/auth/confirm?next=/perfil`,
        data: {
          full_name: fullName,
          username,
          birth_date: birthDate,
          favorite_team_id:
            favoriteTeamId,
          followed_social_networks:
            followedSocialNetworks,
          social_following_answered:
            socialFollowingAnswered,
        },
      },
    });

  if (error) {
    console.error(
      "Erro ao criar conta:",
      {
        message: error.message,
        status: error.status,
        code: error.code,
      },
    );

    return authError(
      error.message
        .toLowerCase()
        .includes("already registered")
        ? "Já existe uma conta com esse e-mail."
        : "Não foi possível criar a conta. Verifique os dados e tente novamente.",
      ["email", "emailConfirmation"],
    );
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/perfil");
  }

  redirect(
    `/login?message=${encodeURIComponent(
      "Cadastro realizado. Verifique seu e-mail para confirmar a conta.",
    )}`,
  );
}

export async function logout() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}