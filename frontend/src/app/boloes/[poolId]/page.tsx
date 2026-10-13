"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import {
  useEffect,
  useState,
} from "react";

import { PoolCardActions } from "@/components/pool-card-actions";
import { PoolRanking } from "@/components/pool-ranking";
import { PoolResultsManager } from "@/components/pool-results-manager";
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
    label: "Rodada atual",
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
  owner_id: string | null;
  name: string;
  description: string | null;
  competition: string;
  visibility: string;
  invite_code: string;
  is_global: boolean;
  pool_members:
    | Array<{
        count: number;
      }>
    | null;
  pool_matches:
    | DatabasePoolMatch[]
    | null;
};

type DatabaseRankingEntry = {
  user_id: string;
  ranking_position: number | string;
  points: number | string;
  is_current_user: boolean;
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

      const { data, error } = await supabase
        .from("pools")
        .select(`
          id,
          owner_id,
          name,
          description,
          competition,
          visibility,
          invite_code,
          is_global,
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

      const {
        data: rankingData,
        error: rankingError,
      } = await supabase.rpc(
        "get_pool_ranking_summary",
        {
          target_pool_id:
            databasePool.id,
          ranking_limit: 100,
        },
      );

      if (rankingError) {
        console.error(
          "Erro ao carregar resumo do ranking:",
          rankingError,
        );
      }

      const ranking =
        (rankingData ??
          []) as DatabaseRankingEntry[];

      const currentUserEntry =
        ranking.find(
          (entry) =>
            entry.is_current_user,
        );

      const leaderEntry =
        ranking.find(
          (entry) =>
            Number(
              entry.ranking_position,
            ) === 1,
        );

      setPool({
        id: databasePool.id,
        name: databasePool.name,
        description:
          databasePool.description ?? "",
        competition:
          databasePool.competition,
        participantCount,

        position: currentUserEntry
          ? Number(
              currentUserEntry
                .ranking_position,
            )
          : 0,

        points: currentUserEntry
          ? Number(
              currentUserEntry.points,
            )
          : 0,

        leaderPoints: leaderEntry
          ? Number(leaderEntry.points)
          : 0,

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
          !databasePool.is_global &&
          databasePool.owner_id === user.id,

        isGlobal:
          databasePool.is_global,
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

      loadedMatches.sort(
        (firstMatch, secondMatch) =>
          new Date(
            firstMatch.startsAt,
          ).getTime() -
          new Date(
            secondMatch.startsAt,
          ).getTime(),
      );

      setMatches(loadedMatches);
      setLoading(false);
    }

    loadPool();
  }, [params.poolId]);

  async function copyInviteCode() {
    if (
      !pool?.inviteCode ||
      pool.isGlobal
    ) {
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
  homeScore: number | undefined,
  awayScore: number | undefined,
  status: MatchStatus,
) {
  setMatches((currentMatches) =>
    currentMatches.map((match) =>
      match.id === matchId
        ? {
            ...match,
            status,
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
        <span className="text-4xl">
          ⚽
        </span>

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

      <header
        className={`mt-6 rounded-3xl border p-6 md:p-8 ${
          pool.isGlobal
            ? "border-lime-400/30 bg-gradient-to-br from-lime-400/10 to-[#0e2131]"
            : "border-slate-800 bg-[#0e2131]"
        }`}
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-extrabold tracking-[0.2em] text-lime-400">
                {pool.competition.toUpperCase()}
              </span>

              {pool.isGlobal && (
                <span className="rounded-full border border-lime-400/30 bg-lime-400/10 px-3 py-1 text-[10px] font-extrabold text-lime-400">
                  BOLÃO OFICIAL
                </span>
              )}
            </div>

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

          {pool.isGlobal ? (
            <span className="w-fit rounded-xl border border-lime-400/30 px-4 py-3 text-sm font-bold text-lime-400">
              Participação automática
            </span>
          ) : (
            <PoolCardActions
              poolId={pool.id}
              poolName={pool.name}
              isOwner={Boolean(
                pool.isOwner,
              )}
            />
          )}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Sua posição"
            value={
              pool.position > 0
                ? `${pool.position}º`
                : "-"
            }
          />

          <SummaryCard
            label="Seus pontos"
            value={String(pool.points)}
          />

          <SummaryCard
            label="Pontos do líder"
            value={String(
              pool.leaderPoints,
            )}
          />
        </div>
      </header>

      <nav className="mt-6 flex gap-2 overflow-x-auto border-b border-slate-800 pb-3">
        {tabs.map((tab) => {
          const label =
            pool.isGlobal &&
            tab.id === "ranking"
              ? "Ranking Geral"
              : tab.label;

          return (
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
              {label}
            </button>
          );
        })}
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
          <PredictionList
            poolId={pool.id}
          />
        )}

        {activeTab === "ranking" && (
          <PoolRanking
            poolId={pool.id}
          />
        )}

        {activeTab === "rounds" && (
          <>
            <PoolResultsManager
              matches={matches}
              onResultSaved={
                handleResultSaved
              }
            />

            <RoundsTab
              matches={matches}
            />
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
      (match) =>
        match.status === "LIVE",
    ) ??
    matches.find(
      (match) =>
        match.status !== "FINISHED",
    ) ??
    matches[0];

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <section className="rounded-2xl border border-slate-800 bg-[#0e2131] p-5 sm:p-6 lg:col-span-2">
        {featuredMatch ? (
          <>
            <span className="text-xs font-extrabold tracking-[0.2em] text-lime-400">
              {featuredMatch.status === "LIVE"
                ? "AO VIVO"
                : featuredMatch.status ===
                    "FINISHED"
                  ? "ENCERRADO"
                  : `RODADA ${featuredMatch.round}`}
            </span>

            <h2 className="mt-3 text-xl font-extrabold">
              {featuredMatch.status === "LIVE"
                ? "Partida em andamento"
                : featuredMatch.status ===
                    "FINISHED"
                  ? "Último resultado"
                  : "Próxima partida"}
            </h2>

            <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
              <Team
                abbreviation={
                  featuredMatch.homeTeam
                    .abbreviation
                }
                name={
                  featuredMatch.homeTeam.name
                }
              />

              <div className="rounded-2xl bg-slate-950 px-4 py-4 text-2xl font-extrabold sm:px-6 sm:text-3xl">
                {featuredMatch.homeScore ??
                  "-"}
                {" × "}
                {featuredMatch.awayScore ??
                  "-"}
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

        {pool.isGlobal ? (
          <section className="rounded-2xl border border-lime-400/20 bg-lime-400/5 p-6">
            <span className="text-xs font-bold uppercase tracking-wider text-lime-400">
              Disputa oficial
            </span>

            <strong className="mt-2 block">
              Ranking Geral
            </strong>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Todas as contas participam
              automaticamente desta disputa.
            </p>
          </section>
        ) : (
          pool.inviteCode && (
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
          )
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
      matches.map(
        (match) => match.round,
      ),
    ),
  ).sort(
    (firstRound, secondRound) =>
      firstRound - secondRound,
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
                      {match.homeTeam.name}
                      {" × "}
                      {match.awayTeam.name}
                    </strong>

                    <p className="mt-1 text-sm text-slate-500">
                      {match.stadium}
                    </p>

                    {match.status ===
                      "FINISHED" &&
                      match.homeScore !==
                        undefined &&
                      match.awayScore !==
                        undefined && (
                        <strong className="mt-2 block text-lime-400">
                          {match.homeScore}
                          {" × "}
                          {match.awayScore}
                        </strong>
                      )}
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                      match.status ===
                      "FINISHED"
                        ? "bg-slate-500/10 text-slate-400"
                        : match.status ===
                            "LIVE"
                          ? "bg-red-400/10 text-red-400"
                          : "bg-emerald-400/10 text-emerald-400"
                    }`}
                  >
                    {match.status ===
                    "FINISHED"
                      ? "ENCERRADO"
                      : match.status ===
                          "LIVE"
                        ? "AO VIVO"
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

      <strong className="mt-2 block text-xl sm:text-2xl">
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
    <div className="min-w-0 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-sm font-extrabold sm:h-14 sm:w-14">
        {abbreviation}
      </div>

      <strong className="mt-2 block truncate text-xs sm:text-base">
        {name}
      </strong>
    </div>
  );
}