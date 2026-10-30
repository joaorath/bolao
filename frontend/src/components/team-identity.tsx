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
  variant?:
    | "compact"
    | "default"
    | "large";
};

export function TeamIdentity({
  abbreviation,
  name,
  logoUrl,
  align = "left",
  variant = "default",
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

  const crestClassName =
    variant === "large"
      ? "h-14 w-14 sm:h-16 sm:w-16"
      : variant === "compact"
        ? "h-8 w-8"
        : "h-10 w-10";

  const imageSizes =
    variant === "large"
      ? "64px"
      : variant === "compact"
        ? "32px"
        : "40px";

  const crest = (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-white/95 shadow-sm ${crestClassName}`}
    >
      {showLogo ? (
        <Image
          src={logoUrl!}
          alt={`Escudo do ${name}`}
          fill
          sizes={imageSizes}
          unoptimized
          className="object-contain p-1"
          onError={() => {
            setImageFailed(true);
          }}
        />
      ) : (
        <span
          className={`px-1 text-center font-extrabold text-slate-800 ${
            variant === "large"
              ? "text-sm sm:text-base"
              : "text-[10px]"
          }`}
          title={name}
        >
          {abbreviation}
        </span>
      )}
    </span>
  );

  if (variant === "large") {
    return (
      <div className="min-w-0 text-center">
        <span className="flex justify-center">
          {crest}
        </span>

        <strong className="mt-3 block truncate text-xs sm:text-base">
          {name}
        </strong>
      </div>
    );
  }

  return (
    <div
      className={`flex min-w-0 items-center ${
        variant === "compact"
          ? "gap-1.5"
          : "gap-2"
      } ${
        rightAligned
          ? "flex-row-reverse text-right"
          : "text-left"
      }`}
    >
      {crest}

      <span className="min-w-0">
        {showLogo && (
          <strong
            className={`block ${
              variant === "compact"
                ? "text-[11px]"
                : "text-xs sm:text-sm"
            }`}
          >
            {abbreviation}
          </strong>
        )}

        <span
          className={`block truncate leading-tight text-slate-400 ${
            variant === "compact"
              ? "text-[10px]"
              : "text-[10px] sm:text-xs"
          }`}
        >
          {name}
        </span>
      </span>
    </div>
  );
}