export type ApiHealthResponse = {
  status: string;
  application: string;
  timestamp: string;
};

export type ApiScoreType =
  | "EXACT_SCORE"
  | "CORRECT_RESULT"
  | "WRONG";

export type ApiPredictionScore = {
  predictionId: string;
  points: 0 | 3 | 5;
  type: ApiScoreType;
};

export type CalculateScoreInput = {
  predictedHomeScore: number;
  predictedAwayScore: number;
  officialHomeScore: number;
  officialAwayScore: number;
};

export type ApiRankingEntry = {
  userId: string;
  userName: string;
  position: number;
  points: number;
  exactScores: number;
  correctResults: number;
  wrongPredictions: number;
  roundWins: number;
};

export type ApiRankingResponse = {
  poolId: string;
  round: number;
  ranking: ApiRankingEntry[];
};