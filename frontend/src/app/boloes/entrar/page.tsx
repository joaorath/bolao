"use client";

import Link from "next/link";

import {
  useActionState,
  useState,
} from "react";

import { joinPool } from "@/app/boloes/actions";

const initialState = {
  error: "",
};

export default function JoinPoolPage() {
  const [state, formAction, pending] =
    useActionState(
      joinPool,
      initialState,
    );

  const [code, setCode] = useState("");

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
          Digite o código enviado pelo
          criador do bolão.
        </p>
      </header>

      {state.error && (
        <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-300">
          {state.error}
        </div>
      )}

      <form
        action={formAction}
        className="mt-8 rounded-2xl border border-slate-800 bg-[#0e2131] p-6"
      >
        <label className="block">
          <span className="text-sm font-bold">
            Código do convite
          </span>

          <input
            required
            name="inviteCode"
            value={code}
            onChange={(event) =>
              setCode(
                event.target.value.toUpperCase(),
              )
            }
            placeholder="Ex.: A1B2C3D4"
            autoComplete="off"
            maxLength={8}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 uppercase tracking-widest outline-none focus:border-lime-400"
          />
        </label>

        <div className="mt-4 rounded-xl bg-slate-950/40 p-4">
          <p className="text-sm text-slate-400">
            Depois de entrar, você poderá
            visualizar os jogos, salvar seus
            palpites e acompanhar o ranking.
          </p>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-xl bg-lime-400 px-5 py-3 font-extrabold text-slate-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          {pending
            ? "Entrando no bolão..."
            : "Entrar no bolão"}
        </button>
      </form>
    </div>
  );
}