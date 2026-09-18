import type {
  Match,
  PoolSummary,
  Prediction,
  RankingEntry,
} from "@/types";

export const liveMatch: Match = {
  id: "remo-paysandu-rodada-4",
  competition: "Campeonato Paraense",
  round: 4,
  stadium: "Mangueirão",
  startsAt: "2026-02-08T17:00:00-03:00",
  status: "LIVE",
  elapsedMinutes: 67,
  homeScore: 1,
  awayScore: 0,
  homeTeam: {
    id: "remo",
    name: "Remo",
    abbreviation: "REM",
    primaryColor: "#1d4f91",
    secondaryColor: "#ffffff",
  },
  awayTeam: {
    id: "paysandu",
    name: "Paysandu",
    abbreviation: "PSC",
    primaryColor: "#56a9dd",
    secondaryColor: "#ffffff",
  },
};

export const currentPrediction: Prediction = {
  matchId: liveMatch.id,
  homeScore: 2,
  awayScore: 1,
  locked: true,
};

export const pools: PoolSummary[] = [
  {
    id: "charqueons-resenha",
    name: "Charqueons da Resenha",
    competition: "Campeonato Paraense",
    participantCount: 12,
    position: 2,
    points: 38,
    leaderPoints: 42,
  },
  {
    id: "amigos-mangueirao",
    name: "Amigos do Mangueirão",
    competition: "Campeonato Paraense",
    participantCount: 8,
    position: 4,
    points: 31,
    leaderPoints: 45,
  },
];

export const ranking: RankingEntry[] = [
  {
    id: "pedro",
    name: "Pedro Silva",
    initials: "PS",
    position: 1,
    points: 42,
    exactScores: 6,
    correctResults: 13,
  },
  {
    id: "joao",
    name: "João Rath",
    initials: "JR",
    position: 2,
    points: 38,
    exactScores: 5,
    correctResults: 12,
    isCurrentUser: true,
  },
  {
    id: "marina",
    name: "Marina Paes",
    initials: "MP",
    position: 3,
    points: 37,
    exactScores: 4,
    correctResults: 14,
  },
  {
    id: "lucas",
    name: "Lucas Lima",
    initials: "LL",
    position: 4,
    points: 31,
    exactScores: 3,
    correctResults: 12,
  },
];