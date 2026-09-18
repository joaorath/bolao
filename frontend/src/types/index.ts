export type MatchStatus =
  | "SCHEDULED"
  | "OPEN"
  | "LIVE"
  | "HALFTIME"
  | "FINISHED"
  | "POSTPONED"
  | "CANCELLED";

export type Team = {
  id: string;
  name: string;
  abbreviation: string;
  primaryColor: string;
  secondaryColor: string;
};

export type Match = {
  id: string;
  competition: string;
  round: number;
  stadium: string;
  startsAt: string;
  status: MatchStatus;
  elapsedMinutes?: number;
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number;
  awayScore?: number;
};

export type Prediction = {
  matchId: string;
  homeScore: number;
  awayScore: number;
  locked: boolean;
};

export type PoolSummary = {
  id: string;
  name: string;
  description?: string;
  competition: string;
  participantCount: number;
  position: number;
  points: number;
  leaderPoints: number;
  inviteCode?: string;
  visibility?: PoolVisibility;
  isOwner?: boolean;
};

export type RankingEntry = {
  id: string;
  name: string;
  initials: string;
  position: number;
  points: number;
  exactScores: number;
  correctResults: number;
  isCurrentUser?: boolean;
};

export type PoolVisibility =
  | "PUBLIC"
  | "PRIVATE";

export type CreatePoolInput = {
  name: string;
  description: string;
  competition: string;
  visibility: PoolVisibility;
};