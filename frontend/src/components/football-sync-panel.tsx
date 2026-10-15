"use client";

import {
  useState,
} from "react";

import type {
  Match,
} from "@/types";

type PreviewResponse = {
  provider: string;
  championshipId: number;
  round: number;
  roundName: string;
  status: string;
  matchCount: number;
  matches: Match[];
  error?: string;
};

type SynchronizationResponse = {
  provider: string;
  championshipId: number;
  competition: string;
  round: number;
  roundName: string;
  matchCount: number;
  synchronization: {
    processed_count: number;
    inserted_count: number;
    updated_count: number;
    synchronized_pool_count: number;
  };
  error?: string;
};

type FootballSyncPanelProps = {
  onSynchronized?: () => void;
};

export function FootballSyncPanel({
  onSynchronized,
}: FootballSyncPanelProps) {
  const [
    selectedRound,
    setSelectedRound,
  ] = useState(33);

  const [
    preview,
    setPreview,
  ] =
    useState<PreviewResponse | null>(
      null,
    );

  const [
    loadingPreview,
    setLoadingPreview,
  ] = useState(false);

  const [
    synchronizing,
    setSynchronizing,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  async function loadPreview() {
    setLoadingPreview(true);
    setErrorMessage("");
    setSuccessMessage("");
    setPreview(null);

    try {
      const response = await fetch(
        `/api/admin/football/preview?round=${selectedRound}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const responseBody =
        (await response.json()) as
          PreviewResponse;

      if (!response.ok) {
        throw new Error(
          responseBody.error ??
            "Não foi possível consultar a rodada.",
        );
      }

      setPreview(responseBody);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível consultar a rodada.",
      );
    } finally {
      setLoadingPreview(false);
    }
  }

  async function synchronizeRound() {
    if (!preview) {
      return;
    }

    const confirmed =
      window.confirm(
        `Deseja sincronizar ${preview.matchCount} partidas da ${preview.roundName}?`,
      );

    if (!confirmed) {
      return;
    }

    setSynchronizing(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        "/api/admin/football/preview",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            round:
              preview.round,
          }),
        },
      );

      const responseBody =
        (await response.json()) as
          SynchronizationResponse;

      if (!response.ok) {
        throw new Error(
          responseBody.error ??
            "Não foi possível sincronizar a rodada.",
        );
      }

      const result =
        responseBody.synchronization;

      setSuccessMessage(
        [
          `${result.processed_count} partidas processadas.`,
          `${result.inserted_count} novas.`,
          `${result.updated_count} atualizadas.`,
          `${result.synchronized_pool_count} associações com bolões.`,
        ].join(" "),
      );

      window.setTimeout(() => {
        onSynchronized?.();
      }, 1800);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível sincronizar a rodada.",
      );
    } finally {
      setSynchronizing(false);
    }
  }

  return (
    <section className="mb-8 rounded-2xl border border-sky-400/30 bg-sky-400/5 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-extrabold tracking-[0.2em] text-sky-400">
            API FUTEBOL
          </span>

          <h2 className="mt-2 text-xl font-extrabold">
            Sincronizar Série B
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
            Consulte a rodada antes de
            salvar. A prévia não altera
            nenhuma partida no banco.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 min-[430px]:flex-row sm:w-auto">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-400">
              Rodada
            </span>

            <input
              type="number"
              min={1}
              max={100}
              value={selectedRound}
              onChange={(event) => {
                setSelectedRound(
                  Number(
                    event.target.value,
                  ),
                );

                setPreview(null);
                setSuccessMessage("");
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-sky-400 min-[430px]:w-28"
            />
          </label>

          <button
            type="button"
            onClick={loadPreview}
            disabled={
              loadingPreview ||
              synchronizing
            }
            className="self-end rounded-xl bg-sky-400 px-5 py-3 font-extrabold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            {loadingPreview
              ? "Consultando..."
              : "Ver prévia"}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mt-5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-300">
          {successMessage}
        </div>
      )}

      {preview && (
        <div className="mt-6">
          <div className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-950/30 p-4 min-[500px]:flex-row min-[500px]:items-center min-[500px]:justify-between">
            <div>
              <strong className="block">
                {preview.roundName}
              </strong>

              <span className="mt-1 block text-sm text-slate-400">
                {preview.matchCount} partidas
                encontradas · Campeonato ID{" "}
                {preview.championshipId}
              </span>
            </div>

            <span className="w-fit rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-bold uppercase text-sky-300">
              {preview.status}
            </span>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {preview.matches.map(
              (match) => (
                <article
                  key={match.id}
                  className="rounded-xl border border-slate-800 bg-[#0e2131] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-bold text-slate-500">
                      {new Date(
                        match.startsAt,
                      ).toLocaleString(
                        "pt-BR",
                        {
                          dateStyle:
                            "short",
                          timeStyle:
                            "short",
                        },
                      )}
                    </span>

                    <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] font-bold text-slate-300">
                      {match.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
                    <div className="min-w-0">
                      <strong className="block truncate">
                        {
                          match.homeTeam
                            .name
                        }
                      </strong>

                      <span className="text-xs text-slate-500">
                        {
                          match.homeTeam
                            .abbreviation
                        }
                      </span>
                    </div>

                    {typeof match.homeScore === "number" &&
                    typeof match.awayScore === "number" ? (
                        <strong className="whitespace-nowrap rounded-lg bg-slate-950 px-3 py-2 text-lg text-white">
                            {match.homeScore} × {match.awayScore}
                        </strong>
                        ) : (
                        <strong className="text-slate-500">
                            ×
                        </strong>
                    )}

                    <div className="min-w-0 text-right">
                      <strong className="block truncate">
                        {
                          match.awayTeam
                            .name
                        }
                      </strong>

                      <span className="text-xs text-slate-500">
                        {
                          match.awayTeam
                            .abbreviation
                        }
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 truncate text-xs text-slate-500">
                    {match.stadium}
                  </p>
                </article>
              ),
            )}
          </div>

          <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
            <p className="text-sm leading-6 text-amber-200">
              Confira datas, times,
              competição e status. O botão
              abaixo grava ou atualiza essas
              partidas no banco remoto.
            </p>

            <button
              type="button"
              onClick={
                synchronizeRound
              }
              disabled={
                synchronizing ||
                preview.matchCount === 0
              }
              className="mt-4 w-full rounded-xl bg-lime-400 px-5 py-3 font-extrabold text-slate-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 sm:w-auto"
            >
              {synchronizing
                ? "Sincronizando..."
                : `Sincronizar ${preview.matchCount} partidas`}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}