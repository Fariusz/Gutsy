import type { APIContext } from "astro";
import { CreateLogSchema, LogsQuerySchema } from "../../lib/validation/ingredient-schemas";
import { LogService } from "../../lib/services/log-service";
import type { CreateLogRequest, ErrorResponse } from "../../types";

export const prerender = false;

/**
 * POST /api/logs - Create a new meal log entry
 */
export async function POST(context: APIContext): Promise<Response> {
  try {
    // 1. Validate authentication
    const {
      data: { session },
      error: sessionError,
    } = await context.locals.supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return new Response(
        JSON.stringify({
          error: {
            type: "authorization_error",
            message: "Authentication required",
          },
        } as ErrorResponse),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await context.request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: {
            type: "validation_error",
            message: "Invalid JSON in request body",
            details: [],
          },
        } as ErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Validate request schema
    const validationResult = CreateLogSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const validationErrors = validationResult.error.errors.map((error) => ({
        field: error.path.join("."),
        message: error.message,
      }));

      return new Response(
        JSON.stringify({
          error: {
            type: "validation_error",
            message: "Request validation failed",
            details: validationErrors,
          },
        } as ErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validatedRequest = validationResult.data as CreateLogRequest;

    // 4. Create log using service layer
    const logService = new LogService(context.locals.supabase);
    const createdLog = await logService.createLog(validatedRequest, session.user.id);

    // 5. Return success response
    return new Response(JSON.stringify({ data: createdLog }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating log:", error);

    return new Response(
      JSON.stringify({
        error: {
          type: "business_logic_error",
          message: "Failed to create log",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      } as ErrorResponse),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * GET /api/logs - Retrieve paginated list of user's meal logs
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    // 1. Validate authentication
    const {
      data: { session },
      error: sessionError,
    } = await context.locals.supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return new Response(
        JSON.stringify({
          error: {
            type: "authorization_error",
            message: "Authentication required",
          },
        } as ErrorResponse),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Parse and validate query parameters
    const url = new URL(context.request.url);
    const queryParams = Object.fromEntries(url.searchParams);

    const validatedParams = LogsQuerySchema.safeParse(queryParams);

    if (!validatedParams.success) {
      return new Response(
        JSON.stringify({
          error: {
            type: "validation_error",
            message: "Invalid query parameters",
            details: validatedParams.error.errors.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })),
          },
        } as ErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Create service and retrieve logs
    const logService = new LogService(context.locals.supabase);
    const userId = session.user.id;

    const logsResponse = await logService.getUserLogs({
      userId,
      ...validatedParams.data,
    });

    // 4. Return success response
    return new Response(JSON.stringify(logsResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error retrieving logs:", error);

    return new Response(
      JSON.stringify({
        error: {
          type: "business_logic_error",
          message: "Failed to retrieve logs",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      } as ErrorResponse),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
