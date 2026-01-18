import { useState, useCallback } from "react";
import type { TriggerAnalysisResponse, TriggerAnalysisRequest } from "../../types";

interface UseTriggerAnalysisReturn {
  isLoading: boolean;
  error: string | null;
  data: TriggerAnalysisResponse | null;
  fetchTriggers: (params: TriggerAnalysisRequest) => Promise<void>;
  reset: () => void;
}

export function useTriggerAnalysis(): UseTriggerAnalysisReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TriggerAnalysisResponse | null>(null);

  const fetchTriggers = useCallback(async (params: TriggerAnalysisRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams({
        start_date: params.start_date,
        end_date: params.end_date,
        ...(params.limit && { limit: params.limit.toString() }),
        ...(params.detailed && { detailed: params.detailed.toString() }),
      });

      const response = await fetch(`/api/triggers?${searchParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch trigger analysis";
      setError(errorMessage);
      // eslint-disable-next-line no-console
      console.error("Failed to fetch triggers:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setData(null);
    setIsLoading(false);
  }, []);

  return {
    isLoading,
    error,
    data,
    fetchTriggers,
    reset,
  };
}
