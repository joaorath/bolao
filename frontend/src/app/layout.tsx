import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { DemoStoreProvider } from "@/contexts/demo-store";
import { createClient } from "@/lib/supabase/server";

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

function createInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default async function RootLayout({
  children,
}: RootLayoutProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let shellUser = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const metadataName =
      typeof user.user_metadata?.full_name ===
      "string"
        ? user.user_metadata.full_name
        : null;

    const emailName =
      user.email?.split("@")[0] ??
      "Participante";

    const fullName =
      profile?.full_name ??
      metadataName ??
      emailName;

    shellUser = {
      fullName,
      email: user.email ?? "",
      initials:
        createInitials(fullName) || "CL",
    };
  }

  return (
    <html lang="pt-BR">
      <body>
        <DemoStoreProvider>
          <AppShell user={shellUser}>
            {children}
          </AppShell>
        </DemoStoreProvider>
      </body>
    </html>
  );
}