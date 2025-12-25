import { useState, useEffect } from "react";
import type { SymptomResponse, ErrorResponse } from "../../types";

interface UseSymptomsReturn {
  symptoms: SymptomResponse[];
  isLoading: boolean;
  error: string | null;
}

export function useSymptoms(): UseSymptomsReturn {
  const [symptoms, setSymptoms] = useState<SymptomResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSymptoms = async () => {
      try {
        const response = await fetch("/api/symptoms");
        const data = await response.json();

        if (!response.ok) {
          const errorResponse = data as ErrorResponse;
          throw new Error(errorResponse.error?.message || "Failed to fetch symptoms");
        }

        setSymptoms(data.data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSymptoms();
  }, []);

  return { symptoms, isLoading, error };
}