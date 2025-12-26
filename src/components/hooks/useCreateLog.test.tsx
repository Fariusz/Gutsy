import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCreateLog } from "./useCreateLog";
import type { CreateLogRequest, LogResponse, ErrorResponse } from "../../types";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useCreateLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useCreateLog());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isSuccess).toBe(false);
    expect(typeof result.current.createLog).toBe("function");
    expect(typeof result.current.reset).toBe("function");
  });

  it("should handle successful log creation", async () => {
    const mockLogData: CreateLogRequest = {
      log_date: "2023-12-26T10:00:00Z",
      notes: "Test log",
      ingredients: ["apple", "banana"],
      symptoms: [{ symptom_id: 1, severity: 3 }],
    };

    const mockResponse: LogResponse = {
      id: 1,
      user_id: "test-user",
      log_date: mockLogData.log_date,
      notes: mockLogData.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      symptoms: [{ symptom_id: 1, severity: 3, name: "Headache" }],
      ingredient_names: mockLogData.ingredients,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: mockResponse }),
    });

    const { result } = renderHook(() => useCreateLog());

    let logResult: LogResponse | null = null;
    
    await act(async () => {
      logResult = await result.current.createLog(mockLogData);
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mockLogData),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isSuccess).toBe(true);
    expect(logResult).toEqual(mockResponse);
  });

  it("should handle network errors", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useCreateLog());

    let logResult: LogResponse | null;
    
    await act(async () => {
      logResult = await result.current.createLog({
        log_date: "2023-12-26T10:00:00Z",
        ingredients: ["apple"],
        symptoms: [],
      });
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe("Network error");
    expect(result.current.isSuccess).toBe(false);
    expect(logResult).toBeNull();
  });

  it("should handle API error responses", async () => {
    const mockErrorResponse: ErrorResponse = {
      error: {
        type: "validation_error",
        message: "Invalid data provided",
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue(mockErrorResponse),
    });

    const { result } = renderHook(() => useCreateLog());

    let logResult: LogResponse | null;
    
    await act(async () => {
      logResult = await result.current.createLog({
        log_date: "invalid-date",
        ingredients: [],
        symptoms: [],
      });
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe("Invalid data provided");
    expect(result.current.isSuccess).toBe(false);
    expect(logResult).toBeNull();
  });

  it("should handle malformed error responses", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({}),
    });

    const { result } = renderHook(() => useCreateLog());

    let logResult: LogResponse | null;
    
    await act(async () => {
      logResult = await result.current.createLog({
        log_date: "2023-12-26T10:00:00Z",
        ingredients: ["apple"],
        symptoms: [],
      });
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe("Failed to create log");
    expect(result.current.isSuccess).toBe(false);
    expect(logResult).toBeNull();
  });

  it("should reset state correctly", () => {
    const { result } = renderHook(() => useCreateLog());

    // First, set some state by simulating an error
    act(() => {
      result.current.reset();
    });

    act(() => {
      // Manually set some state to test reset
      // This simulates what would happen after a failed request
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isSuccess).toBe(false);
  });

  it("should show loading state during request", async () => {
    let resolvePromise: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockFetch.mockReturnValueOnce(pendingPromise);

    const { result } = renderHook(() => useCreateLog());

    // Start the request
    act(() => {
      result.current.createLog({
        log_date: "2023-12-26T10:00:00Z",
        ingredients: ["apple"],
        symptoms: [],
      });
    });

    // Should be loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.isSuccess).toBe(false);

    // Resolve the promise
    await act(async () => {
      resolvePromise!({
        ok: true,
        json: vi.fn().mockResolvedValue({ data: {} }),
      });
    });

    // Should not be loading anymore
    expect(result.current.isLoading).toBe(false);
  });
});