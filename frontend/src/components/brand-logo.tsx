import Image from "next/image";

type BrandLogoVariant =
  | "auth"
  | "sidebar"
  | "header"
  | "pool";

type BrandLogoProps = {
  variant?: BrandLogoVariant;
};

export function BrandLogo({
  variant = "auth",
}: BrandLogoProps) {
  const showText =
    variant === "sidebar" ||
    variant === "header";

  const imageSizeClasses = {
    auth: "h-28 w-28 rounded-3xl sm:h-32 sm:w-32",
    sidebar: "h-14 w-14 rounded-2xl",
    header: "h-11 w-11 rounded-xl",
    pool: "h-12 w-12 rounded-xl",
  };

  const imageSizes = {
    auth:
      "(max-width: 640px) 112px, 128px",
    sidebar: "56px",
    header: "44px",
    pool: "48px",
  };

  return (
    <span
      className={
        showText
          ? "inline-flex items-center gap-3"
          : "inline-flex"
      }
    >
      <span
        className={`relative shrink-0 overflow-hidden border border-amber-500/25 bg-[#064228] shadow-lg ${imageSizeClasses[variant]}`}
      >
        <Image
          src="/brand/charqueons-league-square.png"
          alt="Logo da Charqueons League"
          fill
          priority={
            variant === "auth" ||
            variant === "header"
          }
          sizes={imageSizes[variant]}
          className="object-cover"
          loading="eager"
        />
      </span>

      {showText && (
        <span className="min-w-0">
          <strong className="block truncate text-sm font-extrabold sm:text-base">
            Charqueons
          </strong>

          <span className="hidden text-[10px] font-bold tracking-[0.25em] text-lime-400 min-[370px]:block">
            LEAGUE
          </span>
        </span>
      )}
    </span>
  );
}