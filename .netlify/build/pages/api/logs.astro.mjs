import { z } from 'zod';
import { L as LogsQuerySchema, b as CreateLogSchema } from '../../chunks/schemas_DPM-KRni.mjs';
export { renderers } from '../../renderers.mjs';

class LogRepository {
  constructor(supabase) {
    this.supabase = supabase;
  }
  /**
   * Create a new log with associated ingredients and symptoms
   * @param logData - Log creation command data
   * @returns Created log ID
   */
  async createLogWithAssociations(logData) {
    try {
      const { data: logResult, error: logError } = await this.supabase.from("logs").insert({
        user_id: logData.userId,
        log_date: logData.logDate,
        notes: logData.notes || null,
        ingredient_names: logData.ingredients
        // Keep backwards compatibility
      }).select("id").single();
      if (logError || !logResult) {
        if (logError?.code === "23503" && logError?.constraint_name === "logs_user_id_fkey") {
          throw new Error(
            `User authentication error: User ID ${logData.userId} does not exist in auth.users table. Please ensure the user is properly registered and authenticated.`
          );
        }
        throw new Error(`Failed to create log: ${logError?.message || "Unknown error"}`);
      }
      const logId = logResult.id;
      if (logData.symptoms.length > 0) {
        const symptomInserts = logData.symptoms.map((symptom) => ({
          log_id: logId,
          symptom_id: symptom.symptom_id,
          severity: symptom.severity
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
  async getPopulatedLog(logId, userId) {
    const { data: logData, error: logError } = await this.supabase.from("logs").select("*").eq("id", logId).eq("user_id", userId).single();
    if (logError || !logData) {
      throw new Error(`Failed to get log: ${logError?.message || "Log not found"}`);
    }
    const { data: symptomsData, error: symptomsError } = await this.supabase.from("log_symptoms").select(
      `
        symptom_id,
        severity,
        symptoms!inner (
          name
        )
      `
    ).eq("log_id", logId);
    if (symptomsError) {
      throw new Error(`Failed to get log symptoms: ${symptomsError.message}`);
    }
    const ingredients = (logData.ingredient_names || []).map((name) => ({
      name,
      source: "user_input"
    }));
    const symptoms = (symptomsData || []).map((item) => ({
      symptom_id: item.symptom_id,
      name: item.symptoms.name,
      severity: item.severity
    }));
    let mealPhotoUrl;
    if (logData.meal_photo_url) {
      try {
        const { data: signedUrlData } = await this.supabase.storage.from("meal-photos").createSignedUrl(logData.meal_photo_url, 3600);
        if (signedUrlData) {
          mealPhotoUrl = signedUrlData.signedUrl;
        }
      } catch {
        mealPhotoUrl = void 0;
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
      symptoms
    };
  }
  /**
   * Get paginated logs for a user
   */
  async getPaginatedLogs(userId, query) {
    const { page = 1, per_page = 10 } = query;
    const start = (page - 1) * per_page;
    const end = start + per_page - 1;
    const { data, count, error } = await this.supabase.from("logs").select("*", { count: "exact" }).eq("user_id", userId).order("log_date", { ascending: false }).range(start, end);
    return { data, count, error };
  }
  /**
   * Get multiple symptoms by IDs for validation
   * @param symptomIds - Array of symptom IDs to validate
   * @returns Array of valid symptom IDs
   */
  async validateSymptomIds(symptomIds) {
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
  async getLogsWithPagination(query) {
    try {
      const offset = (query.page - 1) * query.limit;
      let logsQuery = this.supabase.from("logs").select(
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
      ).eq("user_id", query.userId);
      if (query.start) {
        logsQuery = logsQuery.gte("log_date", query.start);
      }
      if (query.end) {
        logsQuery = logsQuery.lte("log_date", query.end);
      }
      const { data: logs, error: logsError } = await logsQuery.order("log_date", { ascending: false }).order("created_at", { ascending: false }).range(offset, offset + query.limit - 1);
      if (logsError) {
        throw new Error(`Failed to fetch logs: ${logsError.message}`);
      }
      let countQuery = this.supabase.from("logs").select("*", { count: "exact", head: true }).eq("user_id", query.userId);
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
        totalCount: count || 0
      };
    } catch (error) {
      throw new Error(`Repository error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}

class LogService {
  constructor(supabase) {
    this.supabase = supabase;
    this.logRepository = new LogRepository(supabase);
  }
  logRepository;
  /**
   * Create a new meal log with associated ingredients and symptoms
   */
  async createLog(request, userId) {
    try {
      const command = {
        userId,
        logDate: request.log_date,
        notes: request.notes,
        ingredients: request.ingredients,
        // ingredients are already strings
        symptoms: request.symptoms
      };
      const logId = await this.logRepository.createLogWithAssociations(command);
      return await this.logRepository.getPopulatedLog(logId, userId);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to create log");
    }
  }
  /**
   * Get paginated logs for a user
   */
  async getLogs(userId, query) {
    const { data, count, error } = await this.logRepository.getPaginatedLogs(userId, query);
    if (error) {
      throw new Error("Failed to retrieve logs");
    }
    const populatedLogs = [];
    for (const rawLog of data || []) {
      try {
        const populatedLog = await this.logRepository.getPopulatedLog(rawLog.id, userId);
        populatedLogs.push(populatedLog);
      } catch (error2) {
        console.error(`Failed to populate log ${rawLog.id}:`, error2);
        continue;
      }
    }
    const pagination = {
      page: query.page,
      per_page: query.per_page,
      total: count ?? 0,
      total_pages: Math.ceil((count ?? 0) / query.per_page)
    };
    return {
      data: populatedLogs,
      meta: pagination
    };
  }
  /**
   * Get a single log by ID
   */
  async getLogById(logId, userId) {
    const log = await this.logRepository.getPopulatedLog(logId, userId);
    if (!log) {
      throw new Error("Log not found");
    }
    return log;
  }
}

const prerender = false;
const PaginatedLogsQuerySchema = LogsQuerySchema.extend({
  page: z.preprocess(Number, z.number().int().min(1)).default(1),
  per_page: z.preprocess(Number, z.number().int().min(1).max(100)).default(10)
});
async function POST(context) {
  try {
    console.log("Logs POST: Starting request");
    const {
      data: { user },
      error: userError
    } = await context.locals.supabase.auth.getUser();
    if (userError) {
      console.error("Logs POST user error:", userError);
      return new Response(
        JSON.stringify({
          error: {
            type: "authorization_error",
            message: "Authentication error: " + userError.message
          }
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    if (!user) {
      console.log("Logs POST: No user found");
      return new Response(
        JSON.stringify({
          error: {
            type: "authorization_error",
            message: "Authentication required"
          }
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    console.log("Logs POST: User validated:", user.id);
    console.log("Logs POST: User email:", user.email);
    console.log("Logs POST: User confirmed at:", user.email_confirmed_at);
    let requestBody;
    try {
      requestBody = await context.request.json();
      console.log("Logs POST: Parsed request body");
    } catch {
      console.error("Logs POST: Failed to parse JSON body");
      return new Response(
        JSON.stringify({
          error: {
            type: "validation_error",
            message: "Invalid JSON in request body"
          }
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const validationResult = CreateLogSchema.safeParse(requestBody);
    if (!validationResult.success) {
      console.error("Logs POST: Body validation failed:", validationResult.error);
      return new Response(
        JSON.stringify({
          error: {
            type: "validation_error",
            message: "Request validation failed",
            details: validationResult.error.errors.map((error) => ({
              field: error.path.join("."),
              message: error.message
            }))
          }
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const validatedRequest = validationResult.data;
    const logService = new LogService(context.locals.supabase);
    const createdLog = await logService.createLog(validatedRequest, user.id);
    console.log("Logs POST: Log created successfully");
    return new Response(JSON.stringify({ data: createdLog }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Logs POST API error:", error);
    return new Response(
      JSON.stringify({
        error: {
          type: "server_error",
          message: error instanceof Error ? error.message : "Internal server error"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
async function GET(context) {
  try {
    console.log("Logs GET: Starting request");
    const {
      data: { user },
      error: userError
    } = await context.locals.supabase.auth.getUser();
    if (userError) {
      console.error("Logs GET user error:", userError);
      return new Response(
        JSON.stringify({
          error: {
            type: "authorization_error",
            message: "Authentication error: " + userError.message
          }
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    if (!user) {
      console.log("Logs GET: No user found");
      return new Response(
        JSON.stringify({
          error: {
            type: "authorization_error",
            message: "Authentication required"
          }
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    console.log("Logs GET: User validated:", user.id);
    const queryParams = Object.fromEntries(context.url.searchParams.entries());
    console.log("Logs GET: Query params:", queryParams);
    const validationResult = PaginatedLogsQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      console.error("Logs GET: Query validation failed:", validationResult.error);
      return new Response(
        JSON.stringify({
          error: {
            type: "validation_error",
            message: "Invalid query parameters",
            details: validationResult.error.errors.map((error) => ({
              field: error.path.join("."),
              message: error.message
            }))
          }
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const logService = new LogService(context.locals.supabase);
    const logsResponse = await logService.getLogs(user.id, validationResult.data);
    console.log("Logs GET: Service response:", {
      hasData: !!logsResponse.data,
      dataLength: logsResponse.data?.length,
      hasError: !!logsResponse.error
    });
    return new Response(JSON.stringify(logsResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Logs GET API error:", error);
    return new Response(
      JSON.stringify({
        error: {
          type: "server_error",
          message: error instanceof Error ? error.message : "Internal server error"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
