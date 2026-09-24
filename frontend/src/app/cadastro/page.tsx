import Link from "next/link";

import { signup } from "@/app/auth/actions";

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function SignupPage({
  searchParams,
}: SignupPageProps) {
  const params = await searchParams;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center">
      <section className="w-full rounded-3xl border border-slate-800 bg-[#0e2131] p-7 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-400 text-xl font-extrabold text-slate-950">
            CL
          </div>

          <h1 className="mt-5 text-3xl font-extrabold">
            Criar conta
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Crie seu usuário para participar dos bolões.
          </p>
        </div>

        {params.error && (
          <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">
            {params.error}
          </div>
        )}

        <form
          action={signup}
          className="mt-7 space-y-5"
        >
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-300">
              Nome
            </span>

            <input
              name="name"
              type="text"
              autoComplete="name"
              required
              minLength={3}
              placeholder="Seu nome"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-lime-400"
            />
          </label>

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
              Senha
            </span>

            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="Mínimo de 6 caracteres"
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
              minLength={6}
              placeholder="Digite novamente"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-lime-400"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-lime-400 px-5 py-3 font-extrabold text-slate-950 transition hover:bg-lime-300"
          >
            Criar conta
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Já possui uma conta?{" "}
          <Link
            href="/login"
            className="font-bold text-lime-400"
          >
            Entrar
          </Link>
        </p>
      </section>
    </div>
  );
}