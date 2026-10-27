import {
  ImageResponse,
} from "next/og";

export const alt =
  "Charqueons League — Bolão de futebol";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType =
  "image/png";

function getPublicSiteUrl() {
  const configuredUrl =
    process.env
      .NEXT_PUBLIC_SITE_URL;

  if (
    configuredUrl?.startsWith(
      "https://",
    )
  ) {
    return configuredUrl.replace(
      /\/+$/,
      "",
    );
  }

  return "https://charqueons-league.netlify.app";
}

export default function OpenGraphImage() {
  const logoUrl =
    `${getPublicSiteUrl()}/brand/charqueons-league-square.png`;

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            "linear-gradient(135deg, #071421 0%, #0e2f35 55%, #064228 100%)",
          color: "white",
          display: "flex",
          height: "100%",
          justifyContent:
            "space-between",
          padding: "72px 84px",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            background:
              "rgba(163, 230, 53, 0.18)",
            borderRadius: 999,
            filter:
              "blur(70px)",
            height: 360,
            position: "absolute",
            right: -70,
            top: -100,
            width: 360,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection:
              "column",
            maxWidth: 760,
          }}
        >
          <span
            style={{
              color:
                "#a3e635",
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: 7,
              marginBottom: 28,
              textTransform:
                "uppercase",
            }}
          >
            Bolão de futebol
          </span>

          <h1
            style={{
              fontSize: 72,
              fontWeight: 900,
              letterSpacing: -3,
              lineHeight: 1,
              margin: 0,
            }}
          >
            Charqueons League
          </h1>

          <p
            style={{
              color:
                "#cbd5e1",
              fontSize: 31,
              lineHeight: 1.35,
              margin:
                "30px 0 0",
              maxWidth: 700,
            }}
          >
            Palpites, partidas ao vivo,
            rankings e disputas entre
            amigos.
          </p>

          <div
            style={{
              alignItems:
                "center",
              display: "flex",
              gap: 18,
              marginTop: 44,
            }}
          >
            <span
              style={{
                background:
                  "#a3e635",
                borderRadius: 999,
                color:
                  "#071421",
                fontSize: 21,
                fontWeight: 900,
                padding:
                  "13px 24px",
              }}
            >
              +5 PLACAR EXATO
            </span>

            <span
              style={{
                border:
                  "2px solid rgba(255,255,255,0.2)",
                borderRadius: 999,
                color:
                  "#e2e8f0",
                fontSize: 21,
                fontWeight: 800,
                padding:
                  "11px 22px",
              }}
            >
              +3 RESULTADO
            </span>
          </div>
        </div>

        <div
          style={{
            alignItems: "center",
            background:
              "rgba(7, 20, 33, 0.65)",
            border:
              "2px solid rgba(163, 230, 53, 0.35)",
            borderRadius: 48,
            boxShadow:
              "0 30px 80px rgba(0,0,0,0.35)",
            display: "flex",
            height: 270,
            justifyContent:
              "center",
            padding: 24,
            width: 270,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt=""
            width={220}
            height={220}
            style={{
              borderRadius: 36,
              objectFit:
                "cover",
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}