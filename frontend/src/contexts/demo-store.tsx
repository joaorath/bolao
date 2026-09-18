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
} from "@/types";

const STORAGE_KEY = "charqueons:custom-pools";

type JoinPoolResult = {
  success: boolean;
  message: string;
};

type DemoStoreContextValue = {
  pools: PoolSummary[];
  createPool: (
    input: CreatePoolInput,
  ) => PoolSummary;
  joinPool: (
    inviteCode: string,
  ) => JoinPoolResult;
};

const DemoStoreContext =
  createContext<DemoStoreContextValue | null>(null);

function createInviteCode() {
  return Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase();
}

export function DemoStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [customPools, setCustomPools] = useState<
    PoolSummary[]
  >([]);

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const savedPools = localStorage.getItem(STORAGE_KEY);

    if (savedPools) {
      try {
        const parsedPools: PoolSummary[] =
          JSON.parse(savedPools);

        setCustomPools(parsedPools);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(customPools),
    );
  }, [customPools, hydrated]);

  const pools = useMemo(
    () => [...initialPools, ...customPools],
    [customPools],
  );

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

    const alreadyJoined = customPools.some(
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

  const value: DemoStoreContextValue = {
    pools,
    createPool,
    joinPool,
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