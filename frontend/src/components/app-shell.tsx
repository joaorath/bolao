import type { ReactNode } from "react";

import {
  MobileNavigation,
  Sidebar,
} from "@/components/navigation";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#071421] text-white">
      <Sidebar />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-[#071421]/95 px-5 backdrop-blur lg:hidden">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime-400 text-xs font-black text-slate-950">
              CL
            </span>

            <strong className="font-extrabold">
              Charqueons
            </strong>
          </div>

          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-900 text-xs font-bold">
            JR
          </span>
        </header>

        <main className="px-5 py-8 pb-28 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>

      <MobileNavigation />
    </div>
  );
}