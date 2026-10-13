"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { logout } from "@/app/auth/actions";
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
    href: "/conta",
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

      const { data, error } = await supabase
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
  const [liveMatchesCount, setLiveMatchesCount] =
    useState(0);

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

      setLiveMatchesCount(count ?? 0);
    }, []);

  useEffect(() => {
    loadLiveMatchesCount();

    const interval = window.setInterval(
      loadLiveMatchesCount,
      10000,
    );

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
          loadLiveMatchesCount();
        },
      )
      .subscribe();

    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        loadLiveMatchesCount();
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      window.clearInterval(interval);

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );

      supabase.removeChannel(channel);
    };
  }, [loadLiveMatchesCount]);

  return liveMatchesCount;
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

  const visibleItems =
    getVisibleNavigationItems(isAdmin);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-800 bg-[#091a28] px-5 py-7 lg:flex">
      <Link
        href="/palpites"
        className="flex items-center gap-3"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-400 text-sm font-black text-slate-950">
          CL
        </span>

        <div>
          <strong className="block text-base font-extrabold">
            Charqueons
          </strong>

          <span className="text-[10px] font-bold tracking-[0.25em] text-lime-400">
            LEAGUE
          </span>
        </div>
      </Link>

      <nav className="mt-12 space-y-2">
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

      <div className="mt-auto rounded-2xl border border-slate-800 bg-[#102738] p-4">
        <span className="text-[10px] font-bold tracking-wider text-slate-500">
          TEMPORADA 2026
        </span>

        <strong className="mt-2 block text-sm">
          Campeonato Paraense
        </strong>

        <div className="mt-4 flex justify-between text-xs text-slate-400">
          <span>Rodada 4 de 8</span>
          <span>50%</span>
        </div>

        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-700">
          <div className="h-full w-1/2 rounded-full bg-lime-400" />
        </div>
      </div>

      <Link
        href="/conta"
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

      <form action={logout} className="mt-2">
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
  const active = useActiveRoute(href);

  const isLiveItem =
    href === "/ao-vivo";

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
        active
          ? "bg-slate-800 text-white shadow-[inset_3px_0_0_#a3e635]"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <span
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
          <span className="ml-auto min-w-6 rounded-full bg-red-500 px-2 py-0.5 text-center text-[10px] text-white">
            {liveMatchesCount > 99
              ? "99+"
              : liveMatchesCount}
          </span>
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
  const active = useActiveRoute(href);

  const isLiveItem =
    href === "/ao-vivo";

  return (
    <Link
      href={href}
      className={`relative flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[9px] font-bold sm:text-[10px] ${
        active
          ? "text-lime-400"
          : "text-slate-500"
      }`}
    >
      <span
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
    </Link>
  );
}