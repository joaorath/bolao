import "dotenv/config";

import cors from "cors";
import express from "express";

import { scoringRouter } from "./routes/scoring-routes.js";

const app = express();

const PORT = Number(process.env.PORT) || 3333;

const FRONTEND_URL =
  process.env.FRONTEND_URL ??
  "http://localhost:3000";

app.use(
  cors({
    origin: FRONTEND_URL,
  }),
);

app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    application: "Charqueons League API",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", scoringRouter);

app.use((_request, response) => {
  response.status(404).json({
    error: "Rota não encontrada.",
  });
});

app.listen(PORT, () => {
  console.log(
    `Charqueons League API disponível em http://localhost:${PORT}`,
  );
});