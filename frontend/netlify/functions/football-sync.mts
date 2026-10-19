async function footballSync() {
  const siteUrl =
    process.env.URL;

  const secret =
    process.env.FOOTBALL_SYNC_SECRET;

  if (!siteUrl) {
    throw new Error(
      "URL do site não foi disponibilizada pela Netlify.",
    );
  }

  if (!secret) {
    throw new Error(
      "FOOTBALL_SYNC_SECRET não foi configurado.",
    );
  }

  const response = await fetch(
    `${siteUrl}/api/cron/football-sync`,
    {
      method: "POST",
      headers: {
        Authorization:
          `Bearer ${secret}`,
      },
    },
  );

  const responseBody =
    await response.text();

  console.log(
    "Resultado da sincronização:",
    response.status,
    responseBody.slice(0, 2000),
  );

  if (!response.ok) {
    throw new Error(
      `Sincronização respondeu com status ${response.status}.`,
    );
  }
}

export default footballSync;

export const config = {
  schedule: "*/5 * * * *",
};