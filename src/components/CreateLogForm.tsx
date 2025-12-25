import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useCreateLog } from "./hooks/useCreateLog";
import { useSymptoms } from "./hooks/useSymptoms";
import type { CreateLogRequest, CreateLogSymptomItem } from "../types";

interface CreateLogFormProps {
  onSuccess?: (logId: string) => void;
}

interface FormSymptom {
  symptomId: number;
  symptomName: string;
  severity: number;
}

interface SymptomSelectorState {
  selectedSymptomId: string;
  selectedSeverity: string;
}

export default function CreateLogForm({ onSuccess }: CreateLogFormProps) {
  const [logDate, setLogDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // YYYY-MM-DD format
  });
  const [ingredients, setIngredients] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<FormSymptom[]>([]);
  const [symptomSelector, setSymptomSelector] = useState<SymptomSelectorState>({
    selectedSymptomId: "",
    selectedSeverity: "",
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const { symptoms, isLoading: symptomsLoading, error: symptomsError } = useSymptoms();
  const { isLoading, error, isSuccess, createLog, reset } = useCreateLog();

  const handleAddSymptom = () => {
    const symptomIdNum = parseInt(symptomSelector.selectedSymptomId);
    const severityNum = parseInt(symptomSelector.selectedSeverity);

    if (isNaN(symptomIdNum) || isNaN(severityNum) || severityNum < 1 || severityNum > 5) {
      return;
    }

    const symptom = symptoms.find((s) => s.id === symptomIdNum);
    if (!symptom) return;

    // Check if symptom is already added
    if (selectedSymptoms.some((s) => s.symptomId === symptomIdNum)) {
      // Update existing symptom severity
      setSelectedSymptoms((prev) =>
        prev.map((s) => (s.symptomId === symptomIdNum ? { ...s, severity: severityNum } : s))
      );
    } else {
      // Add new symptom
      setSelectedSymptoms((prev) => [
        ...prev,
        {
          symptomId: symptomIdNum,
          symptomName: symptom.name,
          severity: severityNum,
        },
      ]);
    }

    // Reset selector state
    setSymptomSelector({ selectedSymptomId: "", selectedSeverity: "" });
  };

  const handleRemoveSymptom = (symptomId: number) => {
    setSelectedSymptoms((prev) => prev.filter((s) => s.symptomId !== symptomId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    setFormErrors([]);

    // Validate form
    const errors: string[] = [];

    if (!logDate) {
      errors.push("Date is required");
    }

    const ingredientList = ingredients
      .split(",")
      .map((ing) => ing.trim())
      .filter((ing) => ing.length > 0);

    if (ingredientList.length === 0) {
      errors.push("At least one ingredient is required");
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    const logData: CreateLogRequest = {
      log_date: logDate,
      notes: notes.trim() || undefined,
      ingredients: ingredientList,
      symptoms: selectedSymptoms.map((s) => ({
        symptom_id: s.symptomId,
        severity: s.severity,
      })),
    };

    const result = await createLog(logData);
    if (result && onSuccess) {
      onSuccess(result.id);
    } else if (result) {
      // Default redirect to home page if no onSuccess callback provided
      window.location.href = "/";
    }
  };

  if (symptomsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-gray-600">Loading symptoms...</div>
      </div>
    );
  }

  if (symptomsError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-red-600">Error loading symptoms: {symptomsError}</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6">
      <div className="space-y-2">
        <label htmlFor="logDate" className="block text-sm font-medium text-gray-700">
          Date
        </label>
        <Input
          id="logDate"
          type="date"
          value={logDate}
          onChange={(e) => setLogDate(e.target.value)}
          required
          max={new Date().toISOString().split("T")[0]}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="ingredients" className="block text-sm font-medium text-gray-700">
          Ingredients
        </label>
        <Input
          id="ingredients"
          type="text"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="Enter ingredients separated by commas (e.g., tomatoes, cheese, basil)"
          required
          className="w-full"
        />
        <p className="text-xs text-gray-500">Separate multiple ingredients with commas</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Symptoms</h3>

        {/* Add Symptom Form */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg">
          <div className="space-y-1">
            <label className="block text-xs text-gray-600">Symptom</label>
            <Select
              value={symptomSelector.selectedSymptomId}
              onValueChange={(value) => setSymptomSelector((prev) => ({ ...prev, selectedSymptomId: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select symptom" />
              </SelectTrigger>
              <SelectContent>
                {symptoms.map((symptom) => (
                  <SelectItem key={symptom.id} value={symptom.id.toString()}>
                    {symptom.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs text-gray-600">Severity (1-5)</label>
            <Select
              value={symptomSelector.selectedSeverity}
              onValueChange={(value) => setSymptomSelector((prev) => ({ ...prev, selectedSeverity: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((severity) => (
                  <SelectItem key={severity} value={severity.toString()}>
                    {severity} -{" "}
                    {severity === 1
                      ? "Very Mild"
                      : severity === 2
                        ? "Mild"
                        : severity === 3
                          ? "Moderate"
                          : severity === 4
                            ? "Severe"
                            : "Very Severe"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSymptom}
              disabled={!symptomSelector.selectedSymptomId || !symptomSelector.selectedSeverity}
              className="w-full"
            >
              Add Symptom
            </Button>
          </div>

          <div className="flex items-end">
            <div className="text-xs text-gray-500">Select symptom and severity, then click Add</div>
          </div>
        </div>

        {/* Selected Symptoms List */}
        {selectedSymptoms.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Selected Symptoms</h4>
            <div className="space-y-2">
              {selectedSymptoms.map((symptom) => (
                <div key={symptom.symptomId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium">{symptom.symptomName}</span>
                    <span className="ml-2 text-sm text-gray-600">Severity: {symptom.severity}/5</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveSymptom(symptom.symptomId)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes (optional)
        </label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional notes about your meal or symptoms..."
          rows={3}
          className="w-full"
        />
      </div>

      {formErrors.length > 0 && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
          <ul className="list-disc list-inside space-y-1">
            {formErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">Error: {error}</div>
      )}

      {isSuccess && (
        <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg">
          Log created successfully!
        </div>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading || !logDate || !ingredients.trim()} className="flex-1">
          {isLoading ? "Creating Log..." : "Create Log"}
        </Button>
        <Button type="button" variant="outline" onClick={() => window.history.back()} className="px-6">
          Cancel
        </Button>
      </div>
    </form>
  );
}
