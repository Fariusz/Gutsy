import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useCreateLog } from "./hooks/useCreateLog";
import { useSymptoms } from "./hooks/useSymptoms";
import type { CreateLogRequest } from "../types";

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

// Form validation schema
const createLogSchema = z.object({
  log_date: z
    .string()
    .min(1, "Date is required")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }),
  ingredients: z
    .string()
    .min(1, "At least one ingredient is required")
    .refine((val) => {
      const ingredientList = val
        .split(",")
        .map((ing) => ing.trim())
        .filter((ing) => ing.length > 0);
      return ingredientList.length > 0;
    }, "At least one ingredient is required"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof createLogSchema>;

export default function CreateLogForm({ onSuccess }: CreateLogFormProps) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<FormSymptom[]>([]);
  const [symptomSelector, setSymptomSelector] = useState<SymptomSelectorState>({
    selectedSymptomId: "",
    selectedSeverity: "",
  });

  const { symptoms, isLoading: symptomsLoading, error: symptomsError } = useSymptoms();
  const { isLoading, error, isSuccess, createLog, reset } = useCreateLog();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(createLogSchema),
    defaultValues: {
      log_date: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
      ingredients: "",
      notes: "",
    },
    mode: "onChange",
  });

  // Watch form values for real-time validation

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

  const onSubmit = async (data: FormData) => {
    reset();

    const ingredientList = data.ingredients
      .split(",")
      .map((ing) => ing.trim())
      .filter((ing) => ing.length > 0);

    const logData: CreateLogRequest = {
      log_date: data.log_date,
      notes: data.notes?.trim() || undefined,
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
      // Redirect to logs page to see the newly created log
      window.location.href = "/logs";
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto p-6">
      <div className="space-y-2">
        <label htmlFor="logDate" className="block text-sm font-medium text-gray-700">
          Date
        </label>
        <Input
          id="logDate"
          type="date"
          {...register("log_date")}
          max={new Date().toISOString().split("T")[0]}
          className="w-full"
        />
        {errors.log_date && <p className="text-sm text-red-600">{errors.log_date.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="ingredients" className="block text-sm font-medium text-gray-700">
          Ingredients
        </label>
        <Input
          id="ingredients"
          type="text"
          {...register("ingredients")}
          placeholder="Enter ingredients separated by commas (e.g., tomatoes, cheese, basil)"
          className="w-full"
        />
        {errors.ingredients && <p className="text-sm text-red-600">{errors.ingredients.message}</p>}
        <p className="text-xs text-gray-500">Separate multiple ingredients with commas</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Symptoms</h3>

        {/* Show loading/error states for symptoms */}
        {symptomsLoading && (
          <div className="p-3 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg">
            Loading symptoms...
          </div>
        )}

        {symptomsError && (
          <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            Error loading symptoms: {symptomsError}
          </div>
        )}

        {/* Add Symptom Form */}
        <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
          {/* Debug info - only show if there are issues */}
          {(symptomsLoading || symptomsError || symptoms.length === 0) && (
            <div className="p-3 bg-gray-100 rounded text-sm">
              <strong>Symptoms Status:</strong>{" "}
              {symptomsLoading
                ? "Loading..."
                : symptomsError
                  ? `Error: ${symptomsError}`
                  : symptoms.length === 0
                    ? "No symptoms found"
                    : `Loaded: ${symptoms.length} symptoms`}
              {symptoms.length > 0 && (
                <div className="mt-1 text-xs text-gray-600">Available: {symptoms.map((s) => s.name).join(", ")}</div>
              )}
            </div>
          )}

          {/* Form fields in stable layout */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="symptom-selector" className="block text-xs text-gray-600">
                Symptom
              </label>
              <Select
                value={symptomSelector.selectedSymptomId}
                onValueChange={(value) => {
                  setSymptomSelector((prev) => ({ ...prev, selectedSymptomId: value }));
                }}
                disabled={symptomsLoading || symptomsError !== null || symptoms.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      symptomsLoading
                        ? "Loading..."
                        : symptomsError
                          ? "Error loading symptoms"
                          : symptoms.length === 0
                            ? "No symptoms available"
                            : "Select symptom"
                    }
                  />
                </SelectTrigger>
                <SelectContent
                  className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white dark:bg-gray-800 text-gray-950 dark:text-gray-100 shadow-md"
                  position="popper"
                  sideOffset={4}
                >
                  {symptoms.map((symptom) => (
                    <SelectItem key={symptom.id} value={symptom.id.toString()}>
                      {symptom.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label htmlFor="severity-selector" className="block text-xs text-gray-600">
                Severity (1-5)
              </label>
              <Select
                value={symptomSelector.selectedSeverity}
                onValueChange={(value) => {
                  setSymptomSelector((prev) => ({ ...prev, selectedSeverity: value }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent
                  className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white dark:bg-gray-800 text-gray-950 dark:text-gray-100 shadow-md"
                  position="popper"
                  sideOffset={4}
                >
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

            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSymptom}
                disabled={!symptomSelector.selectedSymptomId || !symptomSelector.selectedSeverity}
                className="px-6"
              >
                Add Symptom
              </Button>
            </div>
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
          {...register("notes")}
          placeholder="Any additional notes about your meal or symptoms..."
          rows={3}
          className="w-full"
        />
        {errors.notes && <p className="text-sm text-red-600">{errors.notes.message}</p>}
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg dark:text-red-400 dark:bg-red-900/20 dark:border-red-800">
          <ul className="list-disc list-inside space-y-1">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>{error?.message}</li>
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
        <Button type="submit" disabled={isLoading || !isValid} className="flex-1">
          {isLoading ? "Creating Log..." : "Create Log"}
        </Button>
        <Button type="button" variant="outline" onClick={() => window.history.back()} className="px-6">
          Cancel
        </Button>
      </div>
    </form>
  );
}
