import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useTriggerAnalysis } from "./useTriggerAnalysis";
import type { TriggerAnalysisRequest, TriggerAnalysisResponse, IngredientSymptomCorrelation } from "../../types";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useTriggerAnalysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useTriggerAnalysis());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeNull();
    expect(typeof result.current.fetchTriggers).toBe("function");
    expect(typeof result.current.reset).toBe("function");
  });

  it("should handle successful trigger analysis fetch", async () => {
    const mockRequestData: TriggerAnalysisRequest = {
      start_date: "2024-01-01",
      end_date: "2024-01-31",
      limit: 10,
    };

    const mockResponseData: TriggerAnalysisResponse = {
      triggers: [
        {
          ingredient_name: "dairy",
          consumption_count: 8,
          avg_severity_when_present: 3.5,
          baseline_avg_severity: 2.0,
          trigger_score: 1.5,
          confidence_interval: 0.8,
        },
        {
          ingredient_name: "gluten",
          consumption_count: 5,
          avg_severity_when_present: 4.0,
          baseline_avg_severity: 2.0,
          trigger_score: 2.0,
          confidence_interval: 0.6,
        },
      ],
      analysis_period: {
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        total_logs: 15,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData,
    });

    const { result } = renderHook(() => useTriggerAnalysis());

    act(() => {
      result.current.fetchTriggers(mockRequestData);
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockResponseData);
    expect(result.current.error).toBeNull();

    // Verify fetch was called with correct parameters
    expect(mockFetch).toHaveBeenCalledWith("/api/triggers?start_date=2024-01-01&end_date=2024-01-31&limit=10", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  });

  it("should handle detailed analysis request", async () => {
    const mockRequestData: TriggerAnalysisRequest = {
      start_date: "2024-01-01",
      end_date: "2024-01-31",
      limit: 5,
      detailed: true,
    };

    const mockCorrelations: IngredientSymptomCorrelation[] = [
      {
        ingredient_name: "tomatoes",
        symptom_name: "rash",
        consumption_count: 5,
        symptom_occurrence_with_ingredient: 3,
        symptom_occurrence_without_ingredient: 1,
        baseline_symptom_rate: 0.2,
        trigger_score: 0.4,
        confidence_interval: 0.7,
      },
    ];

    const mockResponseData: TriggerAnalysisResponse = {
      triggers: [
        {
          ingredient_name: "tomatoes",
          consumption_count: 5,
          avg_severity_when_present: 3.0,
          baseline_avg_severity: 2.0,
          trigger_score: 1.0,
          confidence_interval: 0.7,
        },
      ],
      correlations: mockCorrelations,
      analysis_period: {
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        total_logs: 10,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData,
    });

    const { result } = renderHook(() => useTriggerAnalysis());

    act(() => {
      result.current.fetchTriggers(mockRequestData);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockResponseData);
    expect(result.current.data?.correlations).toEqual(mockCorrelations);

    // Verify fetch was called with detailed parameter
    expect(mockFetch).toHaveBeenCalledWith("/api/triggers?start_date=2024-01-01&end_date=2024-01-31&limit=5&detailed=true", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  });

  it("should handle API errors", async () => {
    const mockRequestData: TriggerAnalysisRequest = {
      start_date: "2024-01-01",
      end_date: "2024-01-31",
      limit: 10,
    };

    const mockErrorResponse = {
      error: "Invalid query parameters",
      details: ["Invalid date format"],
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => mockErrorResponse,
    });

    const { result } = renderHook(() => useTriggerAnalysis());

    act(() => {
      result.current.fetchTriggers(mockRequestData);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe("Invalid query parameters");
  });

  it("should handle network errors", async () => {
    const mockRequestData: TriggerAnalysisRequest = {
      start_date: "2024-01-01",
      end_date: "2024-01-31",
      limit: 10,
    };

    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useTriggerAnalysis());

    act(() => {
      result.current.fetchTriggers(mockRequestData);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe("Network error");
  });

  it("should handle HTTP errors without error message", async () => {
    const mockRequestData: TriggerAnalysisRequest = {
      start_date: "2024-01-01",
      end_date: "2024-01-31",
      limit: 10,
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useTriggerAnalysis());

    act(() => {
      result.current.fetchTriggers(mockRequestData);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe("HTTP error! status: 500");
  });

  it("should reset state correctly", async () => {
    // First set some data
    const mockRequestData: TriggerAnalysisRequest = {
      start_date: "2024-01-01",
      end_date: "2024-01-31",
      limit: 10,
    };

    mockFetch.mockRejectedValueOnce(new Error("Test error"));

    const { result } = renderHook(() => useTriggerAnalysis());

    act(() => {
      result.current.fetchTriggers(mockRequestData);
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Test error");
    });

    // Now reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeNull();
  });

  it("should handle missing optional parameters correctly", async () => {
    const mockRequestData: TriggerAnalysisRequest = {
      start_date: "2024-01-01",
      end_date: "2024-01-31",
      // No limit or detailed parameters
    };

    const mockResponseData: TriggerAnalysisResponse = {
      triggers: [],
      analysis_period: {
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        total_logs: 0,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData,
    });

    const { result } = renderHook(() => useTriggerAnalysis());

    act(() => {
      result.current.fetchTriggers(mockRequestData);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify fetch was called without optional parameters
    expect(mockFetch).toHaveBeenCalledWith("/api/triggers?start_date=2024-01-01&end_date=2024-01-31", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  });
});
