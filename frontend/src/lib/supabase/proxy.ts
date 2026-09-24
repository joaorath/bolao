import { createServerClient } from "@supabase/ssr";

import {
  NextResponse,
  type NextRequest,
} from "next/server";

function copySessionToResponse(
  source: NextResponse,
  destination: NextResponse,
) {
  source.cookies.getAll().forEach((cookie) => {
    destination.cookies.set(cookie);
  });

  const cacheHeaders = [
    "cache-control",
    "expires",
    "pragma",
  ];

  cacheHeaders.forEach((header) => {
    const value = source.headers.get(header);

    if (value) {
      destination.headers.set(
        header,
        value,
      );
    }
  });

  return destination;
}

export async function updateSession(
  request: NextRequest,
) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env
      .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value }) => {
              request.cookies.set(
                name,
                value,
              );
            },
          );

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(
            ({
              name,
              value,
              options,
            }) => {
              supabaseResponse.cookies.set(
                name,
                value,
                options,
              );
            },
          );
        },
      },
    },
  );

  const { data } =
    await supabase.auth.getClaims();

  const isAuthenticated = Boolean(
    data?.claims?.sub,
  );

  const pathname = request.nextUrl.pathname;

  const isPublicAuthRoute =
    pathname === "/login" ||
    pathname === "/cadastro" ||
    pathname.startsWith("/auth/");

  if (
    !isAuthenticated &&
    !isPublicAuthRoute
  ) {
    const loginUrl = request.nextUrl.clone();

    loginUrl.pathname = "/login";
    loginUrl.search = "";

    return copySessionToResponse(
      supabaseResponse,
      NextResponse.redirect(loginUrl),
    );
  }

  if (
    isAuthenticated &&
    (pathname === "/login" ||
      pathname === "/cadastro")
  ) {
    const homeUrl = request.nextUrl.clone();

    homeUrl.pathname = "/";
    homeUrl.search = "";

    return copySessionToResponse(
      supabaseResponse,
      NextResponse.redirect(homeUrl),
    );
  }

  return supabaseResponse;
}