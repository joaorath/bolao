"use client";

import Image from "next/image";

import {
  useEffect,
  useState,
} from "react";

type TeamIdentityProps = {
  abbreviation: string;
  name: string;
  logoUrl?: string;
  align?: "left" | "right";
};

export function TeamIdentity({
  abbreviation,
  name,
  logoUrl,
  align = "left",
}: TeamIdentityProps) {
  const [
    imageFailed,
    setImageFailed,
  ] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [logoUrl]);

  const showLogo =
    Boolean(logoUrl) &&
    !imageFailed;

  const rightAligned =
    align === "right";

  return (
    <div
      className={`flex min-w-0 items-center gap-2 ${
        rightAligned
          ? "flex-row-reverse text-right"
          : "text-left"
      }`}
    >
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-white/95 shadow-sm">
        {showLogo ? (
          <Image
            src={logoUrl!}
            alt={`Escudo do ${name}`}
            fill
            sizes="40px"
            unoptimized
            className="object-contain p-1"
            onError={() => {
              setImageFailed(true);
            }}
          />
        ) : (
          <span
            className="px-1 text-center text-[10px] font-extrabold text-slate-800"
            title={name}
          >
            {abbreviation}
          </span>
        )}
      </span>

      <span className="min-w-0">
        {showLogo && (
          <strong className="block text-xs sm:text-sm">
            {abbreviation}
          </strong>
        )}

        <span className="block truncate text-[10px] leading-tight text-slate-400 sm:text-xs">
          {name}
        </span>
      </span>
    </div>
  );
}