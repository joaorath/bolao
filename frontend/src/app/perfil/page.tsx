import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Perfil",
};

const statistics = [
  {
    label: "Placares exatos",
    value: 5,
    detail: "19% dos palpites",
    icon: "🎯",
  },
  {
    label: "Resultados corretos",
    value: 12,
    detail: "46% dos palpites",
    icon: "✅",
  },
  {
    label: "Resultados errados",
    value: 9,
    detail: "35% dos palpites",
    icon: "✕",
  },
  {
    label: "Sequência atual",
    value: 5,
    detail: "Recorde: 7 jogos",
    icon: "🔥",
  },
];

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-5xl">
      <section className="flex flex-col gap-5 rounded-2xl border border-slate-800 bg-[#0e2131] p-6 sm:flex-row sm:items-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-900 text-xl font-extrabold">
          JR
        </span>

        <div>
          <span className="text-xs font-extrabold tracking-[0.2em] text-lime-400">
            CONTA DEMONSTRAÇÃO
          </span>

          <h1 className="mt-2 text-3xl font-extrabold">
            João Rath
          </h1>

          <p className="mt-1 text-slate-400">
            Membro desde a Rodada 1
          </p>
        </div>

        <button className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold sm:ml-auto">
          Editar perfil
        </button>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statistics.map((statistic) => (
          <article
            key={statistic.label}
            className="rounded-2xl border border-slate-800 bg-[#0e2131] p-5"
          >
            <span className="text-2xl">
              {statistic.icon}
            </span>

            <span className="mt-4 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {statistic.label}
            </span>

            <strong className="mt-1 block text-3xl">
              {statistic.value}
            </strong>

            <p className="mt-1 text-sm text-slate-400">
              {statistic.detail}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-800 bg-[#0e2131] p-6">
        <span className="text-xs font-bold text-slate-500">
          PRECISÃO DE RESULTADO
        </span>

        <strong className="mt-2 block text-5xl">
          65%
        </strong>

        <p className="mt-2 text-slate-400">
          Você pontuou em 17 de 26 partidas.
        </p>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-700">
          <div className="h-full w-[65%] rounded-full bg-lime-400" />
        </div>
      </section>
    </div>
  );
}