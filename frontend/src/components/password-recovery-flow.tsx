"use client";

import {
  type FormEvent,
  useState,
} from "react";

import {
  requestPasswordReset,
  verifyPasswordRecoveryCode,
} from "@/app/auth/password-actions";

import type {
  AuthActionResult,
} from "@/app/auth/actions";

type RecoveryStep =
  | "email"
  | "code";

type PasswordRecoveryFlowProps = {
  initialStep: RecoveryStep;
};

export function PasswordRecoveryFlow({
  initialStep,
}: PasswordRecoveryFlowProps) {
  const [step, setStep] =
    useState<RecoveryStep>(
      initialStep,
    );

  const [email, setEmail] =
    useState("");

  const [result, setResult] =
    useState<AuthActionResult | null>(
      null,
    );

  const [pending, setPending] =
    useState(false);

  async function handleEmailSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (pending) {
      return;
    }

    const formData =
      new FormData(
        event.currentTarget,
      );

    const submittedEmail =
      String(
        formData.get("email") ?? "",
      )
        .trim()
        .toLowerCase();

    setPending(true);
    setResult(null);

    try {
      const actionResult =
        await requestPasswordReset(
          formData,
        );

      setResult(actionResult);

      if (actionResult.success) {
        setEmail(
          submittedEmail,
        );

        setStep("code");

        window.history.replaceState(
          null,
          "",
          "/recuperar-senha?etapa=codigo",
        );
      }
    } catch (error) {
      console.error(
        "Erro ao solicitar recuperação:",
        error,
      );

      setResult({
        message:
          "Não foi possível solicitar o código. Tente novamente.",
        invalidFields: [],
        success: false,
      });
    } finally {
      setPending(false);
    }
  }

  async function handleCodeSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (pending) {
      return;
    }

    const formData =
      new FormData(
        event.currentTarget,
      );

    setPending(true);
    setResult(null);

    try {
      const actionResult =
        await verifyPasswordRecoveryCode(
          formData,
        );

      setResult(actionResult);
    } catch (error) {
      console.error(
        "Erro ao verificar código:",
        error,
      );

      setResult({
        message:
          "Não foi possível verificar o código. Tente novamente.",
        invalidFields: [],
        success: false,
      });

      setPending(false);
    }
  }

  function returnToEmailStep() {
    setStep("email");
    setResult(null);

    window.history.replaceState(
      null,
      "",
      "/recuperar-senha",
    );
  }

  if (step === "code") {
    return (
      <>
        <div className="text-center">
          <h1 className="mt-5 text-3xl font-extrabold">
            Digite o código
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Enviamos um código de 8 números
            para o seu e-mail.
          </p>
        </div>

        {result?.message && (
          <div
            role="alert"
            className={`mt-6 rounded-xl border p-4 text-sm ${
              result.success
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                : "border-red-400/30 bg-red-400/10 text-red-300"
            }`}
          >
            {result.message}
          </div>
        )}

        <form
          onSubmit={
            handleCodeSubmit
          }
          className="mt-7 space-y-5"
          aria-busy={pending}
        >
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-300">
              E-mail
            </span>

            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(
                  event.target.value,
                );
              }}
              placeholder="voce@email.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-lime-400"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-300">
              Código de recuperação
            </span>

            <input
              name="token"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              minLength={8}
              maxLength={8}
              pattern="[0-9]{8}"
              placeholder="00000000"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-center text-2xl font-extrabold tracking-[0.2em] sm:tracking-[0.35em] outline-none transition focus:border-lime-400"
            />
          </label>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-lime-400 px-5 py-3 font-extrabold text-slate-950 transition hover:bg-lime-300 disabled:cursor-wait disabled:opacity-60"
          >
            {pending
              ? "Verificando..."
              : "Continuar"}
          </button>
        </form>

        <button
          type="button"
          onClick={
            returnToEmailStep
          }
          disabled={pending}
          className="mt-5 w-full text-center text-sm font-bold text-lime-400 transition hover:text-lime-300 disabled:opacity-50"
        >
          Enviar um novo código
        </button>
      </>
    );
  }

  return (
    <>
      <div className="text-center">
        <h1 className="mt-5 text-3xl font-extrabold">
          Recuperar senha
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Informe o e-mail utilizado no
          cadastro. Enviaremos um código
          para você definir uma nova senha.
        </p>
      </div>

      {result?.message && (
        <div
          role="alert"
          className={`mt-6 rounded-xl border p-4 text-sm ${
            result.success
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
              : "border-red-400/30 bg-red-400/10 text-red-300"
          }`}
        >
          {result.message}
        </div>
      )}

      <form
        onSubmit={
          handleEmailSubmit
        }
        className="mt-7 space-y-5"
        aria-busy={pending}
      >
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-300">
            E-mail
          </span>

          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(
                event.target.value,
              );
            }}
            placeholder="voce@email.com"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-lime-400"
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-lime-400 px-5 py-3 font-extrabold text-slate-950 transition hover:bg-lime-300 disabled:cursor-wait disabled:opacity-60"
        >
          {pending
            ? "Enviando..."
            : "Enviar código"}
        </button>
      </form>
    </>
  );
}