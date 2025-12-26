import { useState } from "react";
import type { CreateLogRequest, LogResponse, ErrorResponse } from "../../types";

interface UseCreateLogReturn {
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
  createLog: (logData: CreateLogRequest) => Promise<LogResponse | null>;
  reset: () => void;
}

export function useCreateLog(): UseCreateLogReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const createLog = async (logData: CreateLogRequest): Promise<LogResponse | null> => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      const response = await fetch("/api/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(logData),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorResponse = data as ErrorResponse;
        throw new Error(errorResponse.error?.message || "Failed to create log");
      }

      setIsSuccess(true);
      return data.data as LogResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setIsSuccess(false);
    setIsLoading(false);
  };

  return {
    isLoading,
    error,
    isSuccess,
    createLog,
    reset,
  };
}
