"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { logout } from "@/app/auth/actions";
import { BrandLogo } from "@/components/brand-logo";
import { createClient } from "@/lib/supabase/client";

export type NavigationUser = {
  fullName: string;
  email: string;
  initials: string;
};

type NavigationUserProps = {
  user: NavigationUser | null;
};

type NavigationItem = {
  href: string;
  label: string;
  mobileLabel?: string;
  icon: string;
  adminOnly?: boolean;
};

type SeasonState =
  | "loading"
  | "waiting"
  | "upcoming"
  | "live";

type SeasonSummary = {
  state: SeasonState;
  round: number | null;
  nextMatchAt: string | null;
};

type SeasonMatchRow = {
  round: number;
  starts_at: string;
  status: string;
};

const navigationItems: NavigationItem[] = [
  {
    href: "/palpites",
    label: "Palpites",
    icon: "🎯",
  },
  {
    href: "/boloes",
    label: "Bolões",
    icon: "⚽",
  },
  {
    href: "/ao-vivo",
    label: "Ao vivo",
    icon: "●",
  },
  {
    href: "/ranking",
    label: "Ranking",
    icon: "🏆",
  },
  {
    href: "/admin/partidas",
    label: "Administração",
    mobileLabel: "Admin",
    icon: "⚙️",
    adminOnly: true,
  },
  {
    href: "/perfil",
    label: "Perfil",
    icon: "👤",
  },
];

function useActiveRoute(href: string) {
  const pathname = usePathname();

  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

function useIsAdmin() {
  const [isAdmin, setIsAdmin] =
    useState(false);

  useEffect(() => {
    async function checkAdministrator() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data, error } =
        await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .maybeSingle();

      if (error) {
        console.error(
          "Erro ao verificar administrador:",
          error,
        );

        setIsAdmin(false);
        return;
      }

      setIsAdmin(
        Boolean(data?.is_admin),
      );
    }

    checkAdministrator();
  }, []);

  return isAdmin;
}

function useLiveMatchesCount() {
  const [
    liveMatchesCount,
    setLiveMatchesCount,
  ] = useState(0);

  const loadLiveMatchesCount =
    useCallback(async () => {
      const supabase = createClient();

      const {
        count,
        error,
      } = await supabase
        .from("matches")
        .select("id", {
          count: "exact",
          head: true,
        })
        .in("status", [
          "LIVE",
          "HALFTIME",
        ]);

      if (error) {
        console.error(
          "Erro ao contar partidas ao vivo:",
          error,
        );

        return;
      }

      setLiveMatchesCount(
        count ?? 0,
      );
    }, []);

  useEffect(() => {
    const initialTimeout =
      window.setTimeout(() => {
        void loadLiveMatchesCount();
      }, 0);

    const interval =
      window.setInterval(() => {
        void loadLiveMatchesCount();
      }, 10_000);

    const supabase = createClient();

    const channel = supabase
      .channel(
        `navigation-live-matches-${Math.random()}`,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "matches",
        },
        () => {
          void loadLiveMatchesCount();
        },
      )
      .subscribe();

    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void loadLiveMatchesCount();
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      window.clearTimeout(
        initialTimeout,
      );

      window.clearInterval(
        interval,
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );

      void supabase.removeChannel(
        channel,
      );
    };
  }, [loadLiveMatchesCount]);

  return liveMatchesCount;
}

