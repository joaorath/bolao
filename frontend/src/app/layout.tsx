import type {
  Metadata,
  Viewport,
} from "next";

import type {
  ReactNode,
} from "react";

import {
  AppShell,
} from "@/components/app-shell";

import {
  DemoStoreProvider,
} from "@/contexts/demo-store";

import {
  createClient,
} from "@/lib/supabase/server";

import "./globals.css";

const SITE_NAME =
  "Charqueons League";

const SITE_DESCRIPTION =
  "Bolão de futebol com palpites, partidas ao vivo, rankings e disputas entre amigos.";

function getMetadataBase() {
  const configuredUrl =
    process.env
      .NEXT_PUBLIC_SITE_URL;

  if (configuredUrl) {
    try {
      return new URL(
        configuredUrl,
      );
    } catch {
      console.error(
        "NEXT_PUBLIC_SITE_URL inválida:",
        configuredUrl,
      );
    }
  }

  return new URL(
    "https://charqueons-league.netlify.app",
  );
}

export const metadata: Metadata = {
  metadataBase:
    getMetadataBase(),

  applicationName:
    SITE_NAME,

  title: {
    default:
      SITE_NAME,
    template:
      `%s | ${SITE_NAME}`,
  },

  description:
    SITE_DESCRIPTION,

  keywords: [
    "Charqueons League",
    "bolão de futebol",
    "palpites de futebol",
    "ranking de futebol",
    "Campeonato Paraense",
    "Série B",
  ],

  authors: [
    {
      name:
        "Charqueons League",
    },
  ],

  creator:
    "Charqueons League",

  publisher:
    "Charqueons League",

  category:
    "sports",

  manifest:
    "/manifest.webmanifest",

  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName:
      SITE_NAME,
    title:
      SITE_NAME,
    description:
      SITE_DESCRIPTION,
  },

  twitter: {
    card:
      "summary_large_image",
    title:
      SITE_NAME,
    description:
      SITE_DESCRIPTION,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview":
        "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  icons: {
    icon: [
      {
        url: "/icon.png",
        type: "image/png",
      },
    ],

    shortcut:
      "/icon.png",

    apple:
      "/icon.png",
  },

  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  themeColor:
    "#071421",

  colorScheme:
    "dark",

  width:
    "device-width",

  initialScale: 1,
};

type RootLayoutProps = {
  children: ReactNode;
};

function createInitials(
  name: string,
) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part
        .charAt(0)
        .toUpperCase(),
    )
    .join("");
}

export default async function RootLayout({
  children,
}: RootLayoutProps) {
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  let shellUser = null;

  if (user) {
    const {
      data: profile,
    } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const metadataName =
      typeof user
        .user_metadata
        ?.full_name ===
      "string"
        ? user
            .user_metadata
            .full_name
        : null;

    const emailName =
      user.email?.split(
        "@",
      )[0] ??
      "Participante";

    const fullName =
      profile?.full_name ??
      metadataName ??
      emailName;

    shellUser = {
      fullName,
      email:
        user.email ?? "",
      initials:
        createInitials(
          fullName,
        ) || "CL",
    };
  }

  return (
    <html lang="pt-BR">
      <body>
        <DemoStoreProvider>
          <AppShell
            user={shellUser}
          >
            {children}
          </AppShell>
        </DemoStoreProvider>
      </body>
    </html>
  );
}