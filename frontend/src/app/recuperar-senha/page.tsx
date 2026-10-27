import Link from "next/link";

import {
  BrandLogo,
} from "@/components/brand-logo";

import {
  PasswordRecoveryFlow,
} from "@/components/password-recovery-flow";

type RecoverPasswordPageProps = {
  searchParams: Promise<{
    etapa?: string;
  }>;
};

export default async function RecoverPasswordPage({
  searchParams,
}: RecoverPasswordPageProps) {
  const params =
    await searchParams;

  const initialStep =
    params.etapa === "codigo"
      ? "code"
      : "email";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center">
      <section className="w-full rounded-3xl border border-slate-800 bg-[#0e2131] p-7 shadow-2xl">
        <BrandLogo />

        <PasswordRecoveryFlow
          initialStep={
            initialStep
          }
        />

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