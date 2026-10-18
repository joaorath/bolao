"use client";

import {
  type FormEvent,
  type ReactNode,
  useRef,
  useState,
} from "react";

import type { AuthActionResult } from "@/app/auth/actions";

type PersistentAuthFormProps = {
  action: (
    formData: FormData,
  ) => Promise<AuthActionResult>;
  children: ReactNode;
  className?: string;
  sensitiveFields?: string[];
};

export function PersistentAuthForm({
  action,
  children,
  className,
  sensitiveFields = [],
}: PersistentAuthFormProps) {
  const formRef =
    useRef<HTMLFormElement>(null);

  const [result, setResult] =
    useState<AuthActionResult | null>(
      null,
    );

  const [pending, setPending] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (pending) {
      return;
    }

    const form = event.currentTarget;
    const submitButtons = Array.from(
      form.querySelectorAll<HTMLButtonElement>(
        'button[type="submit"]',
      ),
    );

    setPending(true);
    setResult(null);

    submitButtons.forEach((button) => {
      button.disabled = true;
    });

    try {
      const actionResult = await action(
        new FormData(form),
      );

      setResult(actionResult);

      sensitiveFields.forEach(
        (fieldName) => {
          const field =
            form.elements.namedItem(
              fieldName,
            );

          if (
            field instanceof
            HTMLInputElement
          ) {
            field.value = "";
          }
        },
      );

      const firstInvalidField =
        actionResult.invalidFields[0];

      if (firstInvalidField) {
        window.requestAnimationFrame(
          () => {
            const field =
              form.elements.namedItem(
                firstInvalidField,
              );

            if (
              field instanceof
                HTMLInputElement ||
              field instanceof
                HTMLSelectElement
            ) {
              field.focus();
            }
          },
        );
      }
    } catch (error) {
      console.error(
        "Erro ao enviar formulário:",
        error,
      );

      setResult({
        message:
          "Não foi possível concluir a operação. Tente novamente.",
        invalidFields: [],
      });

      sensitiveFields.forEach(
        (fieldName) => {
          const field =
            form.elements.namedItem(
              fieldName,
            );

          if (
            field instanceof
            HTMLInputElement
          ) {
            field.value = "";
          }
        },
      );
    } finally {
      setPending(false);

      submitButtons.forEach((button) => {
        button.disabled = false;
      });
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={className}
      aria-busy={pending}
    >
      {result?.message && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300"
        >
          {result.message}
        </div>
      )}

      {children}

      {pending && (
        <p
          role="status"
          className="mt-3 text-center text-sm text-slate-400"
        >
          Enviando...
        </p>
      )}
    </form>
  );
}