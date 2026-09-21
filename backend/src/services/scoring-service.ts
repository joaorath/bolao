import type {
  MatchOutcome,
  MatchResult,
  PredictionRecord,
  PredictionScore,
  RankingEntry,
} from "../types/football.js";

function getOutcome(
  homeScore: number,
  awayScore: number,
): MatchOutcome {
  if (homeScore > awayScore) {
    return "HOME_WIN";
  }

  if (homeScore < awayScore) {
    return "AWAY_WIN";
  }

  return "DRAW";
}

export function calculatePredictionScore(
  prediction: Pick<
    PredictionRecord,
    "id" | "homeScore" | "awayScore"
  >,
  result: Pick<
    MatchResult,
    "homeScore" | "awayScore"
  >,
): PredictionScore {
  const exactScore =
    prediction.homeScore === result.homeScore &&
    prediction.awayScore === result.awayScore;

  if (exactScore) {
    return {
      predictionId: prediction.id,
      points: 5,
      type: "EXACT_SCORE",
    };
  }

  const predictedOutcome = getOutcome(
    prediction.homeScore,
    prediction.awayScore,
  );

  const officialOutcome = getOutcome(
    result.homeScore,
    result.awayScore,
  );

  if (predictedOutcome === officialOutcome) {
    return {
      predictionId: prediction.id,
      points: 3,
      type: "CORRECT_RESULT",
    };
  }

  return {
    predictionId: prediction.id,
    points: 0,
    type: "WRONG",
  };
}

export function calculateRanking(
  predictions: PredictionRecord[],
  results: MatchResult[],
  roundWinsByUserId: Record<string, number> = {},
): RankingEntry[] {
  const resultByMatchId = new Map(
    results.map((result) => [
      result.matchId,
      result,
    ]),
  );

  const entries = new Map<
    string,
    Omit<RankingEntry, "position">
  >();

  for (const prediction of predictions) {
    const matchResult = resultByMatchId.get(
      prediction.matchId,
    );

    if (!matchResult) {
      continue;
    }

    const score = calculatePredictionScore(
      prediction,
      matchResult,
    );

    const currentEntry = entries.get(
      prediction.userId,
    ) ?? {
      userId: prediction.userId,
      userName: prediction.userName,
      points: 0,
      exactScores: 0,
      correctResults: 0,
      wrongPredictions: 0,
      roundWins:
        roundWinsByUserId[prediction.userId] ?? 0,
    };

    currentEntry.points += score.points;

    if (score.type === "EXACT_SCORE") {
      currentEntry.exactScores += 1;
      currentEntry.correctResults += 1;
    }

    if (score.type === "CORRECT_RESULT") {
      currentEntry.correctResults += 1;
    }

    if (score.type === "WRONG") {
      currentEntry.wrongPredictions += 1;
    }

    entries.set(
      prediction.userId,
      currentEntry,
    );
  }

  const sortedEntries = [
    ...entries.values(),
  ].sort((firstEntry, secondEntry) => {
    if (
      secondEntry.points !== firstEntry.points
    ) {
      return (
        secondEntry.points - firstEntry.points
      );
    }

    if (
      secondEntry.exactScores !==
      firstEntry.exactScores
    ) {
      return (
        secondEntry.exactScores -
        firstEntry.exactScores
      );
    }

    if (
      secondEntry.correctResults !==
      firstEntry.correctResults
    ) {
      return (
        secondEntry.correctResults -
        firstEntry.correctResults
      );
    }

    if (
      secondEntry.roundWins !==
      firstEntry.roundWins
    ) {
      return (
        secondEntry.roundWins -
        firstEntry.roundWins
      );
    }

    return firstEntry.userName.localeCompare(
      secondEntry.userName,
      "pt-BR",
    );
  });

  let lastPosition = 0;

  return sortedEntries.map(
    (entry, index, ranking) => {
      const previousEntry = ranking[index - 1];

      const tiedWithPrevious =
        previousEntry !== undefined &&
        previousEntry.points === entry.points &&
        previousEntry.exactScores ===
          entry.exactScores &&
        previousEntry.correctResults ===
          entry.correctResults &&
        previousEntry.roundWins ===
          entry.roundWins;

      if (!tiedWithPrevious) {
        lastPosition = index + 1;
      }

      return {
        ...entry,
        position: lastPosition,
      };
    },
  );
}