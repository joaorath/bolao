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

export function MatchSyncControls() {
  const [matches, setMatches] =
    useState<SyncMatch[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const loadMatches = useCallback(
    async (showLoading = false) => {
      if (showLoading) {
        setLoading(true);
      }

      const supabase = createClient();

      const { data, error } = await supabase
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
        .eq("provider", "api-futebol")
        .order("starts_at", {
          ascending: true,
        });

      if (error) {
        console.error(
          "Erro ao carregar controles de sincronização:",
          error,
        );

        setErrorMessage(
          "Não foi possível carregar o controle automático.",
        );

        setLoading(false);
        return;
      }

      setMatches(
        (data ?? []) as SyncMatch[],
      );

      setErrorMessage("");
      setLoading(false);
    },
    [],
  );

  useEffect(() => {
    const initialTimeout =
      window.setTimeout(() => {
        void loadMatches(true);
      }, 0);

    const interval = window.setInterval(
      () => {
        void loadMatches(false);
      },
      10000,
    );

    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void loadMatches(false);
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      window.clearTimeout(initialTimeout);
      window.clearInterval(interval);

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [loadMatches]);

  async function changeSyncMode(
    match: SyncMatch,
    ) {
    const newValue =
        !match.automatic_sync_enabled;

    const message = newValue
        ? `Testar a API e retomar a sincronização automática de ${match.home_team_name} x ${match.away_team_name}?`
        : `Assumir o controle manual de ${match.home_team_name} x ${match.away_team_name}? A API deixará de alterar esta partida.`;

    if (!window.confirm(message)) {
        return;
    }

    setUpdatingId(match.id);
    setErrorMessage("");
    setSuccessMessage("");

    const supabase = createClient();

    const { error: modeError } =
        await supabase.rpc(
        "set_match_automatic_sync",
        {
            target_match_id: match.id,
            enabled_value: newValue,
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
    * Ao voltar para automático, testa a API
    * e sincroniza a rodada imediatamente.
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

        setMatches((currentMatches) =>
            currentMatches.map(
            (currentMatch) =>
                currentMatch.id === match.id
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
        * Se a API falhar, devolve a partida
        * imediatamente ao controle manual.
        */
        const { error: rollbackError } =
            await supabase.rpc(
            "set_match_automatic_sync",
            {
                target_match_id: match.id,
                enabled_value: false,
            },
            );

        setUpdatingId(null);

        setMatches((currentMatches) =>
            currentMatches.map(
            (currentMatch) =>
                currentMatch.id === match.id
                ? {
                    ...currentMatch,
                    automatic_sync_enabled:
                        false,
                    manual_override_at:
                        new Date().toISOString(),
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
            "A API falhou e também não foi possível confirmar o retorno ao modo manual. Atualize a página e confira o estado da partida.",
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

    setMatches((currentMatches) =>
        currentMatches.map(
        (currentMatch) =>
            currentMatch.id === match.id
            ? {
                ...currentMatch,
                automatic_sync_enabled:
                    false,
                manual_override_at:
                    new Date().toISOString(),
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

  return (
    <section className="mb-8 rounded-2xl border border-slate-800 bg-[#0e2131] p-5 sm:p-6">
      <div>
        <span className="text-xs font-extrabold tracking-[0.2em] text-lime-400">
          CONTROLE DA API
        </span>

        <h2 className="mt-2 text-xl font-extrabold">
          Automático ou manual
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Desative o automático para corrigir uma
          partida manualmente. A API só voltará a
          alterar essa partida quando você reativar.
        </p>
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
                  timeZone: "America/Belem",
                },
              ).format(
                new Date(match.starts_at),
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
                      void changeSyncMode(match);
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
                      Protegida contra alterações da API.
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