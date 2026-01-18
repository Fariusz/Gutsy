import type { Tables } from "./db/database.types";

// =============================================================================
// Database Entity Type Aliases
// =============================================================================

export type Symptom = Tables<"symptoms">;
export type Log = Tables<"logs">;
export type LogSymptom = Tables<"log_symptoms">;

// =============================================================================
// Trigger Analysis Types
// =============================================================================

export interface TriggerAnalysis {
  ingredient_name: string;
  consumption_count: number;
  avg_severity_when_present: number;
  baseline_avg_severity: number;
  trigger_score: number;
  confidence_interval: number;
}

export interface IngredientSymptomCorrelation {
  ingredient_name: string;
  symptom_name: string;
  correlation_strength: number;
  co_occurrence_count: number;
  total_ingredient_logs: number;
  total_symptom_logs: number;
}

export interface TriggerAnalysisRequest {
  start_date: string;
  end_date: string;
  limit?: number;
  detailed?: boolean; // Whether to return detailed symptom correlations
}

export interface TriggerAnalysisResponse {
  triggers: TriggerAnalysis[];
  correlations?: IngredientSymptomCorrelation[]; // Optional detailed correlations
  analysis_period: {
    start_date: string;
    end_date: string;
    total_logs: number;
  };
}

// =============================================================================
// Common Utility Types
// =============================================================================

/**
 * Reusable pagination metadata structure for paginated API responses
 */
export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

// =============================================================================
// Log Resource DTOs
// =============================================================================

/**
 * Symptom data for log creation
 */
export interface CreateLogSymptomItem {
  symptom_id: number;
  severity: number; // 1-5 scale
}

/**
 * Request payload for creating a new meal log
 */
export interface CreateLogRequest {
  log_date: string; // ISO date string (YYYY-MM-DD)
  notes?: string;
  ingredients: string[];
  symptoms: CreateLogSymptomItem[];
}

/**
 * Paginated response for logs listing
 */
export interface LogsListResponse {
  data: LogResponse[];
  meta: PaginationMeta;
}

// =============================================================================
// Error Handling
// =============================================================================

// =============================================================================
// Log Resource DTOs
// =============================================================================

/**
 * Ingredient data for log creation - simplified to just ingredient names
 */
export interface CreateLogIngredientItem {
  name: string;
}

/**
 * Symptom data for log creation
 */
export interface CreateLogSymptomItem {
  symptom_id: number;
  severity: number; // 1-5 scale
}

/**
 * Request payload for creating a new meal log
 * Derived from: logs + log_ingredients + log_symptoms entities
 */
export interface CreateLogRequest {
  log_date: string; // ISO date string (YYYY-MM-DD)
  notes?: string;
  ingredients: string[]; // Array of ingredient names
  symptoms: CreateLogSymptomItem[];
}

/**
 * Populated ingredient data in log responses
 * Simplified to work with ingredient_names text[] from database
 */
export interface LogIngredientResponse {
  name: string;
  source: "user_input"; // Always user input since no normalization
}

/**
 * Populated symptom data in log responses
 * Combines log_symptoms with symptoms entity data
 */
export interface LogSymptomResponse {
  symptom_id: number;
  name: string; // From symptoms.name
  severity: number; // From log_symptoms.severity
}

/**
 * Complete log data for API responses
 * Derived from: logs entity with populated ingredients and symptoms
 */
export interface LogResponse {
  id: string;
  user_id: string;
  log_date: string;
  notes?: string | null;
  meal_photo_url?: string | null; // Signed URL for meal photo
  created_at: string;
  ingredients: LogIngredientResponse[];
  symptoms: LogSymptomResponse[];
}

/**
 * Query parameters for listing logs
 */
export interface LogsQueryParams {
  start?: string; // ISO date string
  end?: string; // ISO date string
  page?: number; // Default: 1
  limit?: number; // Default: 20, max: 100
}

/**
 * Internal query model for repository layer
 */
export interface GetLogsQuery {
  userId: string;
  start?: string;
  end?: string;
  page: number;
  limit: number;
}

/**
 * Paginated response for logs listing
 */
export interface LogsListResponse {
  data: LogResponse[];
  meta: PaginationMeta;
}

// =============================================================================
// Ingredients Resource DTOs
// =============================================================================

/**
 * Query parameters for ingredient search
 */
export interface IngredientsQueryParams {
  search?: string;
  limit?: number; // Default: 100, max: 500
}

/**
 * Ingredient data for API responses
 * Derived from: ingredients entity with additional source metadata
 */
export interface IngredientResponse {
  id: number;
  name: string;
  source: "canonical"; // Indicates this is from canonical ingredient list
}

/**
 * Response payload for ingredients listing
 */
export interface IngredientsResponse {
  data: IngredientResponse[];
}

/**
 * Request payload for proposing new ingredients
 */
export interface ProposeIngredientRequest {
  name: string;
  notes?: string;
}

/**
 * Proposed ingredient data for API responses
 * Note: proposed_ingredients table not yet in database schema
 */
export interface ProposedIngredientResponse {
  id: number;
  name: string;
  status: "pending";
  user_id: string;
  created_at: string;
}

/**
 * Response payload for ingredient proposals
 */
export interface ProposeIngredientResponse {
  data: ProposedIngredientResponse;
}

// =============================================================================
// Symptoms Resource DTOs
// =============================================================================

/**
 * Symptom data for API responses
 * Derived from: symptoms entity, excluding created_at
 */
export interface SymptomResponse {
  id: number;
  name: string;
}

/**
 * Response payload for symptoms listing
 */
export interface SymptomsResponse {
  data: SymptomResponse[];
  error?: string;
}

// =============================================================================
// Triggers Resource DTOs
// =============================================================================

/**
 * Query parameters for trigger analysis
 */
export interface TriggersQueryParams {
  start?: string; // ISO date string, default: 30 days ago
  end?: string; // ISO date string, default: today
  limit?: number; // Default: 10, max: 50
}

/**
 * Confidence interval for statistical calculations
 */
export interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidence_level: number; // e.g., 0.95 for 95% confidence
}

/**
 * Date range for filtering and analysis
 */
export interface DateRange {
  start: string; // ISO date string
  end: string; // ISO date string
}

/**
 * Trigger analysis result for a single ingredient
 * Computed via get_top_triggers RPC function
 */
export interface TriggerResponse {
  ingredient_id: number;
  name: string; // From ingredients.name
  consumption_count: number;
  avg_severity_when_present: number;
  baseline_avg_severity: number;
  trigger_score: number;
  confidence_interval: ConfidenceInterval;
}

/**
 * Metadata for trigger analysis
 */
export interface TriggerAnalysisMeta {
  date_range: DateRange;
  total_logs: number;
  min_consumption_threshold: number;
  min_logs_threshold: number;
  confidence_level: number;
}

/**
 * Response payload for trigger analysis
 */
export interface TriggersResponse {
  data: TriggerResponse[];
  meta: TriggerAnalysisMeta;
}

// =============================================================================
// Error Response DTOs
// =============================================================================

/**
 * Validation error detail structure
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
}

/**
 * Error response structure for validation failures
 */
export interface ValidationErrorResponse {
  error: {
    type: "validation_error";
    message: string;
    details: ValidationErrorDetail[];
  };
}

/**
 * Error response structure for business logic failures
 */
export interface BusinessLogicErrorResponse {
  error: {
    type: "business_logic_error";
    message: string;
    details: string;
  };
}

/**
 * Error response structure for authorization failures
 */
export interface AuthorizationErrorResponse {
  error: {
    type: "authorization_error";
    message: string;
  };
}

/**
 * Union type for all possible error responses
 */
export type ErrorResponse = ValidationErrorResponse | BusinessLogicErrorResponse | AuthorizationErrorResponse;

// =============================================================================
// Success Response Wrapper
// =============================================================================

/**
 * Generic success response wrapper for single data items
 */
export interface SuccessResponse<T> {
  data: T;
}

/**
 * Generic success response wrapper for paginated data
 */
export interface PaginatedSuccessResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// =============================================================================
// Authentication DTOs
// =============================================================================

/**
 * Request payload for user registration
 */
export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Request payload for user login
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Request payload for password reset
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Response for successful authentication
 */
export interface AuthResponse {
  user: {
    id: string;
    email: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}
