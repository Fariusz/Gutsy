import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, GET } from "../../pages/api/logs";
import { createMockAPIContext, createMockSession } from "../mocks/supabase";
import type { CreateLogRequest } from "../../types";

// Mock the LogService module
vi.mock("../../lib/services/log-service");

describe("Logs API Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/logs", () => {
    it("should create a log successfully with valid data", async () => {
      const session = createMockSession("test-user-id");
      const context = createMockAPIContext(session);

      const validLogData: CreateLogRequest = {
        log_date: "2023-12-26T10:00:00Z",
        notes: "Test meal",
        ingredients: ["apple", "banana"],
        symptoms: [{ symptom_id: 1, severity: 3 }],
      };

      // Mock the request body
      context.request.json = vi.fn().mockResolvedValue(validLogData);

      // Mock LogService
      const mockLogResponse = {
        id: 1,
        user_id: session.user.id,
        log_date: validLogData.log_date,
        notes: validLogData.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        symptoms: [{ symptom_id: 1, severity: 3, name: "Headache" }],
        ingredient_names: validLogData.ingredients,
      };

      const { LogService } = await import("../../lib/services/log-service");
      const mockLogService = vi.mocked(LogService);
      mockLogService.prototype.createLog = vi.fn().mockResolvedValue(mockLogResponse);

      const response = await POST(context);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.data).toEqual(mockLogResponse);
    });

    it("should return 401 when not authenticated", async () => {
      const context = createMockAPIContext(null); // No session

      const response = await POST(context);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error.type).toBe("authorization_error");
      expect(responseData.error.message).toBe("Authentication required");
    });

    it("should return 400 for invalid JSON", async () => {
      const session = createMockSession("test-user-id");
      const context = createMockAPIContext(session);

      // Mock invalid JSON parsing
      context.request.json = vi.fn().mockRejectedValue(new Error("Invalid JSON"));

      const response = await POST(context);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error.type).toBe("validation_error");
      expect(responseData.error.message).toBe("Invalid JSON in request body");
    });

    it("should return 400 for validation errors", async () => {
      const session = createMockSession("test-user-id");
      const context = createMockAPIContext(session);

      const invalidLogData = {
        log_date: "invalid-date", // Invalid date format
        ingredients: [], // Empty ingredients
        symptoms: [],
      };

      context.request.json = vi.fn().mockResolvedValue(invalidLogData);

      const response = await POST(context);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error.type).toBe("validation_error");
    });

    it("should handle service errors", async () => {
      const session = createMockSession("test-user-id");
      const context = createMockAPIContext(session);

      const validLogData: CreateLogRequest = {
        log_date: "2023-12-26T10:00:00Z",
        ingredients: ["apple"],
        symptoms: [],
      };

      context.request.json = vi.fn().mockResolvedValue(validLogData);

      const { LogService } = await import("../../lib/services/log-service");
      const mockLogService = vi.mocked(LogService);
      mockLogService.prototype.createLog = vi.fn().mockRejectedValue(new Error("Database connection failed"));

      const response = await POST(context);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error.message).toBe("Database connection failed");
    });
  });

  describe("GET /api/logs", () => {
    it("should return paginated logs successfully", async () => {
      const session = createMockSession("test-user-id");
      const context = createMockAPIContext(session);

      // Mock URL with query parameters
      Object.defineProperty(context, "url", {
        value: new URL("http://localhost/api/logs?page=1&per_page=10"),
        writable: false,
      });

      const mockLogsResponse = {
        data: [
          {
            id: 1,
            user_id: session.user.id,
            log_date: "2023-12-26T10:00:00Z",
            notes: "Test meal",
            symptoms: [],
            ingredient_names: ["apple"],
          },
        ],
        meta: {
          page: 1,
          per_page: 10,
          total: 1,
          total_pages: 1,
        },
      };

      const { LogService } = await import("../../lib/services/log-service");
      const mockLogService = vi.mocked(LogService);
      mockLogService.prototype.getLogs = vi.fn().mockResolvedValue(mockLogsResponse);

      const response = await GET(context);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data).toEqual(mockLogsResponse.data);
      expect(responseData.meta).toEqual(mockLogsResponse.meta);
    });

    it("should return 401 when not authenticated", async () => {
      const context = createMockAPIContext(null);

      const response = await GET(context);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error.type).toBe("authorization_error");
    });

    it("should handle invalid query parameters", async () => {
      const session = createMockSession("test-user-id");
      const context = createMockAPIContext(session);

      // Mock URL with invalid query parameters
      Object.defineProperty(context, "url", {
        value: new URL("http://localhost/api/logs?page=invalid&per_page=-1"),
        writable: false,
      });

      const response = await GET(context);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error.type).toBe("validation_error");
    });

    it("should use default pagination when no parameters provided", async () => {
      const session = createMockSession("test-user-id");
      const context = createMockAPIContext(session);

      Object.defineProperty(context, "url", {
        value: new URL("http://localhost/api/logs"),
        writable: false,
      });

      const mockLogsResponse = {
        data: [],
        meta: { page: 1, per_page: 10, total: 0, total_pages: 0 },
      };

      const { LogService } = await import("../../lib/services/log-service");
      const mockLogService = vi.mocked(LogService);
      mockLogService.prototype.getLogs = vi.fn().mockResolvedValue(mockLogsResponse);

      const response = await GET(context);

      expect(response.status).toBe(200);
      expect(mockLogService.prototype.getLogs).toHaveBeenCalledWith(session.user.id, { page: 1, per_page: 10 });
    });
  });
});
