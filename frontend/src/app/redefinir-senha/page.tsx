import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  updateRecoveredPassword,
} from "@/app/auth/password-actions";

import {
  BrandLogo,
} from "@/components/brand-logo";

import {
  PersistentAuthForm,
} from "@/components/persistent-auth-form";

const RECOVERY_COOKIE =
  "charqueons_password_recovery";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token_hash?: string;
    code?: string;
    type?: string;
    next?: string;
    recovery?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params =
    await searchParams;

   /*
    * Corrige automaticamente links antigos
    * que tenham enviado o token diretamente
    * para esta página.
    */
    if (params.token_hash) {
        const recoveryParams =
            new URLSearchParams({
            token_hash:
                params.token_hash,
            });

        redirect(
            `/auth/recovery?${recoveryParams.toString()}`,
        );
    }

    /*
    * Compatibilidade temporária com links
    * antigos baseados em PKCE.
    */
    if (params.code) {
        const confirmParams =
            new URLSearchParams({
                code: params.code,
                next:
                    "/redefinir-senha",
                recovery: "1",
            });

        redirect(
            `/auth/confirm?${confirmParams.toString()}`,
        );
    }

  const cookieStore =
    await cookies();

  const recoveryUserId =
    cookieStore.get(
      RECOVERY_COOKIE,
    )?.value;

  if (!recoveryUserId) {
    redirect(
      `/login?error=${encodeURIComponent(
        "Solicite um novo link de recuperação antes de definir uma nova senha.",
      )}`,
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center">
      <section className="w-full rounded-3xl border border-slate-800 bg-[#0e2131] p-7 shadow-2xl">
        <div className="text-center">
          <BrandLogo />

          <h1 className="mt-5 text-3xl font-extrabold">
            Definir nova senha
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Escolha uma senha com pelo menos
            8 caracteres.
          </p>
        </div>

        <PersistentAuthForm
          action={
            updateRecoveredPassword
          }
          sensitiveFields={[
            "password",
            "passwordConfirmation",
          ]}
          className="mt-7 space-y-5"
        >
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-300">
              Nova senha
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

          <p className="text-xs leading-5 text-slate-500">
            Use uma senha diferente da senha
            atual.
          </p>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-300">
              Confirmar nova senha
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

          <button
            type="submit"
            className="w-full rounded-xl bg-lime-400 px-5 py-3 font-extrabold text-slate-950 transition hover:bg-lime-300"
          >
            Salvar nova senha
          </button>
        </PersistentAuthForm>
      </section>
    </div>
  );
}