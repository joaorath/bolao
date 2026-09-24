"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type CreatePoolState = {
  error: string;
  pool: {
    id: string;
    name: string;
    inviteCode: string;
  } | null;
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

export async function createPool(
  _previousState: CreatePoolState,
  formData: FormData,
): Promise<CreatePoolState> {
  const name = getText(formData, "name");

  const description = getText(
    formData,
    "description",
  );

  const competition = getText(
    formData,
    "competition",
  );

  const visibility = getText(
    formData,
    "visibility",
  );

  if (name.length < 3) {
    return {
      error:
        "O nome precisa ter pelo menos 3 caracteres.",
      pool: null,
    };
  }

  if (name.length > 80) {
    return {
      error:
        "O nome pode ter no máximo 80 caracteres.",
      pool: null,
    };
  }

  if (
    visibility !== "PRIVATE" &&
    visibility !== "PUBLIC"
  ) {
    return {
      error: "Privacidade inválida.",
      pool: null,
    };
  }

  if (
    competition !== "Campeonato Paraense"
  ) {
    return {
      error: "Campeonato inválido.",
      pool: null,
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error:
        "Sua sessão expirou. Entre novamente.",
      pool: null,
    };
  }

  const {
    data: createdPool,
    error,
  } = await supabase
    .from("pools")
    .insert({
      owner_id: user.id,
      name,
      description,
      competition,
      visibility,
    })
    .select("id, name, invite_code")
    .single();

  if (error || !createdPool) {
    console.error(
      "Erro ao criar bolão:",
      error,
    );

    return {
      error:
        "Não foi possível criar o bolão.",
      pool: null,
    };
  }

  revalidatePath("/");
  revalidatePath("/boloes");

  return {
    error: "",
    pool: {
      id: createdPool.id,
      name: createdPool.name,
      inviteCode:
        createdPool.invite_code,
    },
  };
}

export async function deletePool(
  formData: FormData,
) {
  const poolId = getText(
    formData,
    "poolId",
  );

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("pools")
    .delete()
    .eq("id", poolId)
    .eq("owner_id", user.id);

  if (error) {
    redirect(
      `/boloes?error=${encodeURIComponent(
        "Não foi possível excluir o bolão.",
      )}`,
    );
  }

  revalidatePath("/");
  revalidatePath("/boloes");

  redirect(
    `/boloes?message=${encodeURIComponent(
      "Bolão excluído com sucesso.",
    )}`,
  );
}

export async function leavePool(
  formData: FormData,
) {
  const poolId = getText(
    formData,
    "poolId",
  );

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("pool_members")
    .delete()
    .eq("pool_id", poolId)
    .eq("user_id", user.id)
    .eq("role", "MEMBER");

  if (error) {
    redirect(
      `/boloes?error=${encodeURIComponent(
        "Não foi possível sair do bolão.",
      )}`,
    );
  }

  revalidatePath("/");
  revalidatePath("/boloes");

  redirect(
    `/boloes?message=${encodeURIComponent(
      "Você saiu do bolão.",
    )}`,
  );
}
type JoinPoolState = {
  error: string;
};

export async function joinPool(
  _previousState: JoinPoolState,
  formData: FormData,
): Promise<JoinPoolState> {
  const inviteCode = getText(
    formData,
    "inviteCode",
  ).toUpperCase();

  if (!inviteCode) {
    return {
      error:
        "Digite o código do convite.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data: poolId,
    error,
  } = await supabase.rpc(
    "join_pool_by_code",
    {
      provided_code: inviteCode,
    },
  );

  if (error || !poolId) {
    console.error(
      "Erro ao entrar no bolão:",
      error,
    );

    return {
      error:
        "Nenhum bolão foi encontrado com esse código.",
    };
  }

  revalidatePath("/");
  revalidatePath("/boloes");
  revalidatePath(`/boloes/${poolId}`);

  redirect(`/boloes/${poolId}`);
}