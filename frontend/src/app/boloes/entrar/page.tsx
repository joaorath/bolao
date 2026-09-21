"use client";

import Link from "next/link";
import {
  FormEvent,
  useState,
} from "react";

import { useDemoStore } from "@/contexts/demo-store";

export default function JoinPoolPage() {
  const { joinPool } = useDemoStore();

  const [code, setCode] = useState("");
  const [poolFound, setPoolFound] =
    useState(false);

  const [message, setMessage] = useState("");
  const [success, setSuccess] =
    useState(false);

  function searchPool(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedCode = code
      .trim()
      .toUpperCase();

    if (normalizedCode !== "PARAZAO26") {
      setPoolFound(false);
      setMessage(
        "Nenhum bolão encontrado com este código.",
      );

      return;
    }

    setMessage("");
    setPoolFound(true);
  }

  function confirmEntry() {
    const result = joinPool(code);

    setMessage(result.message);
    setSuccess(result.success);

    if (result.success) {
      setPoolFound(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/boloes"
        className="text-sm font-bold text-lime-400"
      >
        ← Voltar para bolões
      </Link>

      <header className="mt-6">
        <span className="text-xs font-extrabold tracking-[0.2em] text-lime-400">
          CONVITE
        </span>

        <h1 className="mt-3 text-4xl font-extrabold">
          Entrar em um bolão
        </h1>

        <p className="mt-2 text-slate-400">
          Digite o código enviado pelo criador.
        </p>
      </header>

      <form
        onSubmit={searchPool}
        className="mt-8 rounded-2xl border border-slate-800 bg-[#0e2131] p-6"
      >
        <label className="block">
          <span className="text-sm font-bold">
            Código do convite
          </span>

          <input
            required
            value={code}
            onChange={(event) => {
              setCode(
                event.target.value.toUpperCase(),
              );

              setMessage("");
              setPoolFound(false);
            }}
            placeholder="Ex.: PARAZAO26"
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 uppercase tracking-widest outline-none focus:border-lime-400"
          />
        </label>

        <p className="mt-3 text-xs text-slate-500">
          Para testar, utilize o código:
          {" "}
          <strong className="text-lime-400">
            PARAZAO26
          </strong>
        </p>

        <button
          type="submit"
          className="mt-6 w-full rounded-xl bg-lime-400 px-5 py-3 font-extrabold text-slate-950"
        >
          Buscar bolão
        </button>
      </form>

      {poolFound && (
        <section className="mt-5 rounded-2xl border border-lime-400/30 bg-lime-400/10 p-6">
          <span className="text-xs font-bold text-lime-400">
            BOLÃO ENCONTRADO
          </span>

          <h2 className="mt-2 text-xl font-extrabold">
            Bolão da Faculdade
          </h2>

          <p className="mt-1 text-sm text-slate-300">
            Campeonato Paraense · 16 participantes
          </p>

          <button
            type="button"
            onClick={confirmEntry}
            className="mt-5 rounded-xl bg-lime-400 px-5 py-3 font-extrabold text-slate-950"
          >
            Confirmar participação
          </button>
        </section>
      )}

      {message && (
        <div
          className={`mt-5 rounded-xl border p-4 ${
            success
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
              : "border-red-400/30 bg-red-400/10 text-red-300"
          }`}
        >
          <p>{message}</p>

          {success && (
            <Link
              href="/boloes"
              className="mt-3 inline-block font-bold underline"
            >
              Ver meus bolões
            </Link>
          )}
        </div>
      )}
    </div>
  );
}