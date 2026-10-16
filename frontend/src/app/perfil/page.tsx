import type { Metadata } from "next";

import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/auth/actions";

import { updateProfile } from "@/app/perfil/actions";
import { createClient } from "@/lib/supabase/server";
import { SocialNetworkPreferences } from "@/components/social-network-preferences";

export const metadata: Metadata = {
  title: "Perfil",
};

type ProfilePageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

export default async function ProfilePage({
  searchParams,
}: ProfilePageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    profileResult,
    teamsResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(`
        full_name,
        username,
        birth_date,
        favorite_team_id,
        social_following_status,
        followed_social_networks,
        social_following_answered,
        created_at
      `)
      .eq("id", user.id)
      .maybeSingle(),

    supabase
      .from("teams")
      .select(
        "id, name, abbreviation",
      )
      .eq("active", true)
      .order("display_order", {
        ascending: true,
      }),
  ]);

  if (
    profileResult.error ||
    !profileResult.data
  ) {
    console.error(
      "Erro ao carregar perfil:",
      profileResult.error,
    );

    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-red-400/30 bg-red-400/10 p-8 text-center">
        <h1 className="text-2xl font-extrabold text-red-300">
          Não foi possível carregar seu perfil
        </h1>

        <p className="mt-3 text-slate-300">
          Atualize a página ou tente novamente
          em alguns instantes.
        </p>
      </div>
    );
  }

  const profile = profileResult.data;
  const teams = teamsResult.data ?? [];

  const favoriteTeam = teams.find(
    (team) =>
      team.id ===
      profile.favorite_team_id,
  );

  const initials = profile.full_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0])
    .join("")
    .toUpperCase();

  const memberSince =
    new Intl.DateTimeFormat(
      "pt-BR",
      {
        month: "long",
        year: "numeric",
        timeZone: "America/Belem",
      },
    ).format(
      new Date(profile.created_at),
    );

  const formattedBirthDate =
    profile.birth_date
      ? new Intl.DateTimeFormat(
          "pt-BR",
          {
            timeZone: "UTC",
          },
        ).format(
          new Date(
            `${profile.birth_date}T00:00:00.000Z`,
          ),
        )
      : "Não informada";

  const socialNetworkLabels: Record<
    string,
    string
  > = {
    INSTAGRAM: "Instagram",
    YOUTUBE: "YouTube",
    TIKTOK: "TikTok",
    FACEBOOK: "Facebook",
  };

  const followedSocialNetworks =
    profile.followed_social_networks ?? [];

  const socialNetworksSummary =
    !profile.social_following_answered
      ? "Preferiu não responder"
      : followedSocialNetworks.length > 0
        ? followedSocialNetworks
            .map(
              (network: string) =>
                socialNetworkLabels[network] ??
                network,
            )
            .join(", ")
        : "Ainda não segue";

  const maximumBirthDate =
    new Date()
      .toISOString()
      .slice(0, 10);

  return (
    <div className="mx-auto max-w-5xl">
      {params.success && (
        <div
          role="status"
          className="mb-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-emerald-300"
        >
          {params.success}
        </div>
      )}

      {params.error && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-300"
        >
          {params.error}
        </div>
      )}

      <section className="flex flex-col gap-5 rounded-2xl border border-slate-800 bg-[#0e2131] p-6 sm:flex-row sm:items-center">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-sky-900 text-xl font-extrabold">
          {initials || "CL"}
        </span>

        <div>
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-lime-400">
            {favoriteTeam?.name ??
              "Torcedor do Parazão"}
          </span>

          <h1 className="mt-2 text-3xl font-extrabold">
            {profile.full_name}
          </h1>

          <p className="mt-1 text-slate-400">
            {profile.username
              ? `@${profile.username}`
              : "Username não informado"}
            {" · "}
            Membro desde {memberSince}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:ml-auto sm:w-auto sm:flex-row">
          <Link
            href="#editar-perfil"
            className="rounded-xl border border-slate-700 px-5 py-3 text-center text-sm font-bold transition hover:border-lime-400 hover:text-lime-400"
          >
            Editar perfil
          </Link>

          <form action={logout}>
            <button
              type="submit"
              className="w-full rounded-xl border border-red-400/30 px-5 py-3 text-sm font-bold text-red-400 transition hover:bg-red-400/10"
            >
              Sair da conta
            </button>
          </form>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InformationCard
          label="E-mail"
          value={
            user.email ??
            "Não informado"
          }
          detail={
            user.email_confirmed_at
              ? "E-mail confirmado"
              : "Confirmação pendente"
          }
        />

        <InformationCard
          label="Time do coração"
          value={
            favoriteTeam?.name ??
            "Não informado"
          }
          detail={
            favoriteTeam?.abbreviation ??
            "Parazão"
          }
        />

        <InformationCard
          label="Nascimento"
          value={formattedBirthDate}
          detail="Dado privado"
        />

        <InformationCard
          label="Redes sociais"
          value={socialNetworksSummary}
          detail="Varanda Esportes"
        />
      </section>

      <section
        id="editar-perfil"
        className="mt-6 scroll-mt-6 rounded-2xl border border-slate-800 bg-[#0e2131] p-6"
      >
        <div>
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-lime-400">
            CONFIGURAÇÕES
          </span>

          <h2 className="mt-2 text-2xl font-extrabold">
            Editar perfil
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Atualize seus dados públicos e
            preferências.
          </p>
        </div>

        {teamsResult.error && (
          <div className="mt-5 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">
            Não foi possível carregar os
            times. Atualize a página.
          </div>
        )}

        <form
          action={updateProfile}
          className="mt-6 grid gap-5 sm:grid-cols-2"
        >
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-bold text-slate-300">
              Nome completo
            </span>

            <input
              name="fullName"
              type="text"
              autoComplete="name"
              required
              minLength={3}
              maxLength={120}
              defaultValue={
                profile.full_name
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-lime-400"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-300">
              Nome de usuário
            </span>

            <div className="flex rounded-xl border border-slate-700 bg-slate-950 transition focus-within:border-lime-400">
              <span className="flex items-center pl-4 text-slate-500">
                @
              </span>

              <input
                name="username"
                type="text"
                autoComplete="username"
                required
                minLength={3}
                maxLength={24}
                pattern="[a-z0-9_]{3,24}"
                defaultValue={
                  profile.username ?? ""
                }
                className="w-full bg-transparent px-2 py-3 outline-none"
              />
            </div>
          </label>

          <label className="block min-w-0">
            <span className="mb-2 block text-sm font-bold text-slate-300">
              Data de nascimento
            </span>

            <input
              name="birthDate"
              type="date"
              autoComplete="bday"
              required
              min="1900-01-01"
              max={maximumBirthDate}
              defaultValue={
                profile.birth_date ?? ""
              }
              className="block w-full min-w-0 max-w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-lime-400"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-300">
              Time do coração
            </span>

            <select
              name="favoriteTeamId"
              required
              defaultValue={
                profile.favorite_team_id ??
                ""
              }
              disabled={
                Boolean(
                  teamsResult.error,
                ) || teams.length === 0
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-lime-400 disabled:opacity-50"
            >
              <option value="" disabled>
                Selecione seu time
              </option>

              {teams.map((team) => (
                <option
                  key={team.id}
                  value={team.id}
                >
                  {team.name} (
                  {team.abbreviation})
                </option>
              ))}
            </select>
          </label>

          <div className="sm:col-span-2">
            <SocialNetworkPreferences
              initialNetworks={
                followedSocialNetworks
              }
              initialAnswered={
                profile.social_following_answered
              }
            />
          </div>

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-bold text-slate-300">
              E-mail
            </span>

            <input
              type="email"
              value={user.email ?? ""}
              readOnly
              className="w-full cursor-not-allowed rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-500"
            />

            <span className="mt-2 block text-xs text-slate-500">
              A alteração de e-mail será
              disponibilizada separadamente
              por segurança.
            </span>
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={
                Boolean(
                  teamsResult.error,
                ) || teams.length === 0
              }
              className="w-full rounded-xl bg-lime-400 px-5 py-3 font-extrabold text-slate-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 sm:w-auto"
            >
              Salvar alterações
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function InformationCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-[#0e2131] p-5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>

      <strong className="mt-2 block break-words text-lg">
        {value}
      </strong>

      <p className="mt-1 text-xs text-slate-400">
        {detail}
      </p>
    </article>
  );
}