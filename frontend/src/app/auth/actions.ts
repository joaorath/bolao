"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function getText(
  formData: FormData,
  field: string,
) {
  const value = formData.get(field);

  return typeof value === "string"
    ? value.trim()
    : "";
}

function redirectWithError(
  path: string,
  message: string,
): never {
  redirect(
    `${path}?error=${encodeURIComponent(
      message,
    )}`,
  );
}

function isValidBirthDate(value: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const parsedDate = new Date(
    `${value}T00:00:00.000Z`,
  );

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate
      .toISOString()
      .slice(0, 10) !== value
  ) {
    return false;
  }

  const today = new Date()
    .toISOString()
    .slice(0, 10);

  return (
    value >= "1900-01-01" &&
    value <= today
  );
}

export async function login(
  formData: FormData,
) {
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
    redirectWithError(
      "/login",
      "Preencha o e-mail e a senha.",
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

    redirectWithError(
      "/login",
      error.status === 400
        ? "E-mail ou senha incorretos."
        : "Não foi possível entrar. Tente novamente.",
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

  const birthDate = getText(
    formData,
    "birthDate",
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
    redirectWithError(
      "/cadastro",
      "Foi selecionada uma rede social inválida.",
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
    redirectWithError(
      "/cadastro",
      "Preencha todos os campos obrigatórios.",
    );
  }

  if (
    fullName.length < 3 ||
    fullName.length > 120 ||
    fullName.split(" ").length < 2
  ) {
    redirectWithError(
      "/cadastro",
      "Informe seu nome completo.",
    );
  }

  if (
    !/^[a-z0-9_]{3,24}$/.test(
      username,
    )
  ) {
    redirectWithError(
      "/cadastro",
      "O usuário deve ter entre 3 e 24 caracteres e usar apenas letras minúsculas, números ou _.",
    );
  }

  if (!isValidBirthDate(birthDate)) {
    redirectWithError(
      "/cadastro",
      "Informe uma data de nascimento válida.",
    );
  }

  if (email !== emailConfirmation) {
    redirectWithError(
      "/cadastro",
      "Os endereços de e-mail não são iguais.",
    );
  }

  if (password.length < 8) {
    redirectWithError(
      "/cadastro",
      "A senha precisa ter pelo menos 8 caracteres.",
    );
  }

  if (password !== passwordConfirmation) {
    redirectWithError(
      "/cadastro",
      "As senhas não são iguais.",
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

    redirectWithError(
      "/cadastro",
      "Não foi possível verificar o nome de usuário.",
    );
  }

  if (!usernameResult.data) {
    redirectWithError(
      "/cadastro",
      "Esse nome de usuário já está sendo utilizado.",
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

    redirectWithError(
      "/cadastro",
      "Selecione um time válido.",
    );
  }

  const { data, error } =
    await supabase.auth.signUp({
      email,
      password,
      options: {
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

    redirectWithError(
      "/cadastro",
      error.message
        .toLowerCase()
        .includes("already registered")
        ? "Já existe uma conta com esse e-mail."
        : "Não foi possível criar a conta. Verifique os dados e tente novamente.",
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