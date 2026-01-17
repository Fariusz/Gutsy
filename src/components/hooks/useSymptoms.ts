import { useState, useEffect } from "react";
import type { SymptomResponse } from "../../types";
import { logger } from "../../lib/utils/logger";

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

        // Check if the response is ok first
        if (!response.ok) {
          // Try to parse error response if possible
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error?.message || errorMessage;
          } catch {
            // If parsing fails, use the status message
          }
          throw new Error(errorMessage);
        }

        // Parse successful response
        const data = await response.json();

        // Check if data has the expected structure
        if (data && Array.isArray(data.data)) {
          setSymptoms(data.data);
        } else if (data && data.error) {
          // Handle API-level errors
          throw new Error(data.error);
        } else {
          logger.error("Invalid symptoms data structure:", { data });
          throw new Error("Invalid symptoms data structure received");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
        logger.error("Symptoms fetch error", { error: err });
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSymptoms();
  }, []);

  return { symptoms, isLoading, error };
}
