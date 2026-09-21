import type {
  MatchResult,
  PredictionRecord,
} from "../types/football.js";

export const demoResults: MatchResult[] = [
  {
    matchId: "remo-paysandu",
    homeScore: 2,
    awayScore: 1,
    status: "FINISHED",
  },
  {
    matchId: "tuna-castanhal",
    homeScore: 1,
    awayScore: 1,
    status: "FINISHED",
  },
  {
    matchId: "aguia-bragantino",
    homeScore: 0,
    awayScore: 2,
    status: "FINISHED",
  },
];

export const demoPredictions: PredictionRecord[] = [
  {
    id: "prediction-joao-1",
    userId: "joao",
    userName: "João Rath",
    matchId: "remo-paysandu",
    homeScore: 2,
    awayScore: 1,
  },
  {
    id: "prediction-joao-2",
    userId: "joao",
    userName: "João Rath",
    matchId: "tuna-castanhal",
    homeScore: 2,
    awayScore: 2,
  },
  {
    id: "prediction-joao-3",
    userId: "joao",
    userName: "João Rath",
    matchId: "aguia-bragantino",
    homeScore: 1,
    awayScore: 0,
  },

  {
    id: "prediction-pedro-1",
    userId: "pedro",
    userName: "Pedro Silva",
    matchId: "remo-paysandu",
    homeScore: 3,
    awayScore: 1,
  },
  {
    id: "prediction-pedro-2",
    userId: "pedro",
    userName: "Pedro Silva",
    matchId: "tuna-castanhal",
    homeScore: 1,
    awayScore: 1,
  },
  {
    id: "prediction-pedro-3",
    userId: "pedro",
    userName: "Pedro Silva",
    matchId: "aguia-bragantino",
    homeScore: 0,
    awayScore: 1,
  },

  {
    id: "prediction-marina-1",
    userId: "marina",
    userName: "Marina Paes",
    matchId: "remo-paysandu",
    homeScore: 1,
    awayScore: 0,
  },
  {
    id: "prediction-marina-2",
    userId: "marina",
    userName: "Marina Paes",
    matchId: "tuna-castanhal",
    homeScore: 0,
    awayScore: 0,
  },
  {
    id: "prediction-marina-3",
    userId: "marina",
    userName: "Marina Paes",
    matchId: "aguia-bragantino",
    homeScore: 0,
    awayScore: 2,
  },
];

export const demoRoundWins: Record<
  string,
  number
> = {
  joao: 1,
  pedro: 2,
  marina: 0,
};