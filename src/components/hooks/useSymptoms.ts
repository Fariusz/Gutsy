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
        console.log('Fetching symptoms...');
        const response = await fetch("/api/symptoms");
        const data = await response.json();

        console.log('Symptoms API response:', { response: response.ok, status: response.status, data });

        if (!response.ok) {
          const errorResponse = data as ErrorResponse;
          throw new Error(errorResponse.error?.message || "Failed to fetch symptoms");
        }

        // Check if data has the expected structure
        if (data && Array.isArray(data.data)) {
          console.log('Setting symptoms:', data.data);
          setSymptoms(data.data);
        } else {
          console.error('Invalid symptoms data structure:', data);
          throw new Error('Invalid symptoms data structure received');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
        console.error('Symptoms fetch error:', err);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSymptoms();
  }, []);

  return { symptoms, isLoading, error };
}