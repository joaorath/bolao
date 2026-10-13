"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { LiveMatchCard } from "@/components/live-match-card";
import { createClient } from "@/lib/supabase/client";

import type {
  Match,
  MatchStatus,
  Prediction,
} from "@/types";

type DatabaseLiveMatch = {
  id: string;
  competition: string;
  round: number;
  stadium: string | null;
  starts_at: string;
  status: string;
  official_home_score: number | null;
  official_away_score: number | null;
  home_team_name: string;
  home_team_abbreviation: string;
  home_team_color: string;
  away_team_name: string;
  away_team_abbreviation: string;
  away_team_color: string;
};

type DatabasePrediction = {
  pool_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  saved_at: string;
};

type LiveMatchInformation = {
  match: Match;
  prediction: Prediction | null;
};

export default function LivePage() {
  const [liveMatches, setLiveMatches] =
    useState<LiveMatchInformation[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [loadError, setLoadError] =
    useState("");

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const loadLiveMatches =
    useCallback(async (
      showLoading = false,
    ) => {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

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
        setRefreshing(false);
        return;
      }

      const {
        data: matchesData,
        error: matchesError,
      } = await supabase
        .from("matches")
        .select(`
          id,
          competition,
          round,
          stadium,
          starts_at,
          status,
          official_home_score,
          official_away_score,
          home_team_name,
          home_team_abbreviation,
          home_team_color,
          away_team_name,
          away_team_abbreviation,
          away_team_color
        `)
        .in("status", [
          "LIVE",
          "HALFTIME",
        ])
        .order("starts_at", {
          ascending: true,
        });

      if (matchesError) {
        console.error(
          "Erro ao carregar jogos ao vivo:",
          matchesError,
        );

        setLoadError(
          "Não foi possível carregar os jogos ao vivo.",
        );

        setLoading(false);
        setRefreshing(false);
        return;
      }

      const databaseMatches =
        (matchesData ??
          []) as DatabaseLiveMatch[];

      if (databaseMatches.length === 0) {
        setLiveMatches([]);
        setLastUpdated(new Date());
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const {
        data: globalPool,
        error: globalPoolError,
      } = await supabase
        .from("pools")
        .select("id")
        .eq("is_global", true)
        .maybeSingle();

      if (globalPoolError) {
        console.error(
          "Erro ao localizar Bolão Geral:",
          globalPoolError,
        );
      }

      let predictions:
        DatabasePrediction[] = [];

      if (globalPool) {
        const matchIds =
          databaseMatches.map(
            (match) => match.id,
          );

        const {
          data: predictionsData,
          error: predictionsError,
        } = await supabase
          .from("predictions")
          .select(`
            pool_id,
            match_id,
            home_score,
            away_score,
            saved_at
          `)
          .eq("pool_id", globalPool.id)
          .eq("user_id", user.id)
          .in("match_id", matchIds);

        if (predictionsError) {
          console.error(
            "Erro ao carregar palpites:",
            predictionsError,
          );
        } else {
          predictions =
            (predictionsData ??
              []) as DatabasePrediction[];
        }
      }

      const predictionByMatchId =
        new Map(
          predictions.map((prediction) => [
            prediction.match_id,
            prediction,
          ]),
        );

      const loadedMatches =
        databaseMatches.map(
          (databaseMatch) => {
            const databasePrediction =
              predictionByMatchId.get(
                databaseMatch.id,
              );

            const match: Match = {
              id: databaseMatch.id,
              competition:
                databaseMatch.competition,
              round:
                databaseMatch.round,
              stadium:
                databaseMatch.stadium ??
                "Estádio não informado",
              startsAt:
                databaseMatch.starts_at,
              status:
                databaseMatch.status as MatchStatus,
              homeScore:
                databaseMatch
                  .official_home_score ??
                0,
              awayScore:
                databaseMatch
                  .official_away_score ??
                0,
              homeTeam: {
                id: `${databaseMatch.id}-home`,
                name:
                  databaseMatch
                    .home_team_name,
                abbreviation:
                  databaseMatch
                    .home_team_abbreviation,
                primaryColor:
                  databaseMatch
                    .home_team_color,
                secondaryColor:
                  "#ffffff",
              },
              awayTeam: {
                id: `${databaseMatch.id}-away`,
                name:
                  databaseMatch
                    .away_team_name,
                abbreviation:
                  databaseMatch
                    .away_team_abbreviation,
                primaryColor:
                  databaseMatch
                    .away_team_color,
                secondaryColor:
                  "#ffffff",
              },
            };

            const prediction:
              Prediction | null =
              databasePrediction
                ? {
                    poolId:
                      databasePrediction
                        .pool_id,
                    matchId:
                      databasePrediction
                        .match_id,
                    homeScore:
                      databasePrediction
                        .home_score,
                    awayScore:
                      databasePrediction
                        .away_score,
                    locked: true,
                    savedAt:
                      databasePrediction
                        .saved_at,
                  }
                : null;

            return {
              match,
              prediction,
            };
          },
        );

      setLiveMatches(loadedMatches);
      setLastUpdated(new Date());
      setLoading(false);
      setRefreshing(false);
    }, []);

  useEffect(() => {
    loadLiveMatches(true);

    const intervalId =
      window.setInterval(() => {
        loadLiveMatches();
      }, 15_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadLiveMatches]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-800 bg-[#0e2131] p-8 text-slate-400">
        Procurando partidas ao vivo...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-xs font-extrabold text-red-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />

            AO VIVO
          </span>

          <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">
            Partidas em andamento
          </h1>

          <p className="mt-2 text-slate-400">
            Placares e projeções atualizados
            automaticamente.
          </p>
        </div>

        <button
          type="button"
          disabled={refreshing}
          onClick={() =>
            loadLiveMatches()
          }
          className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold transition hover:border-lime-400 disabled:cursor-wait disabled:opacity-60"
        >
          {refreshing
            ? "Atualizando..."
            : "Atualizar agora"}
        </button>
      </header>

      {lastUpdated && (
        <p className="mt-4 text-xs text-slate-500">
          Última atualização:{" "}
          {lastUpdated.toLocaleTimeString(
            "pt-BR",
            {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            },
          )}
        </p>
      )}

      {loadError && (
        <div className="mt-8 rounded-xl border border-red-400/30 bg-red-400/10 p-5 text-red-300">
          {loadError}
        </div>
      )}

      {!loadError &&
        liveMatches.length === 0 && (
          <section className="mt-8 rounded-2xl border border-dashed border-slate-700 p-8 text-center sm:p-12">
            <span className="text-4xl">
              ⚽
            </span>

            <h2 className="mt-4 text-xl font-extrabold">
              Nenhuma partida ao vivo
            </h2>

            <p className="mt-2 text-slate-400">
              Quando uma partida começar, o
              placar aparecerá aqui
              automaticamente.
            </p>

            <Link
              href="/palpites"
              className="mt-6 inline-block rounded-xl bg-lime-400 px-5 py-3 font-extrabold text-slate-950"
            >
              Ver próximos palpites
            </Link>
          </section>
        )}

      {!loadError &&
        liveMatches.length > 0 && (
          <div className="mt-8 space-y-6">
            {liveMatches.map(
              ({
                match,
                prediction,
              }) => (
                <LiveMatchCard
                  key={match.id}
                  match={match}
                  prediction={prediction}
                />
              ),
            )}
          </div>
        )}
    </div>
  );
}