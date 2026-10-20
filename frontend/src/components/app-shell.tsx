"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { ReactNode } from "react";

import {
  MobileNavigation,
  Sidebar,
} from "@/components/navigation";

import type { NavigationUser } from "@/components/navigation";

type AppShellProps = {
  children: ReactNode;
  user: NavigationUser | null;
};

export function AppShell({
  children,
  user,
}: AppShellProps) {
  const pathname = usePathname();

  const isAuthenticationPage =
    pathname === "/login" ||
    pathname === "/cadastro" ||
    pathname === "/recuperar-senha" ||
    pathname === "/redefinir-senha" ||
    pathname.startsWith("/auth/");

  const isPublicLandingPage =
    pathname === "/" && !user;

  if (
    isAuthenticationPage ||
    isPublicLandingPage
  ) {
    return (
      <div className="min-h-screen bg-[#071421] text-white">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#071421] text-white">
      <Sidebar user={user} />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-[#071421]/95 px-4 backdrop-blur sm:px-5 lg:hidden">
          <Link
            href="/palpites"
            aria-label="Ir para os palpites"
            className="flex min-w-0 items-center gap-3"
          >
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-amber-500/25 bg-[#064228] shadow-lg">
              <Image
                src="/brand/charqueons-league-square.png"
                alt="Logo da Charqueons League"
                fill
                priority
                sizes="40px"
                className="object-cover"
                loading="eager"
              />
            </span>

            <strong className="truncate font-extrabold">
              Charqueons
            </strong>
          </Link>

          <Link
            href="/perfil"
            aria-label="Abrir meu perfil"
            title="Abrir meu perfil"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-900 text-xs font-bold transition hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-lime-400"
          >
            {user?.initials ?? "CL"}
          </Link>
        </header>

        <main className="px-4 py-8 pb-28 sm:px-5 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>

      <MobileNavigation />
    </div>
  );
}