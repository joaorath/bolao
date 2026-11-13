import type {
  ApiHealthResponse,
  ApiPredictionScore,
  ApiRankingResponse,
  CalculateScoreInput,
} from "@/types/api";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3333/api";

async function requestApi<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    },
  );

  if (!response.ok) {
    const errorData = (await response
      .json()
      .catch(() => null)) as {
      error?: string;
    } | null;

    throw new Error(
      errorData?.error ??
        "Não foi possível acessar o servidor.",
    );
  }

  return response.json() as Promise<T>;
}

export function getApiHealth(
  signal?: AbortSignal,
) {
  return requestApi<ApiHealthResponse>(
    "/health",
    {
      signal,
      cache: "no-store",
    },
  );
}

export function getPoolRanking(
  poolId: string,
  signal?: AbortSignal,
) {
  const encodedPoolId =
    encodeURIComponent(poolId);

  return requestApi<ApiRankingResponse>(
    `/ranking?poolId=${encodedPoolId}`,
    {
      signal,
      cache: "no-store",
    },
  );
}

export function calculateScore(
  input: CalculateScoreInput,
  signal?: AbortSignal,
) {
  return requestApi<ApiPredictionScore>(
    "/scoring/calculate",
    {
      method: "POST",
      signal,
      body: JSON.stringify(input),
    },
  );
}