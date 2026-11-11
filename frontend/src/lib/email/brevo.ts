type SendPredictionReminderInput = {
  deliveryId: string;
  recipientEmail: string;
  recipientName: string;
  competition: string;
  round: number;
  startsAt: string;
  homeTeamName: string;
  awayTeamName: string;
};

type BrevoSendResponse = {
  messageId?: string;
};

function getRequiredEnvironmentVariable(
  name: string,
) {
  const value =
    process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `${name} não foi configurada.`,
    );
  }

  return value;
}

function escapeHtml(
  value: string,
) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMatchDate(
  startsAt: string,
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone: "America/Belem",
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(
    new Date(startsAt),
  );
}

export async function sendPredictionReminder({
  deliveryId,
  recipientEmail,
  recipientName,
  competition,
  round,
  startsAt,
  homeTeamName,
  awayTeamName,
}: SendPredictionReminderInput) {
  const apiKey =
    getRequiredEnvironmentVariable(
      "BREVO_API_KEY",
    );

  const senderEmail =
    getRequiredEnvironmentVariable(
      "BREVO_SENDER_EMAIL",
    );

  const senderName =
    process.env.BREVO_SENDER_NAME
      ?.trim() ||
    "Charqueons League";

  const siteUrl =
    (
      process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.URL ??
      "http://localhost:3000"
    ).replace(/\/+$/, "");

  const matchDate =
    formatMatchDate(startsAt);

  const safeRecipientName =
    escapeHtml(recipientName);

  const safeCompetition =
    escapeHtml(competition);

  const safeHomeTeam =
    escapeHtml(homeTeamName);

  const safeAwayTeam =
    escapeHtml(awayTeamName);

  const predictionUrl =
    `${siteUrl}/palpites`;

  const subject =
    `Seu palpite está esperando: ${homeTeamName} x ${awayTeamName}`;

  const textContent = [
    `Olá, ${recipientName}!`,
    "",
    "A partida está prestes a começar e você ainda não registrou seu palpite no Ranking Geral.",
    "",
    `${homeTeamName} x ${awayTeamName}`,
    `${competition} · Rodada ${round}`,
    matchDate,
    "",
    `Faça seu palpite: ${predictionUrl}`,
    "",
    "Você pode desativar estes lembretes na página de perfil.",
  ].join("\n");

  const htmlContent = `
    <!doctype html>
    <html lang="pt-BR">
      <body style="margin:0;background:#071421;color:#ffffff;font-family:Arial,sans-serif;">
        <div style="padding:32px 16px;">
          <div style="max-width:600px;margin:0 auto;background:#0e2131;border:1px solid #263b4d;border-radius:20px;overflow:hidden;">
            <div style="padding:28px;background:#102b3e;border-bottom:1px solid #263b4d;">
              <div style="color:#a3e635;font-size:13px;font-weight:800;letter-spacing:2px;">
                CHARQUEONS LEAGUE
              </div>

              <h1 style="margin:14px 0 0;font-size:26px;line-height:1.25;">
                Não esqueça seu palpite
              </h1>
            </div>

            <div style="padding:28px;">
              <p style="margin:0 0 20px;color:#cbd5e1;font-size:16px;line-height:1.6;">
                Olá, <strong style="color:#ffffff;">${safeRecipientName}</strong>!
                A partida está prestes a começar e você ainda não registrou seu palpite no Ranking Geral.
              </p>

              <div style="padding:22px;background:#071421;border:1px solid #334155;border-radius:16px;text-align:center;">
                <div style="font-size:20px;font-weight:800;">
                  ${safeHomeTeam}
                  <span style="color:#64748b;"> × </span>
                  ${safeAwayTeam}
                </div>

                <div style="margin-top:10px;color:#94a3b8;font-size:14px;">
                  ${safeCompetition} · Rodada ${round}
                </div>

                <div style="margin-top:6px;color:#a3e635;font-size:14px;font-weight:700;">
                  ${escapeHtml(matchDate)}
                </div>
              </div>

              <div style="margin-top:24px;text-align:center;">
                <a
                  href="${predictionUrl}"
                  style="display:inline-block;padding:14px 24px;background:#a3e635;color:#071421;text-decoration:none;border-radius:12px;font-weight:800;"
                >
                  Fazer meu palpite
                </a>
              </div>

              <p style="margin:24px 0 0;color:#64748b;font-size:12px;line-height:1.6;text-align:center;">
                Você pode desativar estes lembretes a qualquer momento na página de perfil.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const response = await fetch(
    "https://api.brevo.com/v3/smtp/email",
    {
      method: "POST",

      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type":
          "application/json",
      },

      body: JSON.stringify({
        headers: {
            idempotencyKey:
                deliveryId,
        },
        sender: {
          name: senderName,
          email: senderEmail,
        },

        to: [
          {
            email:
              recipientEmail,
            name:
              recipientName,
          },
        ],

        subject,
        htmlContent,
        textContent,
      }),
    },
  );

  const responseBody =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `O Brevo recusou o envio (${response.status}): ${
        responseBody.slice(0, 500)
      }`,
    );
  }

  let result: BrevoSendResponse =
    {};

  if (responseBody) {
    try {
      result =
        JSON.parse(
          responseBody,
        ) as BrevoSendResponse;
    } catch {
      result = {};
    }
  }

  return {
    messageId:
      result.messageId ?? null,
  };
}