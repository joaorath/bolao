"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

type SyncMatch = {
  id: string;
  provider: string;
  round: number;
  automatic_sync_enabled: boolean;
  manual_override_at: string | null;
  home_team_name: string;
  away_team_name: string;
  starts_at: string;
  status: string;
};

type FootballSyncState = {
  provider: string;
  championship_id: number;
  last_round: number | null;
  last_attempt_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
  processed_count: number;
  inserted_count: number;
  updated_count: number;
  skipped_count: number;
  synchronized_pool_count: number;
  automatic_request_date: string | null;
  automatic_request_count: number;
};

type SyncStatusResponse = {
  state: FootballSyncState | null;
  automaticRequestLimit: number;
  error?: string;
};

function getCurrentDateInBelem() {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: "America/Belem",
      },
    ).formatToParts(new Date());

  const year = parts.find(
    (part) => part.type === "year",
  )?.value;

  const month = parts.find(
    (part) => part.type === "month",
  )?.value;

  const day = parts.find(
    (part) => part.type === "day",
  )?.value;

  return `${year}-${month}-${day}`;
}

function formatDateTime(
  value: string | null,
) {
  if (!value) {
    return "Ainda não registrado";
  }

  const timestamp =
    new Date(value);

  if (
    Number.isNaN(
      timestamp.getTime(),
    )
  ) {
    return "Data indisponível";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "America/Belem",
    },
  ).format(timestamp);
}

export function MatchSyncControls() {
  const [matches, setMatches] =
    useState<SyncMatch[]>([]);

  const [
    syncState,
    setSyncState,
  ] =
    useState<FootballSyncState | null>(
      null,
    );

  const [
    requestLimit,
    setRequestLimit,
  ] = useState(85);

  const [loading, setLoading] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const loadData = useCallback(
    async (showLoading = false) => {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const supabase =
        createClient();

      try {
        const [
          matchesResult,
          statusResponse,
        ] = await Promise.all([
          supabase
            .from("matches")
            .select(`
              id,
              provider,
              round,
              automatic_sync_enabled,
              manual_override_at,
              home_team_name,
              away_team_name,
              starts_at,
              status
            `)
            .eq(
              "provider",
              "api-futebol",
            )
            .order("starts_at", {
              ascending: true,
            }),

          fetch(
            "/api/admin/football/status",
            {
              method: "GET",
              cache: "no-store",
            },
          ),
        ]);

        if (matchesResult.error) {
          throw new Error(
            "Não foi possível carregar as partidas da API.",
          );
        }

        const responseBody =
          (await statusResponse.json()) as
            SyncStatusResponse;

        if (!statusResponse.ok) {
          throw new Error(
            responseBody.error ??
              "Não foi possível carregar o monitor da API.",
          );
        }

        setMatches(
          (matchesResult.data ??
            []) as SyncMatch[],
        );

        setSyncState(
          responseBody.state,
        );

        setRequestLimit(
          responseBody
            .automaticRequestLimit ??
            85,
        );

        setErrorMessage("");
      } catch (error) {
        console.error(
          "Erro ao carregar controles de sincronização:",
          error,
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os controles da API.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    const initialTimeout =
      window.setTimeout(() => {
        void loadData(true);
      }, 0);

    const interval =
      window.setInterval(() => {
        void loadData(false);
      }, 10000);

    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void loadData(false);
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      window.clearTimeout(
        initialTimeout,
      );

      window.clearInterval(
        interval,
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [loadData]);

  async function changeSyncMode(
    match: SyncMatch,
  ) {
    const newValue =
      !match.automatic_sync_enabled;

    const message = newValue
      ? `Testar a API e retomar a sincronização automática de ${match.home_team_name} × ${match.away_team_name}?`
      : `Assumir o controle manual de ${match.home_team_name} × ${match.away_team_name}? A API deixará de alterar esta partida.`;

    if (!window.confirm(message)) {
      return;
    }

    setUpdatingId(match.id);
    setErrorMessage("");
    setSuccessMessage("");

    const supabase =
      createClient();

    const { error: modeError } =
      await supabase.rpc(
        "set_match_automatic_sync",
        {
          target_match_id:
            match.id,
          enabled_value:
            newValue,
        },
      );

    if (modeError) {
      console.error(
        "Erro ao alterar sincronização:",
        modeError,
      );

      setUpdatingId(null);

      setErrorMessage(
        modeError.message ||
          "Não foi possível alterar a sincronização.",
      );

      return;
    }

    /*
     * Ao voltar para automático, a API é
     * testada e a rodada é sincronizada
     * imediatamente.
     */
    if (newValue) {
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
              round: match.round,
            }),
          },
        );

        const responseBody =
          (await response.json()) as {
            error?: string;
          };

        if (!response.ok) {
          throw new Error(
            responseBody.error ??
              "A API ainda não está respondendo corretamente.",
          );
        }

        setMatches(
          (currentMatches) =>
            currentMatches.map(
              (currentMatch) =>
                currentMatch.id ===
                match.id
                  ? {
                      ...currentMatch,
                      automatic_sync_enabled:
                        true,
                      manual_override_at:
                        null,
                    }
                  : currentMatch,
            ),
        );

        setUpdatingId(null);

        setSuccessMessage(
          "A API respondeu corretamente. A partida foi atualizada e voltou ao modo automático.",
        );

        window.setTimeout(() => {
          window.location.reload();
        }, 1500);

        return;
      } catch (error) {
        console.error(
          "Erro ao testar a API:",
          error,
        );

        /*
         * Se a API falhar, a partida volta
         * imediatamente ao controle manual.
         */
        const {
          error: rollbackError,
        } = await supabase.rpc(
          "set_match_automatic_sync",
          {
            target_match_id:
              match.id,
            enabled_value: false,
          },
        );

        setUpdatingId(null);

        setMatches(
          (currentMatches) =>
            currentMatches.map(
              (currentMatch) =>
                currentMatch.id ===
                match.id
                  ? {
                      ...currentMatch,
                      automatic_sync_enabled:
                        false,
                      manual_override_at:
                        new Date()
                          .toISOString(),
                    }
                  : currentMatch,
            ),
        );

        if (rollbackError) {
          console.error(
            "Erro ao restaurar controle manual:",
            rollbackError,
          );

          setErrorMessage(
            "A API falhou e também não foi possível confirmar o retorno ao modo manual. Atualize a página e confira a partida.",
          );

          return;
        }

        setErrorMessage(
          error instanceof Error
            ? `${error.message} A partida permaneceu em controle manual.`
            : "A API ainda está indisponível. A partida permaneceu em controle manual.",
        );

        return;
      }
    }

    setUpdatingId(null);

    setMatches(
      (currentMatches) =>
        currentMatches.map(
          (currentMatch) =>
            currentMatch.id ===
            match.id
              ? {
                  ...currentMatch,
                  automatic_sync_enabled:
                    false,
                  manual_override_at:
                    new Date()
                      .toISOString(),
                }
              : currentMatch,
        ),
    );

    setSuccessMessage(
      "Controle manual ativado. A API não modificará esta partida.",
    );
  }

  if (loading) {
    return (
      <section className="mb-8 rounded-2xl border border-slate-800 bg-[#0e2131] p-6 text-slate-400">
        Carregando controles de sincronização...
      </section>
    );
  }

  const todayInBelem =
    getCurrentDateInBelem();

  const automaticRequestCount =
    syncState
      ?.automatic_request_date ===
    todayInBelem
      ? syncState
          .automatic_request_count
      : 0;

  const requestPercentage =
    requestLimit > 0
      ? Math.min(
          100,
          Math.round(
            (automaticRequestCount /
              requestLimit) *
              100,
          ),
        )
      : 0;

  const limitReached =
    automaticRequestCount >=
    requestLimit;

  const nearLimit =
    !limitReached &&
    requestPercentage >= 80;

  const automaticMatches =
    matches.filter(
      (match) =>
        match.automatic_sync_enabled,
    ).length;

  const manualMatches =
    matches.length -
    automaticMatches;

  const healthLabel =
    syncState?.last_error
      ? "Erro detectado"
      : limitReached
        ? "Limite atingido"
        : nearLimit
          ? "Próximo do limite"
          : syncState?.last_success_at
            ? "Funcionando"
            : "Aguardando execução";

  const healthStyle =
    syncState?.last_error
      ? "border-red-400/30 bg-red-400/10 text-red-300"
      : limitReached
        ? "border-red-400/30 bg-red-400/10 text-red-300"
        : nearLimit
          ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
          : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";

  return (
    <section className="mb-8 rounded-2xl border border-slate-800 bg-[#0e2131] p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="text-xs font-extrabold tracking-[0.2em] text-lime-400">
            CONTROLE DA API
          </span>

          <h2 className="mt-2 text-xl font-extrabold">
            Sincronização automática
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Acompanhe o funcionamento da API e
            altere partidas específicas para o
            controle manual quando necessário.
          </p>
        </div>

        <button
          type="button"
          disabled={refreshing}
          onClick={() => {
            void loadData(false);
          }}
          className="shrink-0 rounded-xl border border-lime-400/30 px-4 py-2.5 text-sm font-bold text-lime-400 transition hover:bg-lime-400/10 disabled:cursor-wait disabled:opacity-50"
        >
          {refreshing
            ? "Atualizando..."
            : "Atualizar monitor"}
        </button>
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

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MonitorCard
          label="Estado da API"
          value={healthLabel}
          className={healthStyle}
        />

        <MonitorCard
          label="Requisições automáticas hoje"
          value={`${automaticRequestCount} / ${requestLimit}`}
        />

        <MonitorCard
          label="Rodada monitorada"
          value={
            syncState?.last_round
              ? String(
                  syncState.last_round,
                )
              : "—"
          }
        />

        <MonitorCard
          label="Modos das partidas"
          value={`${automaticMatches} automáticas · ${manualMatches} manuais`}
        />
      </div>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/30 p-4">
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="font-bold text-slate-300">
            Consumo diário reservado
          </span>

          <span
            className={
              limitReached
                ? "font-bold text-red-400"
                : nearLimit
                  ? "font-bold text-amber-400"
                  : "font-bold text-emerald-400"
            }
          >
            {requestPercentage}%
          </span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-all ${
              limitReached
                ? "bg-red-400"
                : nearLimit
                  ? "bg-amber-400"
                  : "bg-emerald-400"
            }`}
            style={{
              width: `${requestPercentage}%`,
            }}
          />
        </div>

        <div className="mt-4 grid gap-3 text-xs text-slate-400 md:grid-cols-2">
          <p>
            Última tentativa:{" "}
            <strong className="text-slate-200">
              {formatDateTime(
                syncState
                  ?.last_attempt_at ??
                  null,
              )}
            </strong>
          </p>

          <p>
            Último sucesso:{" "}
            <strong className="text-slate-200">
              {formatDateTime(
                syncState
                  ?.last_success_at ??
                  null,
              )}
            </strong>
          </p>

          <p>
            Partidas processadas:{" "}
            <strong className="text-slate-200">
              {syncState
                ?.processed_count ?? 0}
            </strong>
          </p>

          <p>
            Associações atualizadas:{" "}
            <strong className="text-slate-200">
              {syncState
                ?.synchronized_pool_count ??
                0}
            </strong>
          </p>
        </div>

        {syncState?.last_error && (
          <div className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-xs leading-5 text-red-300">
            <strong>
              Último erro:
            </strong>{" "}
            {syncState.last_error}
          </div>
        )}

        {limitReached && (
          <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-xs leading-5 text-amber-200">
            O limite automático de hoje foi
            alcançado. Os controles manuais
            continuam disponíveis, mas evite
            sincronizações desnecessárias até o
            próximo dia.
          </div>
        )}
      </div>

      <div className="mt-8 border-t border-slate-800 pt-6">
        <h3 className="font-extrabold">
          Automático ou manual
        </h3>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Desative o automático para corrigir uma
          partida manualmente. A API só voltará a
          alterar essa partida quando você
          reativar.
        </p>
      </div>

      {matches.length === 0 ? (
        <p className="mt-5 text-sm text-slate-500">
          Nenhuma partida importada da API.
        </p>
      ) : (
        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {matches.map((match) => {
            const automatic =
              match.automatic_sync_enabled;

            const updating =
              updatingId === match.id;

            const matchDate =
              new Intl.DateTimeFormat(
                "pt-BR",
                {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone:
                    "America/Belem",
                },
              ).format(
                new Date(
                  match.starts_at,
                ),
              );

            return (
              <article
                key={match.id}
                className={`rounded-xl border p-4 ${
                  automatic
                    ? "border-emerald-400/30 bg-emerald-400/5"
                    : "border-amber-400/30 bg-amber-400/5"
                }`}
              >
                <div className="flex flex-col gap-4 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between">
                  <div className="min-w-0">
                    <strong className="block truncate">
                      {match.home_team_name}
                      {" × "}
                      {match.away_team_name}
                    </strong>

                    <p className="mt-1 text-xs text-slate-400">
                      {matchDate}
                      {" · "}
                      {match.status}
                    </p>

                    <span
                      className={`mt-2 inline-block rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase ${
                        automatic
                          ? "bg-emerald-400/10 text-emerald-300"
                          : "bg-amber-400/10 text-amber-300"
                      }`}
                    >
                      {automatic
                        ? "Automático"
                        : "Controle manual"}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => {
                      void changeSyncMode(
                        match,
                      );
                    }}
                    className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      automatic
                        ? "border-amber-400/40 text-amber-300 hover:bg-amber-400/10"
                        : "border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/10"
                    }`}
                  >
                    {updating
                      ? "Alterando..."
                      : automatic
                        ? "Usar controle manual"
                        : "Retomar automático"}
                  </button>
                </div>

                {!automatic &&
                  match.manual_override_at && (
                    <p className="mt-3 border-t border-amber-400/20 pt-3 text-xs text-amber-200">
                      Protegida contra alterações
                      da API.
                    </p>
                  )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function MonitorCard({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-800 bg-slate-950/30 p-4 ${className}`}
    >
      <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-70">
        {label}
      </span>

      <strong className="mt-2 block text-sm">
        {value}
      </strong>
    </div>
  );
}