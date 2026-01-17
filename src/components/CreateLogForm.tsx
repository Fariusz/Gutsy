import React, { useState, useCallback, memo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useCreateLog } from "./hooks/useCreateLog";
import { useSymptoms } from "./hooks/useSymptoms";
import { formatSymptomName } from "../lib/utils";
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

// Memoized component for individual symptom items to prevent unnecessary re-renders
const SymptomItem = memo(function SymptomItem({
  symptom,
  onRemove,
}: {
  symptom: FormSymptom;
  onRemove: (symptomId: number) => void;
}) {
  const handleRemove = useCallback(() => {
    onRemove(symptom.symptomId);
  }, [onRemove, symptom.symptomId]);

  return (
    <li key={symptom.symptomId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div>
        <span className="font-medium">{formatSymptomName(symptom.symptomName)}</span>
        <span className="ml-2 text-sm text-gray-600">Severity: {symptom.severity}/5</span>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleRemove}
        aria-label={`Remove ${symptom.symptomName} symptom`}
      >
        Remove
      </Button>
    </li>
  );
});

// Form validation schema
const createLogSchema = z.object({
  log_date: z
    .string()
    .min(1, "Date is required")
    .refine((val) => !Number.isNaN(Date.parse(val)), {
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

type CreateLogFormData = z.infer<typeof createLogSchema>;

export default memo(function CreateLogForm({ onSuccess }: CreateLogFormProps) {
  const getSymptomStatusText = () => {
    if (symptomsLoading) return "Loading...";
    if (symptomsError) return `Error: ${symptomsError}`;
    if (symptoms.length === 0) return "No symptoms found";
    return `Loaded: ${symptoms.length} symptoms`;
  };

  const getSymptomSelectorPlaceholder = () => {
    if (symptomsLoading) return "Loading...";
    if (symptomsError) return "Error loading symptoms";
    if (symptoms.length === 0) return "No symptoms available";
    return "Select symptom";
  };

  const getSeverityLabel = (severity: number) => {
    switch (severity) {
      case 1:
        return "Very Mild";
      case 2:
        return "Mild";
      case 3:
        return "Moderate";
      case 4:
        return "Severe";
      case 5:
        return "Very Severe";
      default:
        return "Unknown";
    }
  };
  const [selectedSymptoms, setSelectedSymptoms] = useState<FormSymptom[]>([]);
  const [symptomSelector, setSymptomSelector] = useState<SymptomSelectorState>({
    selectedSymptomId: "",
    selectedSeverity: "",
  });
  const [isSymptomSelected, setIsSymptomSelected] = useState(false);

  const { symptoms, isLoading: symptomsLoading, error: symptomsError } = useSymptoms();
  const { isLoading, error, isSuccess, createLog, reset } = useCreateLog();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CreateLogFormData>({
    resolver: zodResolver(createLogSchema),
    defaultValues: {
      log_date: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
      ingredients: "",
      notes: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    const symptomIdNum = Number.parseInt(symptomSelector.selectedSymptomId);
    if (!Number.isNaN(symptomIdNum)) {
      setIsSymptomSelected(selectedSymptoms.some((s) => s.symptomId === symptomIdNum));
    } else {
      setIsSymptomSelected(false);
    }
  }, [symptomSelector.selectedSymptomId, selectedSymptoms]);

  const handleAddSymptom = () => {
    const symptomIdNum = Number.parseInt(symptomSelector.selectedSymptomId);
    const severityNum = Number.parseInt(symptomSelector.selectedSeverity);

    if (Number.isNaN(symptomIdNum) || Number.isNaN(severityNum) || severityNum < 1 || severityNum > 5) {
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
          symptomName: formatSymptomName(symptom.name),
          severity: severityNum,
        },
      ]);
    }

    // Reset selector state
    setSymptomSelector({ selectedSymptomId: "", selectedSeverity: "" });
  };

  const handleRemoveSymptom = useCallback((symptomId: number) => {
    setSelectedSymptoms((prev) => prev.filter((s) => s.symptomId !== symptomId));
  }, []);

  const prepareLogData = (data: CreateLogFormData): CreateLogRequest => {
    const ingredientList = data.ingredients
      .split(",")
      .map((ing) => ing.trim())
      .filter((ing) => ing.length > 0);

    return {
      log_date: data.log_date,
      notes: data.notes?.trim() || undefined,
      ingredients: ingredientList,
      symptoms: selectedSymptoms.map((s) => ({
        symptom_id: s.symptomId,
        severity: s.severity,
      })),
    };
  };

  const onSubmit = async (data: CreateLogFormData) => {
    reset();
    const logData = prepareLogData(data);

    const result = await createLog(logData);
    if (result && onSuccess) {
      onSuccess(result.id);
    } else if (result) {
      // Use window.location.href instead of globalThis.location.href
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
    <>
      {/* Screen reader announcements for dynamic content */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isLoading && "Creating log..."}
        {isSuccess && "Log created successfully!"}
        {error && `Error: ${error}`}
        {symptomsLoading && "Loading symptoms..."}
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 max-w-2xl mx-auto p-6"
        aria-label="Create new meal log"
        data-test-id="create-log-form"
      >
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
            aria-describedby={errors.log_date ? "date-error" : undefined}
            data-test-id="log-date-input"
          />
          {errors.log_date && (
            <p id="date-error" className="text-sm text-red-600" role="alert">
              {errors.log_date.message}
            </p>
          )}
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
            aria-describedby="ingredients-help ingredients-error"
            data-test-id="ingredients-input"
          />
          {errors.ingredients && (
            <p id="ingredients-error" className="text-sm text-red-600" role="alert">
              {errors.ingredients.message}
            </p>
          )}
          <p id="ingredients-help" className="text-xs text-gray-500">
            Separate multiple ingredients with commas
          </p>
        </div>

        <fieldset className="space-y-4">
          <legend className="text-sm font-medium text-gray-700">Symptoms</legend>

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
          <fieldset className="space-y-4 p-4 border border-gray-200 rounded-lg">
            <legend className="sr-only">Add Symptom to Log</legend>
            {/* Debug info - only show if there are issues */}
            {(symptomsLoading || symptomsError || symptoms.length === 0) && (
              <div className="p-3 bg-gray-100 rounded text-sm">
                <strong>Symptoms Status:</strong> {getSymptomStatusText()}
                {symptoms.length > 0 && (
                  <div className="mt-1 text-xs text-gray-600">
                    Available: {symptoms.map((s) => formatSymptomName(s.name)).join(", ")}
                  </div>
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
                  aria-label="Select symptom type"
                  data-test-id="symptom-select"
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={getSymptomSelectorPlaceholder()} />
                  </SelectTrigger>
                  <SelectContent
                    className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white dark:bg-gray-800 text-gray-950 dark:text-gray-100 shadow-md"
                    position="popper"
                    sideOffset={4}
                  >
                    {symptoms.map((symptom) => (
                      <SelectItem key={symptom.id} value={symptom.id.toString()}>
                        {formatSymptomName(symptom.name)}
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
                  disabled={!symptomSelector.selectedSymptomId}
                  aria-label="Select symptom severity level"
                  data-test-id="severity-select"
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
                        {severity} - {getSeverityLabel(severity)}
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
                  data-test-id="add-symptom-button"
                >
                  {isSymptomSelected ? "Update Symptom" : "Add Symptom"}
                </Button>
              </div>
            </div>
          </fieldset>

          {/* Selected Symptoms List */}
          {selectedSymptoms.length > 0 && (
            <div className="space-y-2">
              <h4 id="selected-symptoms-heading" className="text-sm font-medium text-gray-700">
                Selected Symptoms ({selectedSymptoms.length})
              </h4>
              <ul className="space-y-2">
                {selectedSymptoms.map((symptom) => (
                  <SymptomItem key={symptom.symptomId} symptom={symptom} onRemove={handleRemoveSymptom} />
                ))}
              </ul>
            </div>
          )}
        </fieldset>

        <div className="space-y-2">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes (optional)
          </label>
          <Textarea
            id="notes"
            {...register("notes")}
            placeholder="Add any additional notes about your meal..."
            className="min-h-[100px]"
            aria-describedby="notes-help"
            data-test-id="notes-textarea"
          />
          {errors.notes && <p className="text-sm text-red-600">{errors.notes.message}</p>}
        </div>

        {Object.keys(errors).length > 0 && (
          <div
            className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg dark:text-red-400 dark:bg-red-900/20 dark:border-red-800"
            role="alert"
            aria-labelledby="form-errors-heading"
          >
            <h3 id="form-errors-heading" className="font-medium mb-2">
              Please correct the following errors:
            </h3>
            <ul className="list-disc list-inside space-y-1">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>{error?.message}</li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        {isSuccess && (
          <output className="block p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg">
            Log created successfully!
          </output>
        )}

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isLoading || !isValid}
            className="flex-1"
            data-test-id="create-log-submit-button"
          >
            {isLoading ? "Creating Log..." : "Create Log"}
          </Button>
          <Button type="button" variant="outline" onClick={() => globalThis.history.back()} className="px-6">
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
});
