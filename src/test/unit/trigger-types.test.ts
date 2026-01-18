import { describe, it, expect } from "vitest";
import type { TriggerAnalysis, IngredientSymptomCorrelation, TriggerAnalysisRequest, TriggerAnalysisResponse } from "../../types";

describe("Trigger Analysis Types", () => {
  describe("TriggerAnalysis", () => {
    it("should represent basic trigger analysis data", () => {
      const trigger: TriggerAnalysis = {
        ingredient_name: "dairy",
        consumption_count: 8,
        avg_severity_when_present: 3.5,
        baseline_avg_severity: 2.0,
        trigger_score: 1.5,
        confidence_interval: 0.8,
      };

      expect(trigger.ingredient_name).toBe("dairy");
      expect(trigger.consumption_count).toBe(8);
      expect(trigger.avg_severity_when_present).toBe(3.5);
      expect(trigger.baseline_avg_severity).toBe(2.0);
      expect(trigger.trigger_score).toBe(1.5);
      expect(trigger.confidence_interval).toBe(0.8);
    });

    it("should handle negative trigger scores", () => {
      const trigger: TriggerAnalysis = {
        ingredient_name: "protective_food",
        consumption_count: 5,
        avg_severity_when_present: 1.0,
        baseline_avg_severity: 2.5,
        trigger_score: -1.5, // Negative score indicates protective effect
        confidence_interval: 0.7,
      };

      expect(trigger.trigger_score).toBe(-1.5);
      expect(trigger.trigger_score < 0).toBe(true);
    });
  });

  describe("IngredientSymptomCorrelation", () => {
    it("should represent detailed ingredient-symptom correlation", () => {
      const correlation: IngredientSymptomCorrelation = {
        ingredient_name: "tomatoes",
        symptom_name: "rash",
        consumption_count: 5,
        symptom_occurrence_with_ingredient: 3,
        symptom_occurrence_without_ingredient: 1,
        baseline_symptom_rate: 0.2,
        trigger_score: 0.4,
        confidence_interval: 0.7,
      };

      expect(correlation.ingredient_name).toBe("tomatoes");
      expect(correlation.symptom_name).toBe("rash");
      expect(correlation.consumption_count).toBe(5);
      expect(correlation.symptom_occurrence_with_ingredient).toBe(3);
      expect(correlation.symptom_occurrence_without_ingredient).toBe(1);
      expect(correlation.baseline_symptom_rate).toBe(0.2);
      expect(correlation.trigger_score).toBe(0.4);
      expect(correlation.confidence_interval).toBe(0.7);
    });

    it("should allow calculation of symptom rate", () => {
      const correlation: IngredientSymptomCorrelation = {
        ingredient_name: "cabbage",
        symptom_name: "gas",
        consumption_count: 4,
        symptom_occurrence_with_ingredient: 3,
        symptom_occurrence_without_ingredient: 2,
        baseline_symptom_rate: 0.3,
        trigger_score: 0.45,
        confidence_interval: 0.6,
      };

      // Calculate symptom rate when ingredient is present
      const symptomRate = correlation.symptom_occurrence_with_ingredient / correlation.consumption_count;
      expect(symptomRate).toBe(0.75); // 75% of the time
    });
  });

  describe("TriggerAnalysisRequest", () => {
    it("should represent basic analysis request", () => {
      const request: TriggerAnalysisRequest = {
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        limit: 10,
      };

      expect(request.start_date).toBe("2024-01-01");
      expect(request.end_date).toBe("2024-01-31");
      expect(request.limit).toBe(10);
      expect(request.detailed).toBeUndefined();
    });

    it("should support detailed analysis request", () => {
      const request: TriggerAnalysisRequest = {
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        limit: 5,
        detailed: true,
      };

      expect(request.detailed).toBe(true);
    });

    it("should allow optional parameters", () => {
      const minimalRequest: TriggerAnalysisRequest = {
        start_date: "2024-01-01",
        end_date: "2024-01-31",
      };

      expect(minimalRequest.limit).toBeUndefined();
      expect(minimalRequest.detailed).toBeUndefined();
    });
  });

  describe("TriggerAnalysisResponse", () => {
    it("should represent basic analysis response", () => {
      const response: TriggerAnalysisResponse = {
        triggers: [
          {
            ingredient_name: "dairy",
            consumption_count: 8,
            avg_severity_when_present: 3.5,
            baseline_avg_severity: 2.0,
            trigger_score: 1.5,
            confidence_interval: 0.8,
          },
        ],
        analysis_period: {
          start_date: "2024-01-01",
          end_date: "2024-01-31",
          total_logs: 15,
        },
      };

      expect(response.triggers).toHaveLength(1);
      expect(response.triggers[0].ingredient_name).toBe("dairy");
      expect(response.analysis_period.total_logs).toBe(15);
      expect(response.correlations).toBeUndefined();
    });

    it("should support detailed response with correlations", () => {
      const response: TriggerAnalysisResponse = {
        triggers: [],
        correlations: [
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
        ],
        analysis_period: {
          start_date: "2024-01-01",
          end_date: "2024-01-31",
          total_logs: 10,
        },
      };

      expect(response.correlations).toHaveLength(1);
      expect(response.correlations[0].ingredient_name).toBe("tomatoes");
      expect(response.correlations[0].symptom_name).toBe("rash");
    });

    it("should handle empty results", () => {
      const response: TriggerAnalysisResponse = {
        triggers: [],
        analysis_period: {
          start_date: "2024-01-01",
          end_date: "2024-01-31",
          total_logs: 0,
        },
      };

      expect(response.triggers).toHaveLength(0);
      expect(response.analysis_period.total_logs).toBe(0);
    });

    it("should validate analysis period structure", () => {
      const response: TriggerAnalysisResponse = {
        triggers: [],
        analysis_period: {
          start_date: "2024-01-01",
          end_date: "2024-01-31",
          total_logs: 25,
        },
      };

      expect(response.analysis_period.start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(response.analysis_period.end_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof response.analysis_period.total_logs).toBe("number");
    });
  });

  describe("Type Compatibility", () => {
    it("should allow TriggerAnalysis in arrays", () => {
      const triggers: TriggerAnalysis[] = [
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

      expect(triggers).toHaveLength(2);
      expect(triggers.every((t) => typeof t.ingredient_name === "string")).toBe(true);
      expect(triggers.every((t) => typeof t.trigger_score === "number")).toBe(true);
    });

    it("should allow IngredientSymptomCorrelation in arrays", () => {
      const correlations: IngredientSymptomCorrelation[] = [
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

      expect(correlations).toHaveLength(2);
      expect(correlations.every((c) => typeof c.ingredient_name === "string")).toBe(true);
      expect(correlations.every((c) => typeof c.symptom_name === "string")).toBe(true);
    });
  });
});
