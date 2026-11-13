import { Router } from "express";

import {
  demoPredictions,
  demoResults,
  demoRoundWins,
} from "../data/demo-scoring-data.js";

import {
  calculatePredictionScore,
  calculateRanking,
} from "../services/scoring-service.js";

const scoringRouter = Router();

scoringRouter.get(
  "/ranking",
  (request, response) => {
    const requestedPoolId =
      typeof request.query.poolId === "string"
        ? request.query.poolId
        : "charqueons-resenha";

    const ranking = calculateRanking(
      demoPredictions,
      demoResults,
      demoRoundWins,
    );

    response.status(200).json({
      poolId: requestedPoolId,
      round: 4,
      ranking,
    });
  },
);

scoringRouter.post(
  "/scoring/calculate",
  (request, response) => {
    const {
      predictedHomeScore,
      predictedAwayScore,
      officialHomeScore,
      officialAwayScore,
    } = request.body;

    const scores = [
      predictedHomeScore,
      predictedAwayScore,
      officialHomeScore,
      officialAwayScore,
    ];

    const validScores = scores.every(
      (score) =>
        Number.isInteger(score) &&
        score >= 0 &&
        score <= 99,
    );

    if (!validScores) {
      response.status(400).json({
        error:
          "Todos os placares devem ser números inteiros entre 0 e 99.",
      });

      return;
    }

    const result = calculatePredictionScore(
      {
        id: "temporary-prediction",
        homeScore: predictedHomeScore,
        awayScore: predictedAwayScore,
      },
      {
        homeScore: officialHomeScore,
        awayScore: officialAwayScore,
      },
    );

    response.status(200).json(result);
  },
);

export { scoringRouter };