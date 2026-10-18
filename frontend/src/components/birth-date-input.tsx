"use client";

import { useState } from "react";

import { formatBirthDateInput } from "@/lib/birth-date";

type BirthDateInputProps = {
  defaultValue?: string;
};

export function BirthDateInput({
  defaultValue = "",
}: BirthDateInputProps) {
  const [value, setValue] = useState(() =>
    formatBirthDateInput(defaultValue),
  );

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-950 transition focus-within:border-lime-400">
      <input
        name="birthDate"
        type="text"
        inputMode="numeric"
        autoComplete="bday"
        required
        maxLength={10}
        pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}"
        title="Informe a data no formato DD/MM/AAAA"
        placeholder="DD/MM/AAAA"
        value={value}
        onChange={(event) => {
          setValue(
            formatBirthDateInput(
              event.target.value,
            ),
          );
        }}
        className="block w-full min-w-0 max-w-full bg-transparent px-4 py-3 outline-none [box-sizing:border-box]"
      />
    </div>
  );
}