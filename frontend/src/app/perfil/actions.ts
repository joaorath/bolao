"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  isValidBirthDate,
  normalizeBirthDate,
} from "@/lib/birth-date";

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
  message: string,
): never {
  redirect(
    `/perfil?error=${encodeURIComponent(
      message,
    )}#editar-perfil`,
  );
}

export async function updateProfile(
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
    redirectWithError(
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

  const followsInstagram =
    followedSocialNetworks.includes(
      "INSTAGRAM",
    );

  const followsYouTube =
    followedSocialNetworks.includes(
      "YOUTUBE",
    );

  const socialFollowingStatus =
    !socialFollowingAnswered
      ? "NOT_ANSWERED"
      : followsInstagram && followsYouTube
        ? "BOTH"
        : followsInstagram
          ? "INSTAGRAM"
          : followsYouTube
            ? "YOUTUBE"
            : "NONE";

  if (
    !fullName ||
    !username ||
    !birthDate ||
    !favoriteTeamId
  ) {
    redirectWithError(
      "Preencha todos os campos obrigatórios.",
    );
  }

  if (
    fullName.length < 3 ||
    fullName.length > 120 ||
    fullName.split(" ").length < 2
  ) {
    redirectWithError(
      "Informe seu nome completo.",
    );
  }

  if (
    !/^[a-z0-9_]{3,24}$/.test(
      username,
    )
  ) {
    redirectWithError(
      "O usuário deve usar apenas letras minúsculas, números ou _.",
    );
  }

  if (!isValidBirthDate(birthDate)) {
    redirectWithError(
      "Informe uma data de nascimento válida.",
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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
      "Não foi possível verificar o nome de usuário.",
    );
  }

  if (!usernameResult.data) {
    redirectWithError(
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
      "Selecione um time válido.",
    );
  }

  const { error: updateError } =
    await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        username,
        birth_date: birthDate,
        favorite_team_id:
          favoriteTeamId,
        social_following_status:
          socialFollowingStatus,
        followed_social_networks:
          followedSocialNetworks,
        social_following_answered:
          socialFollowingAnswered,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", user.id);

  if (updateError) {
    console.error(
      "Erro ao atualizar perfil:",
      updateError,
    );

    redirectWithError(
      "Não foi possível atualizar seu perfil.",
    );
  }

  const { error: metadataError } =
    await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        username,
        birth_date: birthDate,
        favorite_team_id:
          favoriteTeamId,
        social_following_status:
          socialFollowingStatus,
        followed_social_networks:
          followedSocialNetworks,
        social_following_answered:
          socialFollowingAnswered,
      },
    });

  if (metadataError) {
    console.error(
      "Erro ao atualizar metadados:",
      metadataError,
    );
  }

  revalidatePath("/perfil");
  revalidatePath("/", "layout");

  redirect(
    `/perfil?success=${encodeURIComponent(
      "Perfil atualizado com sucesso.",
    )}`,
  );
}