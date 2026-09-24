import Link from "next/link";
import { redirect } from "next/navigation";

import { logout } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(
      "id, full_name, created_at, updated_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  const metadataName =
    typeof user.user_metadata.full_name ===
    "string"
      ? user.user_metadata.full_name
      : null;

  const fullName =
    profile?.full_name ??
    metadataName ??
    "Participante";

  return (
    <div className="mx-auto max-w-3xl">
      <span className="text-xs font-extrabold tracking-[0.2em] text-lime-400">
        SUA CONTA
      </span>

      <h1 className="mt-3 text-4xl font-extrabold">
        Olá, {fullName}
      </h1>

      <p className="mt-2 text-slate-400">
        Sua conta está conectada ao Supabase.
      </p>

      {profileError && (
        <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">
          Não foi possível carregar seu perfil.
        </div>
      )}

      <section className="mt-8 rounded-2xl border border-slate-800 bg-[#0e2131] p-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Nome
          </span>

          <strong className="mt-1 block">
            {fullName}
          </strong>
        </div>

        <div className="mt-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            E-mail
          </span>

          <strong className="mt-1 block">
            {user.email}
          </strong>
        </div>

        <div className="mt-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Identificador
          </span>

          <code className="mt-1 block break-all text-sm text-slate-400">
            {user.id}
          </code>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/boloes"
            className="rounded-xl bg-lime-400 px-5 py-3 text-center font-extrabold text-slate-950"
          >
            Ver meus bolões
          </Link>

          <form action={logout}>
            <button
              type="submit"
              className="w-full rounded-xl border border-red-400/30 px-5 py-3 font-bold text-red-400 transition hover:bg-red-400/10"
            >
              Sair da conta
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}