export type MatchOutcome =
  | "HOME_WIN"
  | "DRAW"
  | "AWAY_WIN";

export type ScoreType =
  | "EXACT_SCORE"
  | "CORRECT_RESULT"
  | "WRONG";

export type MatchResult = {
  matchId: string;
  homeScore: number;
  awayScore: number;
  status: "FINISHED";
};

export type PredictionRecord = {
  id: string;
  userId: string;
  userName: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
};

export type PredictionScore = {
  predictionId: string;
  points: 0 | 3 | 5;
  type: ScoreType;
};

export type RankingEntry = {
  userId: string;
  userName: string;
  position: number;
  points: number;
  exactScores: number;
  correctResults: number;
  wrongPredictions: number;
  roundWins: number;
};