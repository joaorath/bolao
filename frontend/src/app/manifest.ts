import type {
  MetadataRoute,
} from "next";

export default function manifest():
  MetadataRoute.Manifest {
  return {
    name:
      "Charqueons League",

    short_name:
      "Charqueons",

    description:
      "Bolão de futebol com palpites, partidas ao vivo, rankings e disputas entre amigos.",

    start_url:
      "/",

    scope:
      "/",

    display:
      "standalone",

    background_color:
      "#071421",

    theme_color:
      "#a3e635",

    orientation:
      "portrait-primary",

    lang:
      "pt-BR",

    categories: [
      "sports",
      "entertainment",
      "social",
    ],

    icons: [
      {
        src:
          "/brand/charqueons-league-square.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}