"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

type AuditLog = {
  log_id: number;
  actor_user_id: string | null;
  actor_name: string;
  action_name: string;
  match_id: string;
  home_team_name: string;
  away_team_name: string;
  previous_status: string | null;
  new_status: string | null;
  event_created_at: string;
};

const PAGE_SIZE = 50;

export function AdminAuditHistory() {
  const [logs, setLogs] =
    useState<AuditLog[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [hasMore, setHasMore] =
    useState(false);

  const loadLogs = useCallback(
    async (
      reset: boolean,
    ) => {
      if (reset) {
        setLoading(true);
        setErrorMessage("");
      } else {
        setLoadingMore(true);
      }

      const offset = reset
        ? 0
        : logs.length;

      const supabase = createClient();

      const { data, error } =
        await supabase.rpc(
          "get_admin_audit_logs",
          {
            result_limit: PAGE_SIZE,
            result_offset: offset,
          },
        );

      if (error) {
        console.error(
          "Erro ao carregar histórico:",
          error,
        );

        setErrorMessage(
          "Não foi possível carregar o histórico administrativo.",
        );

        setLoading(false);
        setLoadingMore(false);
        return;
      }

      const loadedLogs =
        (data ?? []) as AuditLog[];

      if (reset) {
        setLogs(loadedLogs);
      } else {
        setLogs((currentLogs) => [
          ...currentLogs,
          ...loadedLogs,
        ]);
      }

      setHasMore(
        loadedLogs.length === PAGE_SIZE,
      );

      setLoading(false);
      setLoadingMore(false);
    },
    [logs.length],
  );

  useEffect(() => {
    loadLogs(true);
  }, [loadLogs]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0e2131] p-8 text-slate-400">
        Carregando histórico administrativo...
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0e2131]">
      <div className="flex flex-col gap-4 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <span className="text-xs font-extrabold tracking-[0.2em] text-sky-400">
            AUDITORIA
          </span>

          <h2 className="mt-2 text-xl font-extrabold">
            Histórico administrativo
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Alterações realizadas nas partidas
            oficiais.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadLogs(true)}
          className="rounded-xl border border-sky-400/30 px-4 py-2.5 text-sm font-bold text-sky-400 transition hover:bg-sky-400/10"
        >
          Atualizar histórico
        </button>
      </div>

      {errorMessage && (
        <div className="m-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-300">
          {errorMessage}
        </div>
      )}

      {!errorMessage &&
        logs.length === 0 && (
          <div className="p-10 text-center">
            <span className="text-4xl">
              📋
            </span>

            <h3 className="mt-4 font-extrabold">
              Nenhuma alteração registrada
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              As próximas alterações nas partidas
              aparecerão aqui.
            </p>
          </div>
        )}

      {logs.length > 0 && (
        <div className="divide-y divide-slate-800">
          {logs.map((log) => (
            <AuditLogRow
              key={log.log_id}
              log={log}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="border-t border-slate-800 p-5 text-center">
          <button
            type="button"
            disabled={loadingMore}
            onClick={() => loadLogs(false)}
            className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-bold text-slate-300 transition hover:border-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingMore
              ? "Carregando..."
              : "Carregar mais"}
          </button>
        </div>
      )}
    </section>
  );
}

function AuditLogRow({
  log,
}: {
  log: AuditLog;
}) {
  const formattedDate =
    new Intl.DateTimeFormat(
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
    ).format(
      new Date(log.event_created_at),
    );

  return (
    <article className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <ActionBadge
              action={log.action_name}
            />

            <strong>
              {log.home_team_name} ×{" "}
              {log.away_team_name}
            </strong>
          </div>

          <p className="mt-3 text-sm text-slate-400">
            Alterado por{" "}
            <strong className="text-slate-200">
              {log.actor_name}
            </strong>
          </p>

          {log.previous_status &&
            log.new_status &&
            log.previous_status !==
              log.new_status && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <StatusBadge
                  status={
                    log.previous_status
                  }
                />

                <span className="text-slate-600">
                  →
                </span>

                <StatusBadge
                  status={log.new_status}
                />
              </div>
            )}
        </div>

        <time className="shrink-0 text-xs text-slate-500">
          {formattedDate}
        </time>
      </div>
    </article>
  );
}

function ActionBadge({
  action,
}: {
  action: string;
}) {
  const labels: Record<
    string,
    string
  > = {
    MATCH_CREATED:
      "PARTIDA CRIADA",
    MATCH_STATUS_UPDATED:
      "STATUS ALTERADO",
    MATCH_SCORE_UPDATED:
      "PLACAR ALTERADO",
    MATCH_DETAILS_UPDATED:
      "DADOS ALTERADOS",
  };

  const styles: Record<
    string,
    string
  > = {
    MATCH_CREATED:
      "bg-emerald-400/10 text-emerald-400",
    MATCH_STATUS_UPDATED:
      "bg-amber-400/10 text-amber-400",
    MATCH_SCORE_UPDATED:
      "bg-lime-400/10 text-lime-400",
    MATCH_DETAILS_UPDATED:
      "bg-sky-400/10 text-sky-400",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-[10px] font-bold ${
        styles[action] ??
        "bg-slate-500/10 text-slate-400"
      }`}
    >
      {labels[action] ?? action}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const labels: Record<
    string,
    string
  > = {
    SCHEDULED: "AGENDADO",
    OPEN: "ABERTO",
    LIVE: "AO VIVO",
    HALFTIME: "INTERVALO",
    FINISHED: "ENCERRADO",
    POSTPONED: "ADIADO",
    CANCELLED: "CANCELADO",
  };

  return (
    <span className="rounded-full bg-slate-800 px-2.5 py-1 font-bold text-slate-300">
      {labels[status] ?? status}
    </span>
  );
}