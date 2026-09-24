"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PoolResultsManager } from "@/components/pool-results-manager";

import {
  useEffect,
  useState,
} from "react";

import { PoolCardActions } from "@/components/pool-card-actions";
import { PoolRanking } from "@/components/pool-ranking";
import { PredictionList } from "@/components/prediction-list";
import { createClient } from "@/lib/supabase/client";

import type {
  Match,
  MatchStatus,
  PoolSummary,
} from "@/types";

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

type DatabaseMatch = {
  id: string;
  competition: string;
  round: number;
  stadium: string | null;
  starts_at: string;
  home_team_name: string;
  home_team_abbreviation: string;
  home_team_color: string;
  away_team_name: string;
  away_team_abbreviation: string;
  away_team_color: string;
};

type DatabasePoolMatch = {
  status: string;
  official_home_score: number | null;
  official_away_score: number | null;
  matches:
  | DatabaseMatch
  | DatabaseMatch[]
  | null;
};

type DatabasePool = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  competition: string;
  visibility: string;
  invite_code: string;
  pool_members:
  | Array<{
    count: number;
  }>
  | null;
  pool_matches:
  | DatabasePoolMatch[]
  | null;
};

export default function PoolDetailsPage() {
  const params = useParams<{
    poolId: string;
  }>();

  const [activeTab, setActiveTab] =
    useState<TabId>("overview");

  const [pool, setPool] =
    useState<PoolSummary | null>(null);

  const [matches, setMatches] =
    useState<Match[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  const [copyMessage, setCopyMessage] =
    useState("");

  useEffect(() => {
    async function loadPool() {
      setLoading(true);
      setLoadError("");

      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoadError(
          "Sua sessão expirou. Entre novamente.",
        );

        setLoading(false);
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("pools")
        .select(`
          id,
          owner_id,
          name,
          description,
          competition,
          visibility,
          invite_code,
          pool_members(count),
          pool_matches(
            status,
            official_home_score,
            official_away_score,
            matches(
              id,
              competition,
              round,
              stadium,
              starts_at,
              home_team_name,
              home_team_abbreviation,
              home_team_color,
              away_team_name,
              away_team_abbreviation,
              away_team_color
            )
          )
        `)
        .eq("id", params.poolId)
        .maybeSingle();

      if (error || !data) {
        console.error(
          "Erro ao carregar bolão:",
          error,
        );

        setPool(null);
        setLoadError(
          "Bolão não encontrado ou você não participa dele.",
        );

        setLoading(false);
        return;
      }

      const databasePool =
        data as unknown as DatabasePool;

      const participantCount =
        databasePool.pool_members?.[0]
          ?.count ?? 0;

      setPool({
        id: databasePool.id,
        name: databasePool.name,
        description:
          databasePool.description ?? "",
        competition:
          databasePool.competition,
        participantCount,
        position: 1,
        points: 0,
        leaderPoints: 0,
        inviteCode:
          databasePool.invite_code,
        visibility:
          databasePool.visibility ===
            "PUBLIC"
            ? "PUBLIC"
            : "PRIVATE",
        matchSelectionMode:
          "ALL_COMPETITION",
        isOwner:
          databasePool.owner_id === user.id,
      });

      const loadedMatches: Match[] = [];

      for (
        const poolMatch of
        databasePool.pool_matches ?? []
      ) {
        const relatedMatch =
          Array.isArray(poolMatch.matches)
            ? poolMatch.matches[0]
            : poolMatch.matches;

        if (!relatedMatch) {
          continue;
        }

        loadedMatches.push({
          id: relatedMatch.id,
          competition:
            relatedMatch.competition,
          round: relatedMatch.round,
          stadium:
            relatedMatch.stadium ??
            "Estádio não informado",
          startsAt:
            relatedMatch.starts_at,
          status:
            poolMatch.status as MatchStatus,
          homeScore:
            poolMatch.official_home_score ??
            undefined,
          awayScore:
            poolMatch.official_away_score ??
            undefined,
          homeTeam: {
            id: `${relatedMatch.id}-home`,
            name:
              relatedMatch.home_team_name,
            abbreviation:
              relatedMatch
                .home_team_abbreviation,
            primaryColor:
              relatedMatch.home_team_color,
            secondaryColor: "#ffffff",
          },
          awayTeam: {
            id: `${relatedMatch.id}-away`,
            name:
              relatedMatch.away_team_name,
            abbreviation:
              relatedMatch
                .away_team_abbreviation,
            primaryColor:
              relatedMatch.away_team_color,
            secondaryColor: "#ffffff",
          },
        });
      }

      loadedMatches.sort((first, second) => {
        return (
          new Date(first.startsAt).getTime() -
          new Date(second.startsAt).getTime()
        );
      });

      setMatches(loadedMatches);
      setLoading(false);
    }

    loadPool();
  }, [params.poolId]);

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

  function handleResultSaved(
    matchId: string,
    homeScore: number,
    awayScore: number,
  ) {
    setMatches((currentMatches) =>
      currentMatches.map((match) =>
        match.id === matchId
          ? {
            ...match,
            status: "FINISHED",
            homeScore,
            awayScore,
          }
          : match,
      ),
    );
  }

  if (loading) {
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
          {loadError ||
            "Ele pode ter sido removido ou você pode ter saído dele."}
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
              {pool.description ||
                `${pool.participantCount} participantes disputando este bolão.`}
            </p>

            <p className="mt-3 text-sm text-slate-500">
              {pool.participantCount}{" "}
              {pool.participantCount === 1
                ? "participante"
                : "participantes"}
            </p>
          </div>

          <PoolCardActions
            poolId={pool.id}
            poolName={pool.name}
            isOwner={Boolean(pool.isOwner)}
          />
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
            className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition ${activeTab === tab.id
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
            matches={matches}
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
          <>
            {pool.isOwner && (
              <PoolResultsManager
                poolId={pool.id}
                matches={matches}
                onResultSaved={
                  handleResultSaved
                }
              />
            )}

            <RoundsTab matches={matches} />
          </>
        )}
      </main>
    </div>
  );
}

function OverviewTab({
  pool,
  matches,
  copyMessage,
  onCopyInvite,
}: {
  pool: PoolSummary;
  matches: Match[];
  copyMessage: string;
  onCopyInvite: () => void;
}) {
  const featuredMatch =
    matches.find(
      (match) => match.status === "LIVE",
    ) ?? matches[0];

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <section className="rounded-2xl border border-slate-800 bg-[#0e2131] p-6 lg:col-span-2">
        {featuredMatch ? (
          <>
            <span className="text-xs font-extrabold tracking-[0.2em] text-lime-400">
              {featuredMatch.status === "LIVE"
                ? "AO VIVO"
                : `RODADA ${featuredMatch.round}`}
            </span>

            <h2 className="mt-3 text-xl font-extrabold">
              {featuredMatch.status === "LIVE"
                ? "Partida em andamento"
                : "Próxima partida"}
            </h2>

            <div className="mt-7 flex items-center justify-center gap-5">
              <Team
                abbreviation={
                  featuredMatch.homeTeam
                    .abbreviation
                }
                name={
                  featuredMatch.homeTeam.name
                }
              />

              <div className="rounded-2xl bg-slate-950 px-6 py-4 text-3xl font-extrabold">
                {featuredMatch.homeScore ?? "-"}{" "}
                ×{" "}
                {featuredMatch.awayScore ?? "-"}
              </div>

              <Team
                abbreviation={
                  featuredMatch.awayTeam
                    .abbreviation
                }
                name={
                  featuredMatch.awayTeam.name
                }
              />
            </div>
          </>
        ) : (
          <p className="text-slate-400">
            Nenhum jogo foi adicionado a este
            bolão.
          </p>
        )}
      </section>

      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-800 bg-[#0e2131] p-6">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Jogos do bolão
          </span>

          <strong className="mt-2 block">
            {matches.length} jogos
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

function RoundsTab({
  matches,
}: {
  matches: Match[];
}) {
  const rounds = Array.from(
    new Set(
      matches.map((match) => match.round),
    ),
  );

  if (rounds.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0e2131] p-6 text-slate-400">
        Nenhum jogo disponível.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {rounds.map((round) => (
        <section key={round}>
          <h2 className="text-xl font-extrabold">
            Rodada {round}
          </h2>

          <div className="mt-4 space-y-3">
            {matches
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

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${match.status === "FINISHED"
                      ? "bg-slate-500/10 text-slate-400"
                      : "bg-emerald-400/10 text-emerald-400"
                      }`}
                  >
                    {match.status === "FINISHED"
                      ? "ENCERRADO"
                      : "PALPITES ABERTOS"}
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