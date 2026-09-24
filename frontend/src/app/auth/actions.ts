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
    redirectWithError(
      "/login",
      "E-mail ou senha incorretos.",
    );
  }

  revalidatePath("/", "layout");
  redirect("/conta");
}

export async function signup(
  formData: FormData,
) {
  const name = getText(
    formData,
    "name",
  );

  const email = getText(
    formData,
    "email",
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
    !name ||
    !email ||
    !password ||
    !passwordConfirmation
  ) {
    redirectWithError(
      "/cadastro",
      "Preencha todos os campos.",
    );
  }

  if (name.length < 3) {
    redirectWithError(
      "/cadastro",
      "O nome precisa ter pelo menos 3 caracteres.",
    );
  }

  if (password.length < 6) {
    redirectWithError(
      "/cadastro",
      "A senha precisa ter pelo menos 6 caracteres.",
    );
  }

  if (password !== passwordConfirmation) {
    redirectWithError(
      "/cadastro",
      "As senhas não são iguais.",
    );
  }

  const supabase = await createClient();

  const { data, error } =
    await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

  if (error) {
    redirectWithError(
      "/cadastro",
      "Não foi possível criar a conta. Verifique os dados informados.",
    );
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/conta");
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