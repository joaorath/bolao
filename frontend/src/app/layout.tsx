import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { DemoStoreProvider } from "@/contexts/demo-store";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Charqueons League",
    template: "%s | Charqueons League",
  },
  description:
    "Bolão digital do Campeonato Paraense.",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html lang="pt-BR">
      <body>
        <DemoStoreProvider>
          <AppShell>{children}</AppShell>
        </DemoStoreProvider>
      </body>
    </html>
  );
}