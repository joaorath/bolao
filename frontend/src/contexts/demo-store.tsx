"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { pools as initialPools } from "@/data/mock-data";

import type {
  CreatePoolInput,
  PoolSummary,
  Prediction,
} from "@/types";

const POOLS_STORAGE_KEY =
  "charqueons:custom-pools";

const HIDDEN_POOLS_STORAGE_KEY =
  "charqueons:hidden-pools";

const PREDICTIONS_STORAGE_KEY =
  "charqueons:predictions";

type JoinPoolResult = {
  success: boolean;
  message: string;
};

type SavePredictionInput = {
  poolId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
};

type DemoStoreContextValue = {
  pools: PoolSummary[];
  predictions: Prediction[];

  createPool: (
    input: CreatePoolInput,
  ) => PoolSummary;

  joinPool: (
    inviteCode: string,
  ) => JoinPoolResult;

  removePool: (poolId: string) => void;

  savePrediction: (
    input: SavePredictionInput,
  ) => Prediction;

  getPrediction: (
    poolId: string,
    matchId: string,
  ) => Prediction | undefined;
};

const DemoStoreContext =
  createContext<DemoStoreContextValue | null>(null);

function createInviteCode() {
  return Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase();
}

function readStorage<T>(
  key: string,
  fallback: T,
): T {
  const storedValue = localStorage.getItem(key);

  if (!storedValue) {
    return fallback;
  }

  try {
    return JSON.parse(storedValue) as T;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

export function DemoStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [customPools, setCustomPools] = useState<
    PoolSummary[]
  >([]);

  const [hiddenPoolIds, setHiddenPoolIds] =
    useState<string[]>([]);

  const [predictions, setPredictions] =
    useState<Prediction[]>([]);

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCustomPools(
      readStorage<PoolSummary[]>(
        POOLS_STORAGE_KEY,
        [],
      ),
    );

    setHiddenPoolIds(
      readStorage<string[]>(
        HIDDEN_POOLS_STORAGE_KEY,
        [],
      ),
    );

    setPredictions(
      readStorage<Prediction[]>(
        PREDICTIONS_STORAGE_KEY,
        [],
      ),
    );

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    localStorage.setItem(
      POOLS_STORAGE_KEY,
      JSON.stringify(customPools),
    );

    localStorage.setItem(
      HIDDEN_POOLS_STORAGE_KEY,
      JSON.stringify(hiddenPoolIds),
    );

    localStorage.setItem(
      PREDICTIONS_STORAGE_KEY,
      JSON.stringify(predictions),
    );
  }, [
    customPools,
    hiddenPoolIds,
    predictions,
    hydrated,
  ]);

  const pools = useMemo(() => {
    return [...initialPools, ...customPools].filter(
      (pool) => !hiddenPoolIds.includes(pool.id),
    );
  }, [customPools, hiddenPoolIds]);

  function createPool(
    input: CreatePoolInput,
  ): PoolSummary {
    const newPool: PoolSummary = {
      id: crypto.randomUUID(),
      name: input.name,
      description: input.description,
      competition: input.competition,
      visibility: input.visibility,
      participantCount: 1,
      position: 1,
      points: 0,
      leaderPoints: 0,
      inviteCode: createInviteCode(),
      isOwner: true,
    };

    setCustomPools((currentPools) => [
      ...currentPools,
      newPool,
    ]);

    return newPool;
  }

  function joinPool(
    inviteCode: string,
  ): JoinPoolResult {
    const normalizedCode = inviteCode
      .trim()
      .toUpperCase();

    const alreadyJoined = pools.some(
      (pool) =>
        pool.inviteCode === normalizedCode,
    );

    if (alreadyJoined) {
      return {
        success: false,
        message: "Você já participa deste bolão.",
      };
    }

    if (normalizedCode !== "PARAZAO26") {
      return {
        success: false,
        message: "Código de convite não encontrado.",
      };
    }

    const invitedPool: PoolSummary = {
      id: "bolao-faculdade",
      name: "Bolão da Faculdade",
      description:
        "Bolão da turma para acompanhar o Campeonato Paraense.",
      competition: "Campeonato Paraense",
      participantCount: 16,
      position: 8,
      points: 18,
      leaderPoints: 39,
      inviteCode: normalizedCode,
      visibility: "PRIVATE",
      isOwner: false,
    };

    setCustomPools((currentPools) => [
      ...currentPools,
      invitedPool,
    ]);

    return {
      success: true,
      message:
        "Você entrou no Bolão da Faculdade!",
    };
  }

  function removePool(poolId: string) {
    const isCustomPool = customPools.some(
      (pool) => pool.id === poolId,
    );

    if (isCustomPool) {
      setCustomPools((currentPools) =>
        currentPools.filter(
          (pool) => pool.id !== poolId,
        ),
      );

      return;
    }

    setHiddenPoolIds((currentIds) => {
      if (currentIds.includes(poolId)) {
        return currentIds;
      }

      return [...currentIds, poolId];
    });
  }

  function savePrediction(
    input: SavePredictionInput,
  ): Prediction {
    const prediction: Prediction = {
      poolId: input.poolId,
      matchId: input.matchId,
      homeScore: input.homeScore,
      awayScore: input.awayScore,
      locked: false,
      savedAt: new Date().toISOString(),
    };

    setPredictions((currentPredictions) => {
      const otherPredictions =
        currentPredictions.filter(
          (currentPrediction) =>
            !(
              currentPrediction.poolId ===
                input.poolId &&
              currentPrediction.matchId ===
                input.matchId
            ),
        );

      return [
        ...otherPredictions,
        prediction,
      ];
    });

    return prediction;
  }

  function getPrediction(
    poolId: string,
    matchId: string,
  ) {
    return predictions.find(
      (prediction) =>
        prediction.poolId === poolId &&
        prediction.matchId === matchId,
    );
  }

  const value: DemoStoreContextValue = {
    pools,
    predictions,
    createPool,
    joinPool,
    removePool,
    savePrediction,
    getPrediction,
  };

  return (
    <DemoStoreContext.Provider value={value}>
      {children}
    </DemoStoreContext.Provider>
  );
}

export function useDemoStore() {
  const context = useContext(DemoStoreContext);

  if (!context) {
    throw new Error(
      "useDemoStore deve ser usado dentro de DemoStoreProvider",
    );
  }

  return context;
}