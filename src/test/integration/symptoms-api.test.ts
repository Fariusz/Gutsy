import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../../pages/api/symptoms";
import { createMockAPIContext, createMockSession } from "../mocks/supabase";

// Mock the SymptomService module
vi.mock("../../lib/services/symptom-service");

describe("Symptoms API Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/symptoms", () => {
    it("should return symptoms successfully when authenticated", async () => {
      const session = createMockSession("test-user-id");
      const context = createMockAPIContext(session);
      
      const mockSymptomsResponse = {
        data: [
          { id: 1, name: "Headache", category: "neurological", created_at: "2023-01-01T00:00:00Z" },
          { id: 2, name: "Nausea", category: "gastrointestinal", created_at: "2023-01-01T00:00:00Z" },
        ],
        error: null,
      };

      const { SymptomService } = await import("../../lib/services/symptom-service");
      const mockSymptomService = vi.mocked(SymptomService);
      mockSymptomService.prototype.getAllSymptoms = vi.fn().mockResolvedValue(mockSymptomsResponse);

      const response = await GET(context);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data).toEqual(mockSymptomsResponse.data);
      expect(responseData.error).toBeNull();
    });

    it("should return 401 when not authenticated", async () => {
      const context = createMockAPIContext(null); // No session
      
      const response = await GET(context);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error.type).toBe("authorization_error");
      expect(responseData.error.message).toBe("Authentication required");
    });

    it("should return 401 when session error occurs", async () => {
      const context = createMockAPIContext();
      context.locals.supabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: new Error("Session validation failed"),
      });

      const response = await GET(context);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error.type).toBe("authorization_error");
      expect(responseData.error.message).toContain("Session error: Session validation failed");
    });

    it("should handle service errors", async () => {
      const session = createMockSession("test-user-id");
      const context = createMockAPIContext(session);

      const { SymptomService } = await import("../../lib/services/symptom-service");
      const mockSymptomService = vi.mocked(SymptomService);
      mockSymptomService.prototype.getAllSymptoms = vi.fn().mockRejectedValue(
        new Error("Database connection failed")
      );

      const response = await GET(context);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error.type).toBe("server_error");
      expect(responseData.error.message).toBe("Database connection failed");
    });

    it("should handle unknown errors", async () => {
      const session = createMockSession("test-user-id");
      const context = createMockAPIContext(session);

      const { SymptomService } = await import("../../lib/services/symptom-service");
      const mockSymptomService = vi.mocked(SymptomService);
      mockSymptomService.prototype.getAllSymptoms = vi.fn().mockRejectedValue("String error");

      const response = await GET(context);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error.type).toBe("server_error");
      expect(responseData.error.message).toBe("Internal server error");
    });

    it("should return service response with error field", async () => {
      const session = createMockSession("test-user-id");
      const context = createMockAPIContext(session);
      
      const mockSymptomsResponse = {
        data: null,
        error: "No symptoms found",
      };

      const { SymptomService } = await import("../../lib/services/symptom-service");
      const mockSymptomService = vi.mocked(SymptomService);
      mockSymptomService.prototype.getAllSymptoms = vi.fn().mockResolvedValue(mockSymptomsResponse);

      const response = await GET(context);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data).toBeNull();
      expect(responseData.error).toBe("No symptoms found");
    });
  });
});