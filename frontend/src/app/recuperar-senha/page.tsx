import Link from "next/link";

import {
  requestPasswordReset,
} from "@/app/auth/password-actions";

import {
  BrandLogo,
} from "@/components/brand-logo";

import {
  PersistentAuthForm,
} from "@/components/persistent-auth-form";

export default function RecoverPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center">
      <section className="w-full rounded-3xl border border-slate-800 bg-[#0e2131] p-7 shadow-2xl">
        <div className="text-center">
          <BrandLogo />

          <h1 className="mt-5 text-3xl font-extrabold">
            Recuperar senha
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Informe o e-mail utilizado no cadastro.
            Enviaremos um link seguro para você
            definir uma nova senha.
          </p>
        </div>

        <PersistentAuthForm
          action={
            requestPasswordReset
          }
          className="mt-7 space-y-5"
        >
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

          <button
            type="submit"
            className="w-full rounded-xl bg-lime-400 px-5 py-3 font-extrabold text-slate-950 transition hover:bg-lime-300"
          >
            Enviar link de recuperação
          </button>
        </PersistentAuthForm>

        <p className="mt-6 text-center text-sm text-slate-400">
          Lembrou sua senha?{" "}
          <Link
            href="/login"
            className="font-bold text-lime-400 hover:text-lime-300"
          >
            Voltar para o login
          </Link>
        </p>
      </section>
    </div>
  );
}