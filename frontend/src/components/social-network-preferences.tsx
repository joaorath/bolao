"use client";

import {
  useState,
} from "react";

type SocialNetwork =
  | "INSTAGRAM"
  | "YOUTUBE"
  | "TIKTOK"
  | "FACEBOOK";

const socialNetworks: Array<{
  value: SocialNetwork;
  label: string;
  description: string;
  href: string;
}> = [
  {
    value: "INSTAGRAM",
    label: "Instagram",
    description: "@varandaesportes",
    href: "https://www.instagram.com/varandaesportes/",
  },
  {
    value: "YOUTUBE",
    label: "YouTube",
    description: "@varandaesportes",
    href: "https://www.youtube.com/@varandaesportes",
  },
  {
    value: "TIKTOK",
    label: "TikTok",
    description: "@varandaesportes",
    href: "https://www.tiktok.com/@varandaesportes",
  },
  {
    value: "FACEBOOK",
    label: "Facebook",
    description: "Varanda Esportes",
    href: "https://web.facebook.com/people/Varanda-Esportes/61590206551869/",
  },
];

type SocialNetworkPreferencesProps = {
  initialNetworks?: string[];
  initialAnswered?: boolean;
};

export function SocialNetworkPreferences({
  initialNetworks = [],
  initialAnswered = false,
}: SocialNetworkPreferencesProps) {
  const validInitialNetworks =
    socialNetworks
      .map((network) => network.value)
      .filter((network) =>
        initialNetworks.includes(network),
      );

  const [
    selectedNetworks,
    setSelectedNetworks,
  ] = useState<SocialNetwork[]>(
    validInitialNetworks,
  );

  const [
    prefersNotToAnswer,
    setPrefersNotToAnswer,
  ] = useState(!initialAnswered);

  function toggleNetwork(
    network: SocialNetwork,
  ) {
    setPrefersNotToAnswer(false);

    setSelectedNetworks(
      (currentNetworks) =>
        currentNetworks.includes(network)
          ? currentNetworks.filter(
              (currentNetwork) =>
                currentNetwork !== network,
            )
          : [
              ...currentNetworks,
              network,
            ],
    );
  }

  function handleNotAnswered(
    checked: boolean,
  ) {
    setPrefersNotToAnswer(checked);

    if (checked) {
      setSelectedNetworks([]);
    }
  }

  return (
    <fieldset>
      <legend className="text-lg font-extrabold">
        Redes do Varanda Esportes
      </legend>

      <p className="mt-1 text-sm text-slate-400">
        Marque as redes que você já segue.
        A resposta é opcional e não impede
        sua participação.
      </p>

      <input
        type="hidden"
        name="socialFollowingAnswered"
        value={
          prefersNotToAnswer
            ? "false"
            : "true"
        }
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {socialNetworks.map((network) => {
          const checked =
            selectedNetworks.includes(
              network.value,
            );

          return (
            <div
              key={network.value}
              className={`rounded-xl border p-4 transition ${
                checked
                  ? "border-lime-400 bg-lime-400/5"
                  : "border-slate-700 bg-slate-950/50 hover:border-slate-500"
              }`}
            >
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  name="followedSocialNetworks"
                  type="checkbox"
                  value={network.value}
                  checked={checked}
                  onChange={() =>
                    toggleNetwork(
                      network.value,
                    )
                  }
                  className="mt-1 h-4 w-4 accent-lime-400"
                />

                <span className="min-w-0">
                  <strong className="block text-sm text-white">
                    {network.label}
                  </strong>

                  <span className="mt-1 block truncate text-xs text-slate-500">
                    {network.description}
                  </span>
                </span>
              </label>

              <a
                href={network.href}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-xs font-bold text-lime-400 transition hover:text-lime-300"
              >
                Abrir perfil oficial
              </a>
            </div>
          );
        })}
      </div>

      <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-700 bg-slate-950/50 p-4 transition hover:border-slate-500">
        <input
          type="checkbox"
          checked={prefersNotToAnswer}
          onChange={(event) =>
            handleNotAnswered(
              event.target.checked,
            )
          }
          className="mt-1 h-4 w-4 accent-lime-400"
        />

        <span>
          <strong className="block text-sm text-white">
            Prefiro não responder
          </strong>

          <span className="mt-1 block text-xs text-slate-500">
            Você poderá informar isso
            depois no seu perfil.
          </span>
        </span>
      </label>

      {!prefersNotToAnswer &&
        selectedNetworks.length === 0 && (
          <p className="mt-3 text-xs text-slate-500">
            Nenhuma rede marcada:
            registraremos que você ainda
            não segue o Varanda Esportes.
          </p>
        )}
    </fieldset>
  );
}