import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSymptoms } from "./useSymptoms";
import type { SymptomResponse } from "../../types";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useSymptoms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with loading state", () => {
    // Mock pending response to keep loading state
    mockFetch.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useSymptoms());

    expect(result.current.symptoms).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("should fetch symptoms successfully", async () => {
    const mockSymptoms: SymptomResponse[] = [
      { id: 1, name: "Headache", category: "neurological", created_at: "2023-01-01T00:00:00Z" },
      { id: 2, name: "Nausea", category: "gastrointestinal", created_at: "2023-01-01T00:00:00Z" },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: mockSymptoms }),
    });

    const { result } = renderHook(() => useSymptoms());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/symptoms");
    expect(result.current.symptoms).toEqual(mockSymptoms);
    expect(result.current.error).toBeNull();
  });

  it("should handle HTTP error responses", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: vi.fn().mockRejectedValue(new Error("Cannot parse JSON")),
    });

    const { result } = renderHook(() => useSymptoms());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.symptoms).toEqual([]);
    expect(result.current.error).toBe("HTTP 500: Internal Server Error");
  });

  it("should handle HTTP error with API error message", async () => {
    const mockErrorResponse = {
      error: { message: "Database connection failed" },
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      json: vi.fn().mockResolvedValue(mockErrorResponse),
    });

    const { result } = renderHook(() => useSymptoms());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.symptoms).toEqual([]);
    expect(result.current.error).toBe("Database connection failed");
  });

  it("should handle API-level errors in successful responses", async () => {
    const mockErrorResponse = {
      error: "Invalid authentication token",
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(mockErrorResponse),
    });

    const { result } = renderHook(() => useSymptoms());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.symptoms).toEqual([]);
    expect(result.current.error).toBe("Invalid authentication token");
  });

  it("should handle invalid data structure", async () => {
    const mockInvalidResponse = {
      data: "not an array", // Invalid structure
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(mockInvalidResponse),
    });

    const { result } = renderHook(() => useSymptoms());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.symptoms).toEqual([]);
    expect(result.current.error).toBe("Invalid symptoms data structure received");
  });

  it("should handle network errors", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network connection failed"));

    const { result } = renderHook(() => useSymptoms());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.symptoms).toEqual([]);
    expect(result.current.error).toBe("Network connection failed");
  });

  it("should handle unexpected errors", async () => {
    mockFetch.mockRejectedValueOnce("String error");

    const { result } = renderHook(() => useSymptoms());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.symptoms).toEqual([]);
    expect(result.current.error).toBe("An unexpected error occurred");
  });

  it("should handle JSON parsing errors", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
    });

    const { result } = renderHook(() => useSymptoms());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.symptoms).toEqual([]);
    expect(result.current.error).toBe("Invalid JSON");
  });
});