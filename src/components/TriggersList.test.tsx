import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { TriggerAnalysisResponse } from "../types";

// Mock the useTriggerAnalysis hook
const mockFetchTriggers = vi.fn();
const mockReset = vi.fn();

vi.mock("./hooks/useTriggerAnalysis", () => ({
  useTriggerAnalysis: vi.fn(() => ({
    isLoading: false,
    error: null,
    data: null,
    fetchTriggers: mockFetchTriggers,
    reset: mockReset,
  })),
}));

// Import after mock
import { TriggersList } from "./TriggersList";
import { useTriggerAnalysis } from "./hooks/useTriggerAnalysis";

// Mock the Button component
vi.mock("./ui/button", () => ({
  Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

// Mock the Input component
vi.mock("./ui/input", () => ({
  Input: ({ value, onChange, type }: { value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string }) => (
    <input type={type} value={value} onChange={onChange} />
  ),
}));

describe("TriggersList Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock to default values
    vi.mocked(useTriggerAnalysis).mockReturnValue({
      isLoading: false,
      error: null,
      data: null,
      fetchTriggers: mockFetchTriggers,
      reset: mockReset,
    });
  });

  it("should render with default date range (last 30 days)", () => {
    render(<TriggersList />);

    expect(screen.getByText("Ingredient Trigger Analysis")).toBeInTheDocument();
    expect(screen.getByLabelText("Start Date")).toBeInTheDocument();
    expect(screen.getByLabelText("End Date")).toBeInTheDocument();
    expect(screen.getByText("Analyze Triggers")).toBeInTheDocument();
  });

  it("should update date inputs when user changes them", () => {
    render(<TriggersList />);

    const startDateInput = screen.getByLabelText("Start Date");
    const endDateInput = screen.getByLabelText("End Date");

    fireEvent.change(startDateInput, { target: { value: "2024-01-01" } });
    fireEvent.change(endDateInput, { target: { value: "2024-01-31" } });

    expect(startDateInput).toHaveValue("2024-01-01");
    expect(endDateInput).toHaveValue("2024-01-31");
  });

  it("should toggle detailed analysis checkbox", () => {
    render(<TriggersList />);

    const checkbox = screen.getByLabelText("Detailed Analysis");
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it("should call fetchTriggers with correct parameters when analyze button is clicked", () => {
    render(<TriggersList />);

    const analyzeButton = screen.getByText("Analyze Triggers");
    fireEvent.click(analyzeButton);

    expect(mockFetchTriggers).toHaveBeenCalledWith({
      start_date: expect.any(String),
      end_date: expect.any(String),
      limit: 10,
      detailed: false,
    });
  });

  it("should call fetchTriggers with detailed=true when detailed checkbox is checked", () => {
    render(<TriggersList />);

    const checkbox = screen.getByLabelText("Detailed Analysis");
    fireEvent.click(checkbox);

    const analyzeButton = screen.getByText("Analyze Triggers");
    fireEvent.click(analyzeButton);

    expect(mockFetchTriggers).toHaveBeenCalledWith({
      start_date: expect.any(String),
      end_date: expect.any(String),
      limit: 10,
      detailed: true,
    });
  });

  it("should display loading state", () => {
    vi.mocked(useTriggerAnalysis).mockReturnValue({
      isLoading: true,
      error: null,
      data: null,
      fetchTriggers: mockFetchTriggers,
      reset: mockReset,
    });

    render(<TriggersList />);

    const analyzeButton = screen.getByText("Analyzing...");
    expect(analyzeButton).toBeDisabled();
  });

  it("should display error message when there is an error", () => {
    vi.mocked(useTriggerAnalysis).mockReturnValue({
      isLoading: false,
      error: "Failed to fetch trigger analysis",
      data: null,
      fetchTriggers: mockFetchTriggers,
      reset: mockReset,
    });

    render(<TriggersList />);

    expect(screen.getByText("Failed to fetch trigger analysis")).toBeInTheDocument();
    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });

  it("should call reset when Try Again button is clicked", () => {
    vi.mocked(useTriggerAnalysis).mockReturnValue({
      isLoading: false,
      error: "Test error",
      data: null,
      fetchTriggers: mockFetchTriggers,
      reset: mockReset,
    });

    render(<TriggersList />);

    const tryAgainButton = screen.getByText("Try Again");
    fireEvent.click(tryAgainButton);

    expect(mockReset).toHaveBeenCalled();
  });

  it("should display trigger analysis results", () => {
    const mockData: TriggerAnalysisResponse = {
      triggers: [
        {
          ingredient_name: "tomatoes",
          trigger_score: 2.5,
          consumption_count: 10,
          avg_severity_when_present: 4.2,
          baseline_avg_severity: 2.1,
          confidence_interval: 0.8,
        },
      ],
      analysis_period: {
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        total_logs: 25,
        total_symptoms: 8,
      },
    };

    vi.mocked(useTriggerAnalysis).mockReturnValue({
      isLoading: false,
      error: null,
      data: mockData,
      fetchTriggers: mockFetchTriggers,
      reset: mockReset,
    });

    render(<TriggersList />);

    expect(screen.getByText("Analysis Results")).toBeInTheDocument();
    expect(screen.getByText(/Based on \d+ logs from/)).toBeInTheDocument();
    // Date format may vary by locale, use flexible matching that handles split text nodes
    const analysisText = screen.getByText(/Based on \d+ logs from/).textContent || "";
    expect(analysisText).toMatch(/1[./]0?1?[./]2024/);
    expect(analysisText).toMatch(/31[./]0?1?[./]2024/);

    // Check trigger results
    expect(screen.getByText("tomatoes")).toBeInTheDocument();
    expect(screen.getByText("+2.50")).toBeInTheDocument(); // trigger score
  });

  it("should display detailed correlations when available", () => {
    const mockData: TriggerAnalysisResponse = {
      triggers: [
        {
          ingredient_name: "tomatoes",
          trigger_score: 1,
          consumption_count: 5,
          avg_severity_when_present: 3,
          baseline_avg_severity: 2,
          confidence_interval: 0.7,
        },
      ],
      correlations: [
        {
          ingredient_name: "tomatoes",
          symptom_name: "rash",
          consumption_count: 5,
          symptom_occurrence_with_ingredient: 4,
          symptom_occurrence_without_ingredient: 1,
          baseline_symptom_rate: 0.2,
          trigger_score: 0.85,
          confidence_interval: 0.8,
        },
      ],
      analysis_period: {
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        total_logs: 25,
        total_symptoms: 8,
      },
    };

    vi.mocked(useTriggerAnalysis).mockReturnValue({
      isLoading: false,
      error: null,
      data: mockData,
      fetchTriggers: mockFetchTriggers,
      reset: mockReset,
    });

    render(<TriggersList />);

    expect(screen.getByText("Detailed Ingredient-Symptom Correlations")).toBeInTheDocument();
    expect(screen.getAllByText("tomatoes")).toHaveLength(2); // appears in both tables
    expect(screen.getByText("rash")).toBeInTheDocument();
    expect(screen.getByText("80.0%")).toBeInTheDocument(); // symptom rate (4/5 * 100)
  });

  it("should display empty state when no triggers are found", () => {
    const mockData: TriggerAnalysisResponse = {
      triggers: [],
      analysis_period: {
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        total_logs: 5,
        total_symptoms: 0,
      },
    };

    vi.mocked(useTriggerAnalysis).mockReturnValue({
      isLoading: false,
      error: null,
      data: mockData,
      fetchTriggers: mockFetchTriggers,
      reset: mockReset,
    });

    render(<TriggersList />);

    expect(screen.getByText("No trigger analysis available for the selected period.")).toBeInTheDocument();
    expect(screen.getByText(/Try selecting a longer date range/)).toBeInTheDocument();
  });

  it("should format trigger scores correctly", () => {
    const mockData: TriggerAnalysisResponse = {
      triggers: [
        {
          ingredient_name: "gluten",
          trigger_score: 3.14159,
          consumption_count: 8,
          avg_severity_when_present: 4.8,
          baseline_avg_severity: 2.5,
          confidence_interval: 0.9,
        },
      ],
      analysis_period: {
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        total_logs: 10,
        total_symptoms: 3,
      },
    };

    vi.mocked(useTriggerAnalysis).mockReturnValue({
      isLoading: false,
      error: null,
      data: mockData,
      fetchTriggers: mockFetchTriggers,
      reset: mockReset,
    });

    render(<TriggersList />);

    // Should format to 2 decimal places
    expect(screen.getByText("+3.14")).toBeInTheDocument();
  });
});
