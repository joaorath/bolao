import Link from "next/link";

import { signup } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { SocialNetworkPreferences } from "@/components/social-network-preferences";
import { BrandLogo } from "@/components/brand-logo";

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function SignupPage({
  searchParams,
}: SignupPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: teams,
    error: teamsError,
  } = await supabase
    .from("teams")
    .select(
      "id, name, abbreviation",
    )
    .eq("active", true)
    .order("display_order", {
      ascending: true,
    });

  if (teamsError) {
    console.error(
      "Erro ao carregar times:",
      teamsError,
    );
  }

  const maximumBirthDate =
    new Date()
      .toISOString()
      .slice(0, 10);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center py-8">
      <section className="w-full rounded-3xl border border-slate-800 bg-[#0e2131] p-6 shadow-2xl sm:p-8">
        <div className="text-center">
          <BrandLogo />

          <h1 className="mt-5 text-3xl font-extrabold">
            Crie sua conta
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
            Entre para a comunidade, escolha
            seu time do coração e participe
            dos bolões.
          </p>
        </div>

        {params.error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300"
          >
            {params.error}
          </div>
        )}

        {teamsError && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200"
          >
            Não foi possível carregar os
            times neste momento. Atualize a
            página e tente novamente.
          </div>
        )}

        <form
          action={signup}
          className="mt-7 space-y-7"
        >
          <fieldset>
            <legend className="text-lg font-extrabold">
              Seus dados
            </legend>

            <p className="mt-1 text-sm text-slate-400">
              Essas informações ajudam a
              personalizar sua experiência.
            </p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
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
                  placeholder="Seu nome e sobrenome"
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
                    title="Use de 3 a 24 letras minúsculas, números ou _"
                    placeholder="torcedor_4827"
                    className="w-full bg-transparent px-2 py-3 outline-none"
                  />
                </div>

                <span className="mt-2 block text-xs text-slate-500">
                  Apenas letras minúsculas,
                  números e _.
                </span>
              </label>

              <label className="block">
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
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-lime-400"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-bold text-slate-300">
                  Time do coração no Parazão
                </span>

                <select
                  name="favoriteTeamId"
                  required
                  defaultValue=""
                  disabled={
                    Boolean(teamsError) ||
                    !teams?.length
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-lime-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" disabled>
                    Selecione seu time
                  </option>

                  {(teams ?? []).map(
                    (team) => (
                      <option
                        key={team.id}
                        value={team.id}
                      >
                        {team.name} (
                        {team.abbreviation})
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>
          </fieldset>

          <div className="border-t border-slate-800" />

          <SocialNetworkPreferences />

          <div className="border-t border-slate-800" />

          <fieldset>
            <legend className="text-lg font-extrabold">
              Acesso à conta
            </legend>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-300">
                  E-mail
                </span>

                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="voce@email.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-lime-400"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-300">
                  Confirmar e-mail
                </span>

                <input
                  name="emailConfirmation"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Digite novamente"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-lime-400"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-300">
                  Senha
                </span>

                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  placeholder="Mínimo de 8 caracteres"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-lime-400"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-300">
                  Confirmar senha
                </span>

                <input
                  name="passwordConfirmation"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  placeholder="Digite novamente"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-lime-400"
                />
              </label>
            </div>
          </fieldset>

          <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-4 text-xs leading-5 text-slate-400">
            Após criar a conta, você poderá
            receber um e-mail de confirmação.
            Seus dados serão utilizados para
            identificação e participação nos
            bolões.
          </div>

          <button
            type="submit"
            disabled={
              Boolean(teamsError) ||
              !teams?.length
            }
            className="w-full rounded-xl bg-lime-400 px-5 py-3 font-extrabold text-slate-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            Criar minha conta
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Já possui uma conta?{" "}
          <Link
            href="/login"
            className="font-bold text-lime-400 hover:text-lime-300"
          >
            Entrar
          </Link>
        </p>
      </section>
    </div>
  );
}