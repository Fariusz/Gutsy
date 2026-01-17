import { describe, it, expect, vi, beforeEach } from "vitest";
import { LogService } from "./log-service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import { LogRepository } from "./log-repository";

// Create shared mock functions
const mockGetPaginatedLogs = vi.fn();
const mockGetPopulatedLog = vi.fn();

// Mock the LogRepository
vi.mock("./log-repository", () => {
  class MockLogRepository {
    getPaginatedLogs = mockGetPaginatedLogs;
    getPopulatedLog = mockGetPopulatedLog;
    createLogWithAssociations = vi.fn();
  }
  return {
    LogRepository: MockLogRepository,
  };
});

describe("LogService", () => {
  let mockSupabase: SupabaseClient<Database>;
  let logService: LogService;

  beforeEach(() => {
    // Create mock Supabase client
    mockSupabase = {
      auth: {
        getSession: vi.fn(),
      },
    } as unknown as SupabaseClient<Database>;

    // Reset mocks
    vi.clearAllMocks();

    logService = new LogService(mockSupabase);
  });

  describe("getLogs pagination calculation", () => {
    it("should calculate total_pages correctly when count is divisible by per_page", async () => {
      // Arrange: Set up mock data and responses
      const mockLogs = [{ id: 1 }, { id: 2 }];
      mockGetPaginatedLogs.mockResolvedValue({
        data: mockLogs,
        count: 20,
        error: null,
      });
      mockGetPopulatedLog.mockImplementation((id: number) =>
        Promise.resolve({
          id,
          log_date: "2024-01-01",
          ingredients: [],
          symptoms: [],
        })
      );

      // Act: Execute the function under test
      const result = await logService.getLogs("user-123", {
        page: 1,
        per_page: 10,
      });

      // Assert: Verify pagination calculation
      expect(result.meta.total_pages).toBe(2); // Math.ceil(20 / 10) = 2
      expect(result.meta.total).toBe(20);
      expect(result.meta.page).toBe(1);
      expect(result.meta.per_page).toBe(10);
    });

    it("should calculate total_pages correctly when count is not divisible by per_page", async () => {
      // Arrange: Set up mock data with count not divisible by per_page
      const mockLogs = [{ id: 1 }];
      mockGetPaginatedLogs.mockResolvedValue({
        data: mockLogs,
        count: 25,
        error: null,
      });
      mockGetPopulatedLog.mockImplementation((id: number) =>
        Promise.resolve({
          id,
          log_date: "2024-01-01",
          ingredients: [],
          symptoms: [],
        })
      );

      // Act: Execute the function under test
      const result = await logService.getLogs("user-123", {
        page: 1,
        per_page: 10,
      });

      // Assert: Verify pagination rounds up correctly
      expect(result.meta.total_pages).toBe(3); // Math.ceil(25 / 10) = 3
      expect(result.meta.total).toBe(25);
    });

    it("should handle zero count", async () => {
      // Arrange: Set up mock with zero count
      mockGetPaginatedLogs.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });

      // Act: Execute the function under test
      const result = await logService.getLogs("user-123", {
        page: 1,
        per_page: 10,
      });

      // Assert: Verify zero count handling
      expect(result.meta.total_pages).toBe(0); // Math.ceil(0 / 10) = 0
      expect(result.meta.total).toBe(0);
      expect(result.data).toEqual([]);
    });

    it("should handle null count (defaults to 0)", async () => {
      // Arrange: Set up mock with null count
      mockGetPaginatedLogs.mockResolvedValue({
        data: [],
        count: null,
        error: null,
      });

      // Act: Execute the function under test
      const result = await logService.getLogs("user-123", {
        page: 1,
        per_page: 10,
      });

      // Assert: Verify null count defaults to 0
      expect(result.meta.total_pages).toBe(0); // Math.ceil((null ?? 0) / 10) = 0
      expect(result.meta.total).toBe(0);
    });

    it("should handle count less than per_page", async () => {
      // Arrange: Set up mock with count less than per_page
      const mockLogs = [{ id: 1 }, { id: 2 }, { id: 3 }];
      mockGetPaginatedLogs.mockResolvedValue({
        data: mockLogs,
        count: 3,
        error: null,
      });
      mockGetPopulatedLog.mockImplementation((id: number) =>
        Promise.resolve({
          id,
          log_date: "2024-01-01",
          ingredients: [],
          symptoms: [],
        })
      );

      // Act: Execute the function under test
      const result = await logService.getLogs("user-123", {
        page: 1,
        per_page: 10,
      });

      // Assert: Verify single page when count < per_page
      expect(result.meta.total_pages).toBe(1); // Math.ceil(3 / 10) = 1
      expect(result.meta.total).toBe(3);
    });

    it("should handle single item per page", async () => {
      // Arrange: Set up mock with per_page = 1
      const mockLogs = [{ id: 1 }];
      mockGetPaginatedLogs.mockResolvedValue({
        data: mockLogs,
        count: 5,
        error: null,
      });
      mockGetPopulatedLog.mockImplementation((id: number) =>
        Promise.resolve({
          id,
          log_date: "2024-01-01",
          ingredients: [],
          symptoms: [],
        })
      );

      // Act: Execute the function under test
      const result = await logService.getLogs("user-123", {
        page: 1,
        per_page: 1,
      });

      // Assert: Verify pagination with single item per page
      expect(result.meta.total_pages).toBe(5); // Math.ceil(5 / 1) = 5
      expect(result.meta.per_page).toBe(1);
    });
  });
});
