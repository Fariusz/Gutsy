import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { LogResponse, LogSymptomResponse, LogIngredientResponse, GetLogsQuery } from "../../types";
import type { CreateLogCommand } from "./log-service";

/**
 * Repository for log database operations
 */
export class LogRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Create a new log with associated ingredients and symptoms
   * @param logData - Log creation command data
   * @returns Created log ID
   */
  async createLogWithAssociations(logData: CreateLogCommand): Promise<string> {
    try {
      // Start by creating the main log entry
      const { data: logResult, error: logError } = await this.supabase
        .from("logs")
        .insert({
          user_id: logData.userId,
          log_date: logData.logDate,
          notes: logData.notes || null,
          ingredient_names: logData.ingredients, // Keep backwards compatibility
        })
        .select("id")
        .single();

      if (logError || !logResult) {
        // Check for foreign key constraint violation
        if (logError?.code === "23503" && logError?.constraint_name === "logs_user_id_fkey") {
          throw new Error(
            `User authentication error: User ID ${logData.userId} does not exist in auth.users table. Please ensure the user is properly registered and authenticated.`
          );
        }
        throw new Error(`Failed to create log: ${logError?.message || "Unknown error"}`);
      }

      const logId = logResult.id;

      // Ingredients are already stored in the ingredient_names text[] column
      // No additional ingredient processing needed for simple approach

      // Insert symptom associations
      if (logData.symptoms.length > 0) {
        const symptomInserts = logData.symptoms.map((symptom) => ({
          log_id: logId,
          symptom_id: symptom.symptom_id,
          severity: symptom.severity,
        }));

        const { error: symptomsError } = await this.supabase.from("log_symptoms").insert(symptomInserts);

        if (symptomsError) {
          throw new Error(`Failed to insert log symptoms: ${symptomsError.message}`);
        }
      }

      return logId;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to create log with associations");
    }
  }

  /**
   * Get a populated log with ingredients and symptoms
   * @param logId - Log ID to retrieve
   * @param userId - User ID for authorization
   * @returns Complete log data with populated associations
   */
  async getPopulatedLog(logId: string, userId: string): Promise<LogResponse> {
    // Get the main log data
    const { data: logData, error: logError } = await this.supabase
      .from("logs")
      .select("*")
      .eq("id", logId)
      .eq("user_id", userId)
      .single();

    if (logError || !logData) {
      throw new Error(`Failed to get log: ${logError?.message || "Log not found"}`);
    }

    // Get associated symptoms
    const { data: symptomsData, error: symptomsError } = await this.supabase
      .from("log_symptoms")
      .select(
        `
        symptom_id,
        severity,
        symptoms!inner (
          name
        )
      `
      )
      .eq("log_id", logId);

    if (symptomsError) {
      throw new Error(`Failed to get log symptoms: ${symptomsError.message}`);
    }

    // Transform ingredients from text array (simple approach)
    const ingredients: LogIngredientResponse[] = (logData.ingredient_names || []).map((name: string) => ({
      name,
      source: "user_input" as const,
    }));

    const symptoms: LogSymptomResponse[] = (symptomsData || []).map((item) => ({
      symptom_id: item.symptom_id,
      name: (item.symptoms as any).name,
      severity: item.severity,
    }));

    // Generate signed URL for meal photo if it exists
    let mealPhotoUrl: string | undefined;
    if (logData.meal_photo_url) {
      try {
        const { data: signedUrlData } = await this.supabase.storage
          .from("meal-photos")
          .createSignedUrl(logData.meal_photo_url, 3600); // 1 hour expiry

        if (signedUrlData) {
          mealPhotoUrl = signedUrlData.signedUrl;
        }
      } catch {
        // If signed URL generation fails, we'll return without the photo URL
        mealPhotoUrl = undefined;
      }
    }

    return {
      id: logData.id,
      user_id: logData.user_id,
      log_date: logData.log_date,
      notes: logData.notes,
      meal_photo_url: mealPhotoUrl,
      created_at: logData.created_at,
      ingredients,
      symptoms,
    };
  }

  /**
   * Get paginated logs for a user
   */
  async getPaginatedLogs(userId: string, query: any) {
    const { page = 1, per_page = 10 } = query;
    const start = (page - 1) * per_page;
    const end = start + per_page - 1;

    const { data, count, error } = await this.supabase
      .from("logs")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("log_date", { ascending: false })
      .range(start, end);

    return { data, count, error };
  }

  /**
   * Get multiple symptoms by IDs for validation
   * @param symptomIds - Array of symptom IDs to validate
   * @returns Array of valid symptom IDs
   */
  async validateSymptomIds(symptomIds: number[]): Promise<number[]> {
    const { data, error } = await this.supabase.from("symptoms").select("id").in("id", symptomIds);

    if (error) {
      throw new Error(`Failed to validate symptoms: ${error.message}`);
    }

    return (data || []).map((item) => item.id);
  }

  /**
   * Get logs with pagination and related data via joins
   * @param query - Query parameters with pagination and filtering
   * @returns Paginated logs with ingredients and symptoms
   */
  async getLogsWithPagination(query: GetLogsQuery): Promise<{ logs: any[]; totalCount: number }> {
    try {
      const offset = (query.page - 1) * query.limit;

      // Build base query with filters
      let logsQuery = this.supabase
        .from("logs")
        .select(
          `
          *,
          log_ingredients (
            ingredient_id,
            raw_text,
            match_confidence,
            ingredients (
              name
            )
          ),
          log_symptoms (
            symptom_id,
            severity,
            symptoms (
              name
            )
          )
        `
        )
        .eq("user_id", query.userId);

      // Add date filters if provided
      if (query.start) {
        logsQuery = logsQuery.gte("log_date", query.start);
      }
      if (query.end) {
        logsQuery = logsQuery.lte("log_date", query.end);
      }

      // Add ordering and pagination
      const { data: logs, error: logsError } = await logsQuery
        .order("log_date", { ascending: false })
        .order("created_at", { ascending: false })
        .range(offset, offset + query.limit - 1);

      if (logsError) {
        throw new Error(`Failed to fetch logs: ${logsError.message}`);
      }

      // Get total count for pagination
      let countQuery = this.supabase
        .from("logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", query.userId);

      if (query.start) {
        countQuery = countQuery.gte("log_date", query.start);
      }
      if (query.end) {
        countQuery = countQuery.lte("log_date", query.end);
      }

      const { count, error: countError } = await countQuery;

      if (countError) {
        throw new Error(`Failed to count logs: ${countError.message}`);
      }

      return {
        logs: logs || [],
        totalCount: count || 0,
      };
    } catch (error) {
      throw new Error(`Repository error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}