function useParaenseSeasonSummary() {
  const [
    season,
    setSeason,
  ] = useState<SeasonSummary>({
    state: "loading",
    round: null,
    nextMatchAt: null,
  });

  const loadSeason =
    useCallback(async () => {
      const supabase =
        createClient();

      const {
        data,
        error,
      } = await supabase
        .from("matches")
        .select(`
          round,
          starts_at,
          status
        `)
        .eq(
          "competition",
          "Campeonato Paraense",
        )
        .in("status", [
          "SCHEDULED",
          "OPEN",
          "LIVE",
          "HALFTIME",
        ])
        .order("starts_at", {
          ascending: true,
        });

      if (error) {
        console.error(
          "Erro ao carregar temporada:",
          error,
        );

        setSeason({
          state: "waiting",
          round: null,
          nextMatchAt: null,
        });

        return;
      }

      const matches =
        (data ??
          []) as SeasonMatchRow[];

      const liveMatch =
        matches.find(
          (match) =>
            match.status === "LIVE" ||
            match.status === "HALFTIME",
        );

      if (liveMatch) {
        setSeason({
          state: "live",
          round: liveMatch.round,
          nextMatchAt:
            liveMatch.starts_at,
        });

        return;
      }

      const currentTimestamp =
        Date.now();

      const nextMatch =
        matches.find(
          (match) => {
            const startsAt =
              new Date(
                match.starts_at,
              ).getTime();

            return (
              Number.isFinite(startsAt) &&
              startsAt >
                currentTimestamp
            );
          },
        );

      if (nextMatch) {
        setSeason({
          state: "upcoming",
          round: nextMatch.round,
          nextMatchAt:
            nextMatch.starts_at,
        });

        return;
      }

      setSeason({
        state: "waiting",
        round: null,
        nextMatchAt: null,
      });
    }, []);

  useEffect(() => {
    const initialTimeout =
      window.setTimeout(() => {
        void loadSeason();
      }, 0);

    const interval =
      window.setInterval(() => {
        void loadSeason();
      }, 60_000);

    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void loadSeason();
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      window.clearTimeout(
        initialTimeout,
      );

      window.clearInterval(
        interval,
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [loadSeason]);

  return season;
}

function getVisibleNavigationItems(
  isAdmin: boolean,
) {
  return navigationItems.filter(
    (item) =>
      !item.adminOnly || isAdmin,
  );
}

export function Sidebar({
  user,
}: NavigationUserProps) {
  const isAdmin = useIsAdmin();

  const liveMatchesCount =
    useLiveMatchesCount();

  const season =
    useParaenseSeasonSummary();

  const visibleItems =
    getVisibleNavigationItems(isAdmin);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-800 bg-[#091a28] px-5 py-7 lg:flex">
      <Link
        href="/palpites"
        aria-label="Ir para a página de palpites"
        className="inline-flex"
      >
        <BrandLogo variant="sidebar" />
      </Link>

      <nav aria-label="Navegação principal" className="mt-12 space-y-2">
        {visibleItems.map((item) => (
          <SidebarLink
            key={item.href}
            {...item}
            liveMatchesCount={
              liveMatchesCount
            }
          />
        ))}
      </nav>

      <SeasonCard season={season} />

      <Link
        href="/perfil"
        aria-label="Abrir perfil"
        className="mt-5 flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-800"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-900 text-xs font-bold">
          {user?.initials ?? "CL"}
        </span>

        <div className="min-w-0">
          <strong className="block truncate text-sm">
            {user?.fullName ??
              "Participante"}
          </strong>

          <span className="block truncate text-xs text-slate-500">
            {user?.email ??
              "Conta conectada"}
          </span>
        </div>
      </Link>

      <form
        action={logout}
        className="mt-2"
      >
        <button
          type="submit"
          className="w-full rounded-xl border border-red-400/20 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-400/10"
        >
          Sair da conta
        </button>
      </form>
    </aside>
  );
}

function SeasonCard({
  season,
}: {
  season: SeasonSummary;
}) {
  if (season.state === "loading") {
    return (
      <section
        aria-label="Situação da temporada"
        className="mt-auto rounded-2xl border border-slate-800 bg-[#102738] p-4"
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Temporada
        </span>

        <p className="mt-3 text-xs text-slate-400">
          Carregando calendário...
        </p>
      </section>
    );
  }

  if (
    season.state === "live"
  ) {
    return (
      <section
        aria-label="Situação da temporada"
        className="mt-auto rounded-2xl border border-red-400/20 bg-red-400/5 p-4"
      >
        <span className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-red-400">
          <span
            aria-hidden="true"
            className="h-2 w-2 animate-pulse rounded-full bg-red-400"
          />

          Temporada atual
        </span>

        <strong className="mt-2 block text-sm">
          Campeonato Paraense
        </strong>

        <p className="mt-3 text-xs font-bold text-red-300">
          Rodada {season.round} em andamento
        </p>
      </section>
    );
  }

  if (
    season.state === "upcoming" &&
    season.nextMatchAt
  ) {
    const nextMatchDate =
      new Intl.DateTimeFormat(
        "pt-BR",
        {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          timeZone:
            "America/Belem",
        },
      ).format(
        new Date(
          season.nextMatchAt,
        ),
      );

    return (
      <section
        aria-label="Situação da temporada"
        className="mt-auto rounded-2xl border border-lime-400/20 bg-lime-400/5 p-4"
      >
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-lime-400">
          Próxima rodada
        </span>

        <strong className="mt-2 block text-sm">
          Campeonato Paraense
        </strong>

        <p className="mt-3 text-xs text-slate-300">
          Rodada {season.round}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Primeiro jogo em{" "}
          {nextMatchDate}
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Situação da temporada"
      className="mt-auto rounded-2xl border border-slate-800 bg-[#102738] p-4"
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Próxima temporada
      </span>

      <strong className="mt-2 block text-sm">
        Campeonato Paraense
      </strong>

      <p className="mt-3 text-xs leading-5 text-slate-400">
        Aguardando divulgação das partidas.
      </p>
    </section>
  );
}

type NavigationLinkProps =
  NavigationItem & {
    liveMatchesCount: number;
  };

function SidebarLink({
  href,
  label,
  icon,
  liveMatchesCount,
}: NavigationLinkProps) {
  const active =
    useActiveRoute(href);

  const isLiveItem =
    href === "/ao-vivo";

  return (
    <Link
      href={href}
      aria-current={
        active
          ? "page"
          : undefined
      }
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
        active
          ? "bg-slate-800 text-white shadow-[inset_3px_0_0_#a3e635]"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <span
        aria-hidden="true"
        className={
          isLiveItem
            ? "text-red-500"
            : ""
        }
      >
        {icon}
      </span>

      {label}

      {isLiveItem &&
        liveMatchesCount > 0 && (
          <>
            <span
              aria-hidden="true"
              className="ml-auto min-w-6 rounded-full bg-red-500 px-2 py-0.5 text-center text-[10px] text-white"
            >
              {liveMatchesCount > 99
                ? "99+"
                : liveMatchesCount}
            </span>

            <span className="sr-only">
              {liveMatchesCount}{" "}
              {liveMatchesCount === 1
                ? "partida ao vivo"
                : "partidas ao vivo"}
            </span>
          </>
        )}
    </Link>
  );
}

export function MobileNavigation() {
  const isAdmin = useIsAdmin();

  const liveMatchesCount =
    useLiveMatchesCount();

  const visibleItems =
    getVisibleNavigationItems(isAdmin);

  return (
    <nav
      aria-label="Navegação principal para dispositivos móveis"
      className={`fixed inset-x-0 bottom-0 z-50 grid h-20 border-t border-slate-800 bg-[#091a28]/95 backdrop-blur lg:hidden ${
        isAdmin
          ? "grid-cols-6"
          : "grid-cols-5"
      }`}
    >
      {visibleItems.map((item) => (
        <MobileLink
          key={item.href}
          {...item}
          liveMatchesCount={
            liveMatchesCount
          }
        />
      ))}
    </nav>
  );
}

function MobileLink({
  href,
  label,
  mobileLabel,
  icon,
  liveMatchesCount,
}: NavigationLinkProps) {
  const active =
    useActiveRoute(href);

  const isLiveItem =
    href === "/ao-vivo";

  return (
    <Link
      href={href}
      aria-current={
        active
          ? "page"
          : undefined
      }
      className={`relative flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] font-bold transition sm:text-xs ${
        active
          ? "text-lime-400"
          : "text-slate-400 hover:text-white"
      }`}
    >
      <span
        aria-hidden="true"
        className={`relative text-lg ${
          isLiveItem
            ? "text-red-500"
            : ""
        }`}
      >
        {icon}

        {isLiveItem &&
          liveMatchesCount > 0 && (
            <span className="absolute -right-4 -top-2 min-w-5 rounded-full bg-red-500 px-1 text-center text-[9px] leading-5 text-white">
              {liveMatchesCount > 99
                ? "99+"
                : liveMatchesCount}
            </span>
          )}
      </span>

      <span className="max-w-full truncate">
        {mobileLabel ?? label}
      </span>

      {isLiveItem &&
        liveMatchesCount > 0 && (
          <span className="sr-only">
            {liveMatchesCount}{" "}
            {liveMatchesCount === 1
              ? "partida ao vivo"
              : "partidas ao vivo"}
          </span>
        )}
    </Link>
  );
}