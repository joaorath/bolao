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
  (_request, response) => {
    const ranking = calculateRanking(
      demoPredictions,
      demoResults,
      demoRoundWins,
    );

    response.status(200).json({
      poolId: "charqueons-resenha",
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
        Number.isInteger(score) && score >= 0,
    );

    if (!validScores) {
      response.status(400).json({
        error:
          "Todos os placares devem ser números inteiros maiores ou iguais a zero.",
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