"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  {
    href: "/",
    label: "Início",
    icon: "⌂",
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
    icon: "♜",
  },
  {
    href: "/perfil",
    label: "Perfil",
    icon: "◉",
  },
];

function useActiveRoute(href: string) {
  const pathname = usePathname();

  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-800 bg-[#091a28] px-5 py-7 lg:flex">
      <Link
        href="/"
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
        {navigationItems.map((item) => (
          <SidebarLink
            key={item.href}
            {...item}
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
        href="/perfil"
        className="mt-5 flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-800"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-900 text-xs font-bold">
          JR
        </span>

        <div>
          <strong className="block text-sm">
            João Rath
          </strong>

          <span className="text-xs text-slate-500">
            Conta demonstração
          </span>
        </div>
      </Link>
    </aside>
  );
}

type SidebarLinkProps = {
  href: string;
  label: string;
  icon: string;
};

function SidebarLink({
  href,
  label,
  icon,
}: SidebarLinkProps) {
  const active = useActiveRoute(href);

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
          label === "Ao vivo"
            ? "text-red-500"
            : ""
        }
      >
        {icon}
      </span>

      {label}

      {label === "Ao vivo" && (
        <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[10px] text-white">
          1
        </span>
      )}
    </Link>
  );
}

export function MobileNavigation() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 grid h-20 grid-cols-5 border-t border-slate-800 bg-[#091a28]/95 backdrop-blur lg:hidden">
      {navigationItems.map((item) => (
        <MobileLink
          key={item.href}
          {...item}
        />
      ))}
    </nav>
  );
}

function MobileLink({
  href,
  label,
  icon,
}: SidebarLinkProps) {
  const active = useActiveRoute(href);

  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold ${
        active
          ? "text-lime-400"
          : "text-slate-500"
      }`}
    >
      <span
        className={`text-lg ${
          label === "Ao vivo"
            ? "text-red-500"
            : ""
        }`}
      >
        {icon}
      </span>

      {label}
    </Link>
  );
}