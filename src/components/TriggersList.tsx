import React, { useState, useEffect } from "react";
import { useTriggerAnalysis } from "./hooks/useTriggerAnalysis";
import { Button } from "./ui/button";
import { logger } from "../lib/utils/logger";

export function TriggersList() {
  logger.info("TriggersList component rendering...");

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showDetailed, setShowDetailed] = useState<boolean>(false);
  const { isLoading, error, data, fetchTriggers, reset } = useTriggerAnalysis();

  logger.debug("TriggersList state", { startDate, endDate, isLoading, error, data });

  // Set default date range to last 30 days
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    setEndDate(today.toISOString().split("T")[0]);
    setStartDate(thirtyDaysAgo.toISOString().split("T")[0]);
  }, []);

  const handleAnalyze = async () => {
    if (!startDate || !endDate) {
      return;
    }

    await fetchTriggers({
      start_date: startDate,
      end_date: endDate,
      limit: 10,
      detailed: showDetailed,
    });
  };

  const getTriggerScoreColor = (score: number) => {
    if (score > 1.5) return "text-red-600";
    if (score > 0.5) return "text-orange-500";
    return "text-green-600";
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence > 0.8) return { text: "High", color: "text-green-600" };
    if (confidence > 0.5) return { text: "Medium", color: "text-orange-500" };
    return { text: "Low", color: "text-red-600" };
  };

  const formatTriggerScore = (score: number) => {
    if (score > 0) return `+${score.toFixed(2)}`;
    return score.toFixed(2);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Ingredient Trigger Analysis</h1>

      {/* Date Range Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Analysis Period</h2>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col justify-end">
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={showDetailed}
                onChange={(e) => setShowDetailed(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Detailed Analysis</span>
            </label>
          </div>
          <Button onClick={handleAnalyze} disabled={isLoading || !startDate || !endDate} className="px-6">
            {isLoading ? "Analyzing..." : "Analyze Triggers"}
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <p className="text-red-600">{error}</p>
          <Button onClick={reset} variant="outline" className="mt-2">
            Try Again
          </Button>
        </div>
      )}

      {/* Simplified Results */}
      {data && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Analysis Results</h2>
            <p className="text-gray-600">
              Based on {data.analysis_period.total_logs} logs from{" "}
              {new Date(data.analysis_period.start_date).toLocaleDateString()} to{" "}
              {new Date(data.analysis_period.end_date).toLocaleDateString()}
            </p>
          </div>

          {data.triggers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No trigger analysis available for the selected period.</p>
              <p className="text-sm text-gray-400">
                Try selecting a longer date range or log more meals with symptoms.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold">Ingredient</th>
                    <th className="text-left py-3 px-4 font-semibold">Consumption Count</th>
                    <th className="text-left py-3 px-4 font-semibold">Avg Severity When Present</th>
                    <th className="text-left py-3 px-4 font-semibold">Trigger Score</th>
                    <th className="text-left py-3 px-4 font-semibold">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {data.triggers.map((trigger, index) => {
                    const confidenceLevel = getConfidenceLevel(1 - trigger.confidence_interval);
                    return (
                      <tr key={trigger.ingredient_name} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                        <td className="py-3 px-4 font-medium">{trigger.ingredient_name}</td>
                        <td className="py-3 px-4">{trigger.consumption_count}</td>
                        <td className="py-3 px-4">
                          {trigger.avg_severity_when_present.toFixed(2)}
                          <span className="text-gray-500 text-sm ml-2">
                            (baseline: {trigger.baseline_avg_severity.toFixed(2)})
                          </span>
                        </td>
                        <td className={`py-3 px-4 font-semibold ${getTriggerScoreColor(trigger.trigger_score)}`}>
                          {formatTriggerScore(trigger.trigger_score)}
                        </td>
                        <td className={`py-3 px-4 ${confidenceLevel.color}`}>{confidenceLevel.text}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {data.triggers.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">How to read these results:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  <strong>Trigger Score:</strong> Higher positive scores suggest the ingredient may worsen symptoms
                </li>
                <li>
                  <strong>Confidence:</strong> Higher confidence means more reliable results (based on data quantity)
                </li>
                <li>
                  <strong>Consumption Count:</strong> How many times you&apos;ve logged this ingredient
                </li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Detailed Correlations View */}
      {data?.correlations?.length && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Detailed Ingredient-Symptom Correlations</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold">Ingredient</th>
                  <th className="text-left py-3 px-4 font-semibold">Symptom</th>
                  <th className="text-left py-3 px-4 font-semibold">Consumption Count</th>
                  <th className="text-left py-3 px-4 font-semibold">Symptom Rate</th>
                  <th className="text-left py-3 px-4 font-semibold">Trigger Score</th>
                  <th className="text-left py-3 px-4 font-semibold">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {data.correlations.map((correlation, index) => {
                  const confidenceLevel = getConfidenceLevel(correlation.confidence_interval);
                  const symptomRate =
                    correlation.consumption_count > 0
                      ? (correlation.symptom_occurrence_with_ingredient / correlation.consumption_count) * 100
                      : 0;

                  return (
                    <tr
                      key={`${correlation.ingredient_name}-${correlation.symptom_name}`}
                      className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                    >
                      <td className="py-3 px-4 font-medium">{correlation.ingredient_name}</td>
                      <td className="py-3 px-4">{correlation.symptom_name}</td>
                      <td className="py-3 px-4">{correlation.consumption_count}</td>
                      <td className="py-3 px-4">
                        {symptomRate.toFixed(1)}%
                        <span className="text-gray-500 text-sm ml-2">
                          ({correlation.symptom_occurrence_with_ingredient}/{correlation.consumption_count})
                        </span>
                      </td>
                      <td className={`py-3 px-4 font-semibold ${getTriggerScoreColor(correlation.trigger_score)}`}>
                        {formatTriggerScore(correlation.trigger_score)}
                      </td>
                      <td className={`py-3 px-4 ${confidenceLevel.color}`}>{confidenceLevel.text}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2">Detailed Analysis Insights:</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>
                <strong>Symptom Rate:</strong> Percentage of times you experienced this symptom when consuming this
                ingredient
              </li>
              <li>
                <strong>Specific Correlations:</strong> Shows exactly which ingredients trigger which symptoms
              </li>
              <li>
                <strong>Example:</strong> &quot;Tomatoes cause rash 60% of the time&quot; vs &quot;Cabbage causes gas
                80% of the time&quot;
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
