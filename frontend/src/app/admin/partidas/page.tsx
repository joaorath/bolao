"use client";

import Link from "next/link";

import {
    useEffect,
    useState,
} from "react";

import { AdminMatchForm } from "@/components/admin-match-form";
import { PoolResultsManager } from "@/components/pool-results-manager";
import { createClient } from "@/lib/supabase/client";
import { AdminMatchEditor } from "@/components/admin-match-editor";
import { AdminAuditHistory } from "@/components/admin-audit-history";

import type {
    Match,
    MatchStatus,
} from "@/types";

type DatabaseMatch = {
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

export default function AdminMatchesPage() {
    const [matches, setMatches] =
        useState<Match[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [isAdmin, setIsAdmin] =
        useState(false);

    const [loadError, setLoadError] =
        useState("");

    const [activeTab, setActiveTab] =
        useState<"matches" | "history">(
            "matches",
        );

    useEffect(() => {
        async function loadAdminPage() {
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
                data: profile,
                error: profileError,
            } = await supabase
                .from("profiles")
                .select("is_admin")
                .eq("id", user.id)
                .maybeSingle();

            if (profileError) {
                console.error(
                    "Erro ao verificar administrador:",
                    profileError,
                );

                setLoadError(
                    "Não foi possível verificar sua permissão.",
                );

                setLoading(false);
                return;
            }

            if (!profile?.is_admin) {
                setIsAdmin(false);
                setLoading(false);
                return;
            }

            setIsAdmin(true);

            const {
                data,
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
                .order("starts_at", {
                    ascending: true,
                });

            if (matchesError) {
                console.error(
                    "Erro ao carregar partidas:",
                    matchesError,
                );

                setLoadError(
                    "Não foi possível carregar as partidas.",
                );

                setLoading(false);
                return;
            }

            const databaseMatches =
                (data ?? []) as DatabaseMatch[];

            const loadedMatches: Match[] =
                databaseMatches.map(
                    (databaseMatch) => ({
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
                            undefined,
                        awayScore:
                            databaseMatch
                                .official_away_score ??
                            undefined,
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
                            secondaryColor: "#ffffff",
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
                            secondaryColor: "#ffffff",
                        },
                    }),
                );

            setMatches(loadedMatches);
            setLoading(false);
        }

        loadAdminPage();
    }, []);

    function handleMatchCreated(
        createdMatch: Match,
    ) {
        setMatches((currentMatches) =>
            [
                ...currentMatches,
                createdMatch,
            ].sort(
                (first, second) =>
                    new Date(
                        first.startsAt,
                    ).getTime() -
                    new Date(
                        second.startsAt,
                    ).getTime(),
            ),
        );
    }

    function handleMatchDetailsUpdated(
        updatedMatch: Match,
    ) {
        setMatches((currentMatches) =>
            currentMatches
                .map((match) =>
                    match.id === updatedMatch.id
                        ? updatedMatch
                        : match,
                )
                .sort(
                    (first, second) =>
                        new Date(
                            first.startsAt,
                        ).getTime() -
                        new Date(
                            second.startsAt,
                        ).getTime(),
                ),
        );
    }

    function handleMatchUpdated(
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
                Carregando painel administrativo...
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="mx-auto max-w-3xl rounded-2xl border border-red-400/30 bg-red-400/10 p-8 text-center">
                <h1 className="text-2xl font-extrabold text-red-300">
                    Não foi possível abrir o painel
                </h1>

                <p className="mt-3 text-slate-300">
                    {loadError}
                </p>

                <Link
                    href="/palpites"
                    className="mt-6 inline-block rounded-xl bg-lime-400 px-5 py-3 font-extrabold text-slate-950"
                >
                    Voltar para palpites
                </Link>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="mx-auto max-w-3xl rounded-2xl border border-amber-400/30 bg-amber-400/10 p-8 text-center">
                <span className="text-4xl">
                    🔒
                </span>

                <h1 className="mt-4 text-2xl font-extrabold">
                    Acesso restrito
                </h1>

                <p className="mt-3 text-slate-300">
                    Esta página está disponível apenas
                    para administradores da competição.
                </p>

                <Link
                    href="/palpites"
                    className="mt-6 inline-block rounded-xl bg-lime-400 px-5 py-3 font-extrabold text-slate-950"
                >
                    Voltar para palpites
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl">
            <header className="mb-8">
                <span className="text-xs font-extrabold tracking-[0.2em] text-amber-400">
                    ADMINISTRAÇÃO
                </span>

                <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                    Controle de partidas
                </h1>

                <p className="mt-2 max-w-3xl text-slate-400">
                    Atualize o andamento e o placar oficial
                    das partidas. As alterações serão
                    aplicadas automaticamente em todos os
                    bolões.
                </p>
            </header>

            <nav className="mb-8 flex gap-2 overflow-x-auto border-b border-slate-800 pb-3">
                <button
                    type="button"
                    onClick={() =>
                        setActiveTab("matches")
                    }
                    className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${activeTab === "matches"
                        ? "bg-lime-400 text-slate-950"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        }`}
                >
                    Partidas
                </button>

                <button
                    type="button"
                    onClick={() =>
                        setActiveTab("history")
                    }
                    className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${activeTab === "history"
                        ? "bg-lime-400 text-slate-950"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        }`}
                >
                    Histórico
                </button>
            </nav>

            {activeTab === "matches" && (
                <>
                    <AdminMatchForm
                        onMatchCreated={
                            handleMatchCreated
                        }
                    />

                    <AdminMatchEditor
                        matches={matches}
                        onMatchUpdated={
                            handleMatchDetailsUpdated
                        }
                    />

                    <div className="mb-6 grid gap-4 sm:grid-cols-3">
                        <SummaryCard
                            label="Total de partidas"
                            value={String(matches.length)}
                        />

                        <SummaryCard
                            label="Ao vivo"
                            value={String(
                                matches.filter(
                                    (match) =>
                                        match.status === "LIVE" ||
                                        match.status === "HALFTIME",
                                ).length,
                            )}
                        />

                        <SummaryCard
                            label="Encerradas"
                            value={String(
                                matches.filter(
                                    (match) =>
                                        match.status === "FINISHED",
                                ).length,
                            )}
                        />
                    </div>

                    <PoolResultsManager
                        matches={matches}
                        onResultSaved={
                            handleMatchUpdated
                        }
                    />
                </>
            )}

            {activeTab === "history" && (
                <AdminAuditHistory />
            )}
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
        <div className="rounded-2xl border border-slate-800 bg-[#0e2131] p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {label}
            </span>

            <strong className="mt-2 block text-3xl">
                {value}
            </strong>
        </div>
    );
}