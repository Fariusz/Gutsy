import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../../pages/api/triggers";
import { createMockAPIContext, createMockSession, mockSupabaseClient } from "../mocks/supabase";
import type { TriggerAnalysisResponse, IngredientSymptomCorrelation } from "../../types";

describe("Triggers API Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/triggers", () => {
    it("should return trigger analysis successfully with valid parameters", async () => {
      const session = createMockSession("test-user-id");
      const context = createMockAPIContext(session);

      // Mock URL with query parameters
      const mockUrl = new URL("http://localhost/api/triggers?start_date=2024-01-01&end_date=2024-01-31&limit=10");
      context.request.url = mockUrl.toString();

      // Mock RPC response for get_top_triggers
      const mockTriggersData = [
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
      ];

      // Mock the RPC calls - first call for get_top_triggers, second for get_ingredient_symptom_correlations
      mockSupabaseClient.rpc = vi.fn().mockResolvedValueOnce({
        data: mockTriggersData,
        error: null,
      });

      // Mock count query
      const mockFromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        count: vi.fn().mockResolvedValue({ count: 25, error: null }),
      };

      mockSupabaseClient.from = vi.fn(() => mockFromChain);

      const response = await GET(context);
      const responseData = (await response.json()) as TriggerAnalysisResponse;

      expect(response.status).toBe(200);
      expect(responseData.triggers).toEqual(mockTriggersData);
      expect(responseData.analysis_period).toEqual({
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        total_logs: 0,
      });
    });

    it("should return detailed correlations when detailed=true", async () => {
      const session = createMockSession("test-user-id");
      const context = createMockAPIContext(session);

      // Mock URL with detailed analysis
      const mockUrl = new URL(
        "http://localhost/api/triggers?start_date=2024-01-01&end_date=2024-01-31&limit=10&detailed=true"
      );
      context.request.url = mockUrl.toString();

      // Mock detailed correlations response
      const mockCorrelationsData: IngredientSymptomCorrelation[] = [
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
        {
          ingredient_name: "cabbage",
          symptom_name: "gas",
          consumption_count: 4,
          symptom_occurrence_with_ingredient: 3,
          symptom_occurrence_without_ingredient: 2,
          baseline_symptom_rate: 0.3,
          trigger_score: 0.45,
          confidence_interval: 0.6,
        },
      ];

      const mockTriggersData = [
        {
          ingredient_name: "tomatoes",
          consumption_count: 5,
          avg_severity_when_present: 3.0,
          baseline_avg_severity: 2.0,
          trigger_score: 1.0,
          confidence_interval: 0.7,
        },
      ];

      // Mock RPC calls - first call for detailed correlations, second for simplified triggers
      mockSupabaseClient.rpc = vi
        .fn()
        .mockResolvedValueOnce({ data: mockCorrelationsData, error: null })
        .mockResolvedValueOnce({ data: mockTriggersData, error: null });

      // Mock count query
      const mockFromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        count: vi.fn().mockResolvedValue({ count: 25, error: null }),
      };

      mockSupabaseClient.from = vi.fn(() => mockFromChain);

      const response = await GET(context);
      const responseData = (await response.json()) as TriggerAnalysisResponse;

      expect(response.status).toBe(200);
      expect(responseData.triggers).toEqual(mockTriggersData);
      expect(responseData.correlations).toEqual(mockCorrelationsData);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith("get_ingredient_symptom_correlations", {
        p_user_id: "test-user-id",
        p_start_date: "2024-01-01",
        p_end_date: "2024-01-31",
        p_limit: 20, // limit * 2
      });
    });

    it("should return 401 when user is not authenticated", async () => {
      const context = createMockAPIContext();
      context.locals.supabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const mockUrl = new URL("http://localhost/api/triggers?start_date=2024-01-01&end_date=2024-01-31");
      context.request.url = mockUrl.toString();

      const response = await GET(context);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe("Unauthorized");
    });

    it("should return 400 when query parameters are invalid", async () => {
      const session = createMockSession("test-user-id");
      const context = createMockAPIContext(session);

      // Mock URL with invalid date format
      const mockUrl = new URL("http://localhost/api/triggers?start_date=invalid-date&end_date=2024-01-31");
      context.request.url = mockUrl.toString();

      const response = await GET(context);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe("Invalid query parameters");
      expect(responseData.details).toBeDefined();
    });

    it("should handle RPC errors gracefully", async () => {
      const session = createMockSession("test-user-id");
      const context = createMockAPIContext(session);

      const mockUrl = new URL("http://localhost/api/triggers?start_date=2024-01-01&end_date=2024-01-31&limit=10");
      context.request.url = mockUrl.toString();

      // Mock RPC error
      mockSupabaseClient.rpc = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      // Mock count query (still needs to work)
      const mockFromChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        count: vi.fn().mockResolvedValue({ count: 25, error: null }),
      };

      mockSupabaseClient.from = vi.fn(() => mockFromChain);

      const response = await GET(context);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe("Failed to analyze triggers");
    });

    it("should handle detailed analysis RPC errors gracefully", async () => {
      const session = createMockSession("test-user-id");
      const context = createMockAPIContext(session);

      const mockUrl = new URL(
        "http://localhost/api/triggers?start_date=2024-01-01&end_date=2024-01-31&limit=10&detailed=true"
      );
      context.request.url = mockUrl.toString();

      // Mock detailed RPC error
      mockSupabaseClient.rpc = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Detailed analysis error" },
      });

      const response = await GET(context);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe("Failed to analyze detailed triggers");
    });
  });
});
