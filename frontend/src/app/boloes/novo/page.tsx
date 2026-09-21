"use client";

import Link from "next/link";
import {
  FormEvent,
  useState,
} from "react";

import { useDemoStore } from "@/contexts/demo-store";

import type {
  PoolSummary,
  PoolVisibility,
} from "@/types";

export default function CreatePoolPage() {
  const { createPool } = useDemoStore();

  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");

  const [competition, setCompetition] =
    useState("Campeonato Paraense");

  const [visibility, setVisibility] =
    useState<PoolVisibility>("PRIVATE");

  const [createdPool, setCreatedPool] =
    useState<PoolSummary | null>(null);

  const [copied, setCopied] = useState(false);

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const pool = createPool({
      name: name.trim(),
      description: description.trim(),
      competition,
      visibility,
    });

    setCreatedPool(pool);
  }

  async function copyInvite() {
    if (!createdPool?.inviteCode) {
      return;
    }

    await navigator.clipboard.writeText(
      createdPool.inviteCode,
    );

    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  if (createdPool) {
    return (
      <div className="mx-auto max-w-2xl">
        <section className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-7">
          <span className="text-4xl">✓</span>

          <h1 className="mt-4 text-3xl font-extrabold">
            Bolão criado!
          </h1>

          <p className="mt-2 text-slate-300">
            {createdPool.name} já aparece na sua
            lista de bolões.
          </p>

          <div className="mt-7 rounded-xl bg-slate-950/50 p-5">
            <span className="text-xs font-bold text-slate-500">
              CÓDIGO DE CONVITE
            </span>

            <strong className="mt-2 block text-3xl tracking-[0.2em] text-lime-400">
              {createdPool.inviteCode}
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

          <Link
            href="/boloes"
            className="mt-6 inline-flex rounded-xl bg-lime-400 px-5 py-3 font-extrabold text-slate-950"
          >
            Voltar para bolões
          </Link>
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

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-6 rounded-2xl border border-slate-800 bg-[#0e2131] p-6"
      >
        <label className="block">
          <span className="text-sm font-bold">
            Nome do bolão
          </span>

          <input
            required
            minLength={3}
            maxLength={60}
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
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
            maxLength={250}
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
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
            value={competition}
            onChange={(event) =>
              setCompetition(event.target.value)
            }
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-lime-400"
          >
            <option>
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
          className="w-full rounded-xl bg-lime-400 px-5 py-3 font-extrabold text-slate-950 transition hover:bg-lime-300"
        >
          Criar bolão
        </button>
      </form>
    </div>
  );
}