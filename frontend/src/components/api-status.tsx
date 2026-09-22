"use client";

import {
  useEffect,
  useState,
} from "react";

import { getApiHealth } from "@/lib/api";

import type { ApiHealthResponse } from "@/types/api";

type ConnectionStatus =
  | "loading"
  | "connected"
  | "disconnected";

export function ApiStatus() {
  const [status, setStatus] =
    useState<ConnectionStatus>("loading");

  const [
    apiInformation,
    setApiInformation,
  ] = useState<ApiHealthResponse | null>(
    null,
  );

  useEffect(() => {
    const controller = new AbortController();

    async function checkApi() {
      try {
        const data = await getApiHealth(
          controller.signal,
        );

        setApiInformation(data);
        setStatus("connected");
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setStatus("disconnected");
      }
    }

    checkApi();

    return () => controller.abort();
  }, []);

  if (status === "loading") {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
        <p className="text-slate-400">
          Verificando conexão com o servidor...
        </p>
      </div>
    );
  }

  if (status === "disconnected") {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5">
        <p className="font-semibold text-red-400">
          Backend desconectado
        </p>

        <p className="mt-1 text-sm text-slate-400">
          Verifique se o servidor está rodando na
          porta 3333.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-lime-400/30 bg-lime-400/10 p-5">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-lime-400" />

        <p className="font-semibold text-lime-400">
          Frontend conectado ao backend
        </p>
      </div>

      <p className="mt-2 text-sm text-slate-300">
        {apiInformation?.application}
      </p>
    </div>
  );
}