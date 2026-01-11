import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TriggersList } from "./TriggersList";
import type { TriggerAnalysisResponse } from "../types";

// Mock the useTriggerAnalysis hook
const mockFetchTriggers = vi.fn();
const mockReset = vi.fn();

const mockUseTriggerAnalysis = vi.fn(() => ({
  isLoading: false,
  error: null,
  data: null,
  fetchTriggers: mockFetchTriggers,
  reset: mockReset,
}));

vi.mock("./hooks/useTriggerAnalysis", () => ({
  useTriggerAnalysis: mockUseTriggerAnalysis,
}));

// Mock the Button component
vi.mock("./ui/button", () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

// Mock the Input component
vi.mock("./ui/input", () => ({
  Input: ({ value, onChange, type }: any) => <input type={type} value={value} onChange={onChange} />,
}));

describe("TriggersList Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTriggerAnalysis.mockReturnValue({
      isLoading: false,
      error: null,
      data: null,
      fetchTriggers: mockFetchTriggers,
      reset: mockReset,
    });
  });

  it("should render with default date range (last 30 days)", () => {
    render(<TriggersList />);

    expect(screen.getByText("Trigger Analysis")).toBeInTheDocument();
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

    const checkbox = screen.getByLabelText("Show detailed ingredient-symptom correlations");
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it("should call fetchTriggers with correct parameters when analyze button is clicked", () => {
    render(<TriggersList />);

    const analyzeButton = screen.getByText("Analyze Triggers");
    fireEvent.click(analyzeButton);

    expect(mockFetchTriggers).toHaveBeenCalledWith(expect.any(String), expect.any(String), false);
  });

  it("should call fetchTriggers with detailed=true when detailed checkbox is checked", () => {
    render(<TriggersList />);

    const checkbox = screen.getByLabelText("Show detailed ingredient-symptom correlations");
    fireEvent.click(checkbox);

    const analyzeButton = screen.getByText("Analyze Triggers");
    fireEvent.click(analyzeButton);

    expect(mockFetchTriggers).toHaveBeenCalledWith(expect.any(String), expect.any(String), true);
  });

  it("should display loading state", () => {
    mockUseTriggerAnalysis.mockReturnValue({
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
    mockUseTriggerAnalysis.mockReturnValue({
      isLoading: false,
      error: "Failed to fetch trigger analysis",
      data: null,
      fetchTriggers: mockFetchTriggers,
      reset: mockReset,
    });

    render(<TriggersList />);

    expect(screen.getByText("Error: Failed to fetch trigger analysis")).toBeInTheDocument();
    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });

  it("should call reset when Try Again button is clicked", () => {
    mockUseTriggerAnalysis.mockReturnValue({
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

    mockUseTriggerAnalysis.mockReturnValue({
      isLoading: false,
      error: null,
      data: mockData,
      fetchTriggers: mockFetchTriggers,
      reset: mockReset,
    });

    render(<TriggersList />);

    expect(screen.getByText("Analysis Results")).toBeInTheDocument();
    expect(screen.getByText("Period: 2024-01-01 to 2024-01-31")).toBeInTheDocument();
    expect(screen.getByText("Total Logs: 25, Symptoms Tracked: 8")).toBeInTheDocument();

    // Check trigger results
    expect(screen.getByText("tomatoes")).toBeInTheDocument();
    expect(screen.getByText("2.50")).toBeInTheDocument(); // trigger score
  });

  it("should display detailed correlations when available", () => {
    const mockData: TriggerAnalysisResponse = {
      triggers: [
        {
          ingredient_name: "tomatoes",
          trigger_score: 1.0,
          consumption_count: 5,
          avg_severity_when_present: 3,
          confidence_interval: 0.7,
        },
      ],
      correlations: [
        {
          ingredient_name: "tomatoes",
          symptom_name: "rash",
          correlation_strength: 0.85,
          consumption_with_symptom: 4,
          total_consumptions: 5,
          avg_severity_with_ingredient: 4.2,
          avg_severity_without_ingredient: 1.8,
        },
      ],
      analysis_period: {
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        total_logs: 25,
        total_symptoms: 8,
      },
    };

    mockUseTriggerAnalysis.mockReturnValue({
      isLoading: false,
      error: null,
      data: mockData,
      fetchTriggers: mockFetchTriggers,
      reset: mockReset,
    });

    render(<TriggersList />);

    expect(screen.getByText("Detailed Correlations")).toBeInTheDocument();
    expect(screen.getByText("tomatoes → rash")).toBeInTheDocument();
    expect(screen.getByText("85%")).toBeInTheDocument(); // correlation strength
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

    mockUseTriggerAnalysis.mockReturnValue({
      isLoading: false,
      error: null,
      data: mockData,
      fetchTriggers: mockFetchTriggers,
      reset: mockReset,
    });

    render(<TriggersList />);

    expect(screen.getByText("No Triggers Found")).toBeInTheDocument();
    expect(screen.getByText(/No significant ingredient-symptom correlations were found/)).toBeInTheDocument();
  });

  it("should format trigger scores correctly", () => {
    const mockData: TriggerAnalysisResponse = {
      triggers: [
        {
          ingredient_name: "gluten",
          trigger_score: 3.14159,
          consumption_count: 8,
          avg_severity_when_present: 4.8,
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

    mockUseTriggerAnalysis.mockReturnValue({
      isLoading: false,
      error: null,
      data: mockData,
      fetchTriggers: mockFetchTriggers,
      reset: mockReset,
    });

    render(<TriggersList />);

    // Should format to 2 decimal places
    expect(screen.getByText("3.14")).toBeInTheDocument();
  });
});
