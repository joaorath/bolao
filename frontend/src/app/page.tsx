import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const features = [
  {
    icon: "👥",
    title: "Bolões entre amigos",
    description:
      "Crie disputas privadas e compartilhe o código de convite.",
  },
  {
    icon: "⚽",
    title: "Palpites por partida",
    description:
      "Cada participante registra seus próprios placares.",
  },
  {
    icon: "🏆",
    title: "Ranking automático",
    description:
      "A classificação muda conforme os resultados dos jogos.",
  },
  {
    icon: "📱",
    title: "Pronto para evoluir",
    description:
      "Arquitetura responsiva preparada para web e aplicativo.",
  },
];

export default async function LandingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/boloes");
  }

  return (
    <div className="min-h-screen bg-[#071421] text-white">
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-400 text-sm font-black text-slate-950">
              CL
            </span>

            <div>
              <strong className="block font-extrabold">
                Charqueons
              </strong>

              <span className="text-[10px] font-bold tracking-[0.25em] text-lime-400">
                LEAGUE
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-slate-800"
            >
              Entrar
            </Link>

            <Link
              href="/cadastro"
              className="rounded-xl bg-lime-400 px-4 py-2.5 text-sm font-extrabold text-slate-950 transition hover:bg-lime-300"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute left-1/2 top-16 h-96 w-96 -translate-x-1/2 rounded-full bg-lime-400/10 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl gap-14 px-5 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
            <div>
              <span className="inline-flex rounded-full border border-lime-400/30 bg-lime-400/10 px-4 py-2 text-xs font-extrabold tracking-wider text-lime-400">
                O BOLÃO DO FUTEBOL PARAENSE
              </span>

              <h1 className="mt-7 text-5xl font-black leading-tight sm:text-6xl">
                Palpite, dispute e{" "}
                <span className="text-lime-400">
                  viva cada jogo.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">
                Crie bolões, convide seus amigos,
                registre placares e acompanhe o
                ranking em uma experiência feita
                para quem gosta de futebol.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/cadastro"
                  className="rounded-xl bg-lime-400 px-7 py-4 text-center font-extrabold text-slate-950 transition hover:bg-lime-300"
                >
                  Criar meu bolão
                </Link>

                <Link
                  href="/login"
                  className="rounded-xl border border-slate-700 px-7 py-4 text-center font-bold transition hover:border-lime-400"
                >
                  Já tenho uma conta
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-700 bg-[#0e2131] p-6 shadow-2xl shadow-lime-400/5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold tracking-wider text-lime-400">
                    CHARQUEONS DA RESENHA
                  </span>

                  <h2 className="mt-2 text-2xl font-extrabold">
                    Ranking ao vivo
                  </h2>
                </div>

                <span className="rounded-full bg-red-400/10 px-3 py-1 text-xs font-bold text-red-400">
                  ● AO VIVO
                </span>
              </div>

              <div className="mt-7 space-y-3">
                <RankingPreview
                  position="1º"
                  initials="MC"
                  name="Manuel Calado"
                  points="13 pts"
                  highlighted
                />

                <RankingPreview
                  position="2º"
                  initials="JR"
                  name="João Rath"
                  points="11 pts"
                />

                <RankingPreview
                  position="3º"
                  initials="AS"
                  name="Ana Souza"
                  points="8 pts"
                />
              </div>

              <div className="mt-6 rounded-2xl bg-slate-950/50 p-5">
                <p className="text-xs font-bold text-slate-500">
                  PRÓXIMO JOGO
                </p>

                <div className="mt-4 flex items-center justify-center gap-5">
                  <strong>REM</strong>

                  <span className="rounded-xl bg-slate-800 px-5 py-3 font-extrabold">
                    ×
                  </span>

                  <strong>PSC</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-800 bg-[#091a28]">
          <div className="mx-auto max-w-7xl px-5 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-extrabold tracking-[0.2em] text-lime-400">
                FUNCIONALIDADES
              </span>

              <h2 className="mt-4 text-3xl font-black sm:text-4xl">
                Tudo para transformar cada rodada
                em uma disputa
              </h2>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-slate-800 bg-[#0e2131] p-6"
                >
                  <span className="text-3xl">
                    {feature.icon}
                  </span>

                  <h3 className="mt-5 font-extrabold">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="text-xs font-extrabold tracking-[0.2em] text-lime-400">
                COMO FUNCIONA
              </span>

              <h2 className="mt-4 text-3xl font-black sm:text-4xl">
                Do cadastro ao campeão em quatro
                passos
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Step
                number="01"
                title="Crie sua conta"
              />

              <Step
                number="02"
                title="Crie ou entre em um bolão"
              />

              <Step
                number="03"
                title="Faça seus palpites"
              />

              <Step
                number="04"
                title="Acompanhe o ranking"
              />
            </div>
          </div>
        </section>

        <section className="border-t border-slate-800">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 py-8 text-sm text-slate-500 sm:flex-row">
            <span>
              Charqueons League · MVP 2026
            </span>

            <span>
              Next.js · Supabase · Express ·
              TypeScript
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}

function RankingPreview({
  position,
  initials,
  name,
  points,
  highlighted = false,
}: {
  position: string;
  initials: string;
  name: string;
  points: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[40px_44px_1fr_auto] items-center gap-3 rounded-xl p-3 ${
        highlighted
          ? "bg-lime-400/10"
          : "bg-slate-950/30"
      }`}
    >
      <strong className="text-lime-400">
        {position}
      </strong>

      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-900 text-xs font-bold">
        {initials}
      </span>

      <strong className="text-sm">
        {name}
      </strong>

      <strong>{points}</strong>
    </div>
  );
}

function Step({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0e2131] p-5">
      <span className="text-sm font-black text-lime-400">
        {number}
      </span>

      <strong className="mt-3 block">
        {title}
      </strong>
    </div>
  );
}