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
    icon: "🔴",
    title: "Resultados ao vivo",
    description:
      "Placares e pontuações atualizados durante os jogos, sem precisar sair do app.",
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
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-800 bg-[#071421]/95 shadow-lg shadow-slate-950/20 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-5">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-400 text-sm font-black text-slate-950 sm:h-11 sm:w-11">
              CL
            </span>

            <div className="min-w-0">
              <strong className="block truncate text-sm font-extrabold sm:text-base">
                Charqueons
              </strong>

              <span className="hidden text-[10px] font-bold tracking-[0.25em] text-lime-400 min-[370px]:block">
                LEAGUE
              </span>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <Link
              href="/login"
              className="rounded-xl px-3 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-slate-800 sm:px-4 sm:text-sm"
            >
              Entrar
            </Link>

            <Link
              href="/cadastro"
              className="rounded-xl bg-lime-400 px-3 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg shadow-lime-400/10 transition hover:bg-lime-300 sm:px-5 sm:text-sm"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-20">
        <section className="relative overflow-hidden">
          <div className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-lime-400/10 blur-3xl sm:h-96 sm:w-96" />

          <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-28">
            <div className="text-center lg:text-left">
              <span className="inline-flex rounded-full border border-lime-400/30 bg-lime-400/10 px-4 py-2 text-[10px] font-extrabold tracking-wider text-lime-400 sm:text-xs">
                O BOLÃO DO FUTEBOL PARAENSE
              </span>

              <h1 className="mt-7 text-4xl font-black leading-[1.08] sm:text-5xl lg:text-6xl">
                Palpite, dispute e{" "}
                <span className="text-lime-400">
                  viva cada jogo.
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8 lg:mx-0">
                Crie bolões, convide seus amigos,
                registre placares e acompanhe o
                ranking em uma experiência feita
                para quem gosta de futebol.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Link
                  href="/cadastro"
                  className="rounded-xl bg-lime-400 px-7 py-4 text-center font-extrabold text-slate-950 transition hover:bg-lime-300"
                >
                  Criar meu bolão
                </Link>

                <Link
                  href="/login"
                  className="rounded-xl border border-slate-700 px-7 py-4 text-center font-bold transition hover:border-lime-400 hover:bg-slate-900/50"
                >
                  Já tenho uma conta
                </Link>
              </div>
            </div>

            <div className="mx-auto w-full max-w-xl rounded-3xl border border-slate-700 bg-[#0e2131] p-4 shadow-2xl shadow-lime-400/5 sm:p-6 lg:max-w-none">
              <div className="flex flex-col gap-3 min-[390px]:flex-row min-[390px]:items-center min-[390px]:justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-lime-400 sm:text-xs">
                    CHARQUEONS DA RESENHA
                  </span>

                  <h2 className="mt-2 text-xl font-extrabold sm:text-2xl">
                    Ranking ao vivo
                  </h2>
                </div>

                <span className="w-fit rounded-full bg-red-400/10 px-3 py-1 text-xs font-bold text-red-400">
                  ● AO VIVO
                </span>
              </div>

              <div className="mt-7 space-y-3">
                <RankingPreview
                  position="1º"
                  initials="RA"
                  name="Rafael Almeida"
                  points="13 pts"
                  highlighted
                />

                <RankingPreview
                  position="2º"
                  initials="BC"
                  name="Beatriz Costa"
                  points="11 pts"
                />

                <RankingPreview
                  position="3º"
                  initials="LM"
                  name="Lucas Monteiro"
                  points="8 pts"
                />
              </div>

              <div className="mt-6 rounded-2xl bg-slate-950/50 p-5">
                <p className="text-xs font-bold text-slate-500">
                  PRÓXIMO JOGO
                </p>

                <div className="mt-4 flex items-center justify-center gap-4 sm:gap-5">
                  <TeamPreview
                    abbreviation="REM"
                    name="Remo"
                  />

                  <div className="text-center">
                    <span className="block text-[10px] font-bold text-slate-500">
                      EM BREVE
                    </span>

                    <span className="mt-1 block rounded-xl bg-slate-800 px-5 py-3 font-extrabold">
                      ×
                    </span>
                  </div>

                  <TeamPreview
                    abbreviation="PSC"
                    name="Paysandu"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-800 bg-[#091a28]">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:py-20">
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
                  className="rounded-2xl border border-slate-800 bg-[#0e2131] p-6 transition hover:-translate-y-1 hover:border-lime-400/40"
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

        <section className="mx-auto max-w-7xl px-5 py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="text-center lg:text-left">
              <span className="text-xs font-extrabold tracking-[0.2em] text-lime-400">
                COMO FUNCIONA
              </span>

              <h2 className="mt-4 text-3xl font-black sm:text-4xl">
                Do cadastro ao campeão em quatro
                passos
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-slate-400 lg:mx-0">
                Comece em poucos minutos e acompanhe
                toda a disputa pelo computador ou
                celular.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Step
                number="01"
                title="Crie sua conta"
                description="Faça seu cadastro e acesse seus bolões."
              />

              <Step
                number="02"
                title="Crie ou entre em um bolão"
                description="Convide amigos ou utilize um código."
              />

              <Step
                number="03"
                title="Faça seus palpites"
                description="Registre os placares antes dos jogos."
              />

              <Step
                number="04"
                title="Acompanhe o ranking"
                description="Veja a pontuação mudar após os resultados."
              />
            </div>
          </div>
        </section>

        <section className="border-t border-slate-800 bg-[#091a28]">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-8 text-center text-sm text-slate-500 sm:flex-row sm:text-left">
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
      className={`grid grid-cols-[34px_40px_minmax(0,1fr)_auto] items-center gap-2 rounded-xl p-3 sm:grid-cols-[40px_44px_minmax(0,1fr)_auto] sm:gap-3 ${
        highlighted
          ? "border border-lime-400/20 bg-lime-400/10"
          : "border border-transparent bg-slate-950/30"
      }`}
    >
      <strong className="text-sm text-lime-400 sm:text-base">
        {position}
      </strong>

      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-900 text-[10px] font-bold sm:h-10 sm:w-10 sm:text-xs">
        {initials}
      </span>

      <strong className="truncate text-xs sm:text-sm">
        {name}
      </strong>

      <strong className="whitespace-nowrap text-xs sm:text-base">
        {points}
      </strong>
    </div>
  );
}

function TeamPreview({
  abbreviation,
  name,
}: {
  abbreviation: string;
  name: string;
}) {
  return (
    <div className="min-w-16 text-center">
      <strong className="block">
        {abbreviation}
      </strong>

      <span className="mt-1 block text-[10px] text-slate-500 sm:text-xs">
        {name}
      </span>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0e2131] p-5">
      <span className="text-sm font-black text-lime-400">
        {number}
      </span>

      <strong className="mt-3 block">
        {title}
      </strong>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        {description}
      </p>
    </div>
  );
}