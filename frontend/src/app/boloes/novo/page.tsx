"use client";

import Link from "next/link";

import {
  useActionState,
  useState,
} from "react";

import { createPool } from "@/app/boloes/actions";

import type { PoolVisibility } from "@/types";

const initialState = {
  error: "",
  pool: null,
};

export default function CreatePoolPage() {
  const [state, formAction, pending] =
    useActionState(
      createPool,
      initialState,
    );

  const [description, setDescription] =
    useState("");

  const [visibility, setVisibility] =
    useState<PoolVisibility>("PRIVATE");

  const [copied, setCopied] =
    useState(false);

  async function copyInvite() {
    if (!state.pool?.inviteCode) {
      return;
    }

    await navigator.clipboard.writeText(
      state.pool.inviteCode,
    );

    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  if (state.pool) {
    return (
      <div className="mx-auto max-w-2xl">
        <section className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-7">
          <span className="text-4xl">
            ✓
          </span>

          <h1 className="mt-4 text-3xl font-extrabold">
            Bolão criado!
          </h1>

          <p className="mt-2 text-slate-300">
            {state.pool.name} foi salvo no
            Supabase e já possui os jogos do
            Campeonato Paraense.
          </p>

          <div className="mt-7 rounded-xl bg-slate-950/50 p-5">
            <span className="text-xs font-bold text-slate-500">
              CÓDIGO DE CONVITE
            </span>

            <strong className="mt-2 block text-3xl tracking-[0.2em] text-lime-400">
              {state.pool.inviteCode}
            </strong>

            <button
              type="button"
              onClick={copyInvite}
              className="mt-4 rounded-xl border border-slate-600 px-4 py-2 text-sm font-bold"
            >
              {copied
                ? "Código copiado!"
                : "Copiar código"}
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/boloes"
              className="rounded-xl bg-lime-400 px-5 py-3 text-center font-extrabold text-slate-950"
            >
              Ver meus bolões
            </Link>

            <Link
              href={`/boloes/${state.pool.id}`}
              className="rounded-xl border border-lime-400 px-5 py-3 text-center font-bold text-lime-400"
            >
              Abrir bolão
            </Link>
          </div>
        </section>
      </div>
    );
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
          NOVO BOLÃO
        </span>

        <h1 className="mt-3 text-4xl font-extrabold">
          Crie sua disputa
        </h1>

        <p className="mt-2 text-slate-400">
          Configure o bolão e gere o convite.
        </p>
      </header>

      {state.error && (
        <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-300">
          {state.error}
        </div>
      )}

      <form
        action={formAction}
        className="mt-8 space-y-6 rounded-2xl border border-slate-800 bg-[#0e2131] p-6"
      >
        <label className="block">
          <span className="text-sm font-bold">
            Nome do bolão
          </span>

          <input
            required
            name="name"
            minLength={3}
            maxLength={80}
            placeholder="Ex.: Bolão da Faculdade"
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 outline-none transition focus:border-lime-400"
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold">
            Descrição
          </span>

          <textarea
            required
            name="description"
            maxLength={250}
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value,
              )
            }
            placeholder="Explique quem participará deste bolão."
            rows={4}
            className="mt-2 w-full resize-none rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 outline-none transition focus:border-lime-400"
          />

          <span className="mt-1 block text-right text-xs text-slate-500">
            {description.length}/250
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-bold">
            Campeonato
          </span>

          <select
            name="competition"
            defaultValue="Campeonato Paraense"
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-lime-400"
          >
            <option value="Campeonato Paraense">
              Campeonato Paraense
            </option>
          </select>
        </label>

        <fieldset>
          <legend className="text-sm font-bold">
            Privacidade
          </legend>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label
              className={`cursor-pointer rounded-xl border p-4 ${
                visibility === "PRIVATE"
                  ? "border-lime-400 bg-lime-400/10"
                  : "border-slate-700"
              }`}
            >
              <input
                type="radio"
                name="visibility"
                value="PRIVATE"
                checked={
                  visibility === "PRIVATE"
                }
                onChange={() =>
                  setVisibility("PRIVATE")
                }
                className="mr-2"
              />

              <strong>Privado</strong>

              <span className="mt-1 block text-xs text-slate-400">
                Somente pessoas com o código.
              </span>
            </label>

            <label
              className={`cursor-pointer rounded-xl border p-4 ${
                visibility === "PUBLIC"
                  ? "border-lime-400 bg-lime-400/10"
                  : "border-slate-700"
              }`}
            >
              <input
                type="radio"
                name="visibility"
                value="PUBLIC"
                checked={
                  visibility === "PUBLIC"
                }
                onChange={() =>
                  setVisibility("PUBLIC")
                }
                className="mr-2"
              />

              <strong>Público</strong>

              <span className="mt-1 block text-xs text-slate-400">
                Outros usuários poderão encontrar.
              </span>
            </label>
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-lime-400 px-5 py-3 font-extrabold text-slate-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          {pending
            ? "Criando bolão..."
            : "Criar bolão"}
        </button>
      </form>
    </div>
  );
}