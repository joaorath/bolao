export default async function () {
  const siteUrl =
    (
      process.env.URL ??
      process.env
        .NEXT_PUBLIC_SITE_URL ??
      ""
    ).replace(/\/+$/, "");

  const reminderSecret =
    process.env
      .PREDICTION_REMINDER_SECRET
      ?.trim();

  if (!siteUrl) {
    throw new Error(
      "A URL do site não foi configurada.",
    );
  }

  if (!reminderSecret) {
    throw new Error(
      "PREDICTION_REMINDER_SECRET não foi configurada.",
    );
  }

  const response =
    await fetch(
      `${siteUrl}/api/cron/prediction-reminders`,
      {
        method: "POST",

        headers: {
          authorization:
            `Bearer ${reminderSecret}`,

          accept:
            "application/json",
        },
      },
    );

  const responseBody =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `O cron de lembretes respondeu com ${response.status}: ${
        responseBody.slice(0, 1000)
      }`,
    );
  }

  console.log(
    "Resultado dos lembretes:",
    responseBody,
  );

  return new Response(
    responseBody,
    {
      status: 200,

      headers: {
        "content-type":
          "application/json; charset=utf-8",
      },
    },
  );
}

export const config = {
  schedule: "*/5 * * * *",
};