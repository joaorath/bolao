import type {
  Match,
  Prediction,
} from "@/types";

import {
  TeamIdentity,
} from "@/components/team-identity";

type LiveMatchCardProps = {
  match: Match;
  prediction?: Prediction | null;
};

function getOutcome(
  homeScore: number,
  awayScore: number,
) {
  if (homeScore > awayScore) {
    return "HOME_WIN";
  }

  if (homeScore < awayScore) {
    return "AWAY_WIN";
  }

  return "DRAW";
}

function calculateProjectedPoints(
  homeScore: number,
  awayScore: number,
  prediction: Prediction,
) {
  const exactScore =
    homeScore === prediction.homeScore &&
    awayScore === prediction.awayScore;

  if (exactScore) {
    return 5;
  }

  const currentOutcome = getOutcome(
    homeScore,
    awayScore,
  );

  const predictedOutcome = getOutcome(
    prediction.homeScore,
    prediction.awayScore,
  );

  return currentOutcome ===
    predictedOutcome
    ? 3
    : 0;
}

export function LiveMatchCard({
  match,
  prediction,
}: LiveMatchCardProps) {
  const homeScore =
    match.homeScore ?? 0;

  const awayScore =
    match.awayScore ?? 0;

  const projectedPoints = prediction
    ? calculateProjectedPoints(
        homeScore,
        awayScore,
        prediction,
      )
    : null;

  const halftime =
    match.status === "HALFTIME";

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-[#15334a] to-[#0b1d2b] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-xs font-extrabold text-red-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />

          {halftime
            ? "INTERVALO"
            : "AO VIVO"}
        </span>

        <strong className="text-lime-400">
          {halftime
            ? "INT"
            : "EM ANDAMENTO"}
        </strong>
      </div>

      <p className="mt-5 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
        {match.competition}
        {" · "}
        Rodada {match.round}
      </p>

      <p className="mt-1 text-center text-xs text-slate-500">
        {match.stadium}
      </p>

      <div className="my-7 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
        <TeamIdentity
          variant="large"
          name={match.homeTeam.name}
          abbreviation={
            match.homeTeam.abbreviation
          }
          logoUrl={
            match.homeTeam.logoUrl
          }
        />

        <div className="flex items-center gap-2 sm:gap-4">
          <strong className="text-4xl sm:text-5xl">
            {homeScore}
          </strong>

          <span className="text-slate-500">
            ×
          </span>

          <strong className="text-4xl sm:text-5xl">
            {awayScore}
          </strong>
        </div>

        <TeamIdentity
          variant="large"
          name={match.awayTeam.name}
          abbreviation={
            match.awayTeam.abbreviation
          }
          logoUrl={
            match.awayTeam.logoUrl
          }
        />
      </div>

      {prediction ? (
        <div className="grid gap-3 rounded-xl bg-slate-950/40 p-4 sm:grid-cols-2">
          <div>
            <span className="text-xs font-bold text-slate-500">
              SEU PALPITE
            </span>

            <strong className="mt-1 block">
              {prediction.homeScore}
              {" × "}
              {prediction.awayScore}
            </strong>
          </div>

          <div className="sm:text-right">
            <span className="text-xs font-bold text-slate-500">
              SE TERMINASSE AGORA
            </span>

            <strong className="mt-1 block text-emerald-400">
              {projectedPoints} pontos
            </strong>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-slate-950/40 p-4 text-center text-sm text-slate-400">
          Você não registrou um palpite para esta
          partida no Ranking Geral.
        </div>
      )}

      <p className="mt-4 text-center text-xs text-slate-500">
        O palpite permanece bloqueado enquanto a
        partida estiver em andamento.
      </p>
    </article>
  );
}
