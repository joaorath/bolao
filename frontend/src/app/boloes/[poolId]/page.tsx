"use client";

import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { useState } from "react";

import { PoolRanking } from "@/components/pool-ranking";
import { PredictionList } from "@/components/prediction-list";
import { useDemoStore } from "@/contexts/demo-store";
import {
  liveMatch,
  upcomingMatches,
} from "@/data/mock-data";

import type { PoolSummary } from "@/types";

const tabs = [
  {
    id: "overview",
    label: "Visão geral",
  },
  {
    id: "predictions",
    label: "Palpites",
  },
  {
    id: "ranking",
    label: "Ranking",
  },
  {
    id: "rounds",
    label: "Rodadas",
  },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function PoolDetailsPage() {
  const params = useParams<{
    poolId: string;
  }>();

  const router = useRouter();

  const {
    pools,
    ready,
    removePool,
  } = useDemoStore();

  const [activeTab, setActiveTab] =
    useState<TabId>("overview");

  const [copyMessage, setCopyMessage] =
    useState("");

  const pool = pools.find(
    (currentPool) =>
      currentPool.id === params.poolId,
  );

  async function copyInviteCode() {
    if (!pool?.inviteCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        pool.inviteCode,
      );

      setCopyMessage("Código copiado!");
    } catch {
      setCopyMessage(
        `Código: ${pool.inviteCode}`,
      );
    }
  }

  function handleRemovePool() {
    if (!pool) {
      return;
    }

    const action = pool.isOwner
      ? "excluir"
      : "sair";

    const confirmed = window.confirm(
      `Tem certeza de que deseja ${action} do bolão "${pool.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    removePool(pool.id);
    router.push("/boloes");
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl rounded-2xl border border-slate-800 bg-[#0e2131] p-8 text-slate-400">
        Carregando bolão...
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-[#0e2131] p-8 text-center">
        <span className="text-4xl">⚽</span>

        <h1 className="mt-4 text-2xl font-extrabold">
          Bolão não encontrado
        </h1>

        <p className="mt-2 text-slate-400">
          Ele pode ter sido removido ou você pode
          ter saído dele.
        </p>

        <Link
          href="/boloes"
          className="mt-6 inline-block rounded-xl bg-lime-400 px-5 py-3 font-extrabold text-slate-950"
        >
          Voltar para bolões
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/boloes"
        className="text-sm font-bold text-lime-400"
      >
        ← Voltar para bolões
      </Link>

      <header className="mt-6 rounded-3xl border border-slate-800 bg-[#0e2131] p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <span className="text-xs font-extrabold tracking-[0.2em] text-lime-400">
              {pool.competition.toUpperCase()}
            </span>

            <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">
              {pool.name}
            </h1>

            <p className="mt-2 max-w-2xl text-slate-400">
              {pool.description ??
                `${pool.participantCount} participantes disputando este bolão.`}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRemovePool}
            className="rounded-xl border border-red-400/30 px-4 py-3 text-sm font-bold text-red-400 transition hover:bg-red-400/10"
          >
            {pool.isOwner
              ? "Excluir bolão"
              : "Sair do bolão"}
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Sua posição"
            value={`${pool.position}º`}
          />

          <SummaryCard
            label="Seus pontos"
            value={String(pool.points)}
          />

          <SummaryCard
            label="Pontos do líder"
            value={String(pool.leaderPoints)}
          />
        </div>
      </header>

      <nav className="mt-6 flex gap-2 overflow-x-auto border-b border-slate-800 pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() =>
              setActiveTab(tab.id)
            }
            className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              activeTab === tab.id
                ? "bg-lime-400 text-slate-950"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="mt-6">
        {activeTab === "overview" && (
          <OverviewTab
            pool={pool}
            copyMessage={copyMessage}
            onCopyInvite={copyInviteCode}
          />
        )}

        {activeTab === "predictions" && (
          <PredictionList poolId={pool.id} />
        )}

        {activeTab === "ranking" && (
          <PoolRanking poolId={pool.id} />
        )}

        {activeTab === "rounds" && (
          <RoundsTab />
        )}
      </main>
    </div>
  );
}

function OverviewTab({
  pool,
  copyMessage,
  onCopyInvite,
}: {
  pool: PoolSummary;
  copyMessage: string;
  onCopyInvite: () => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <section className="rounded-2xl border border-slate-800 bg-[#0e2131] p-6 lg:col-span-2">
        <span className="text-xs font-extrabold tracking-[0.2em] text-red-400">
          AO VIVO · {liveMatch.elapsedMinutes}'
        </span>

        <h2 className="mt-3 text-xl font-extrabold">
          Partida em andamento
        </h2>

        <div className="mt-7 flex items-center justify-center gap-5">
          <Team
            abbreviation={
              liveMatch.homeTeam.abbreviation
            }
            name={liveMatch.homeTeam.name}
          />

          <div className="rounded-2xl bg-slate-950 px-6 py-4 text-3xl font-extrabold">
            {liveMatch.homeScore} ×{" "}
            {liveMatch.awayScore}
          </div>

          <Team
            abbreviation={
              liveMatch.awayTeam.abbreviation
            }
            name={liveMatch.awayTeam.name}
          />
        </div>
      </section>

      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-800 bg-[#0e2131] p-6">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Jogos do bolão
          </span>

          <strong className="mt-2 block">
            Todos os jogos
          </strong>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            As partidas da competição entram
            automaticamente neste bolão.
          </p>
        </section>

        {pool.inviteCode && (
          <section className="rounded-2xl border border-slate-800 bg-[#0e2131] p-6">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Código de convite
            </span>

            <strong className="mt-2 block text-2xl tracking-widest text-lime-400">
              {pool.inviteCode}
            </strong>

            <button
              type="button"
              onClick={onCopyInvite}
              className="mt-4 rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold transition hover:border-lime-400"
            >
              Copiar código
            </button>

            {copyMessage && (
              <p className="mt-3 text-sm text-emerald-400">
                {copyMessage}
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function RoundsTab() {
  const rounds = Array.from(
    new Set(
      upcomingMatches.map(
        (match) => match.round,
      ),
    ),
  );

  return (
    <div className="space-y-6">
      {rounds.map((round) => (
        <section key={round}>
          <h2 className="text-xl font-extrabold">
            Rodada {round}
          </h2>

          <div className="mt-4 space-y-3">
            {upcomingMatches
              .filter(
                (match) =>
                  match.round === round,
              )
              .map((match) => (
                <div
                  key={match.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-[#0e2131] p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <strong>
                      {match.homeTeam.name} ×{" "}
                      {match.awayTeam.name}
                    </strong>

                    <p className="mt-1 text-sm text-slate-500">
                      {match.stadium}
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-400">
                    PALPITES ABERTOS
                  </span>
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-950/60 p-4">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>

      <strong className="mt-2 block text-2xl">
        {value}
      </strong>
    </div>
  );
}

function Team({
  abbreviation,
  name,
}: {
  abbreviation: string;
  name: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 font-extrabold">
        {abbreviation}
      </div>

      <strong className="mt-2 block">
        {name}
      </strong>
    </div>
  );
}