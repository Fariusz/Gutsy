import type { APIContext } from "astro";
import { z } from "zod";
import { LogService } from "../../lib/services/log-service";
import type { CreateLogRequest } from "../../types";
import { CreateLogSchema, LogsQuerySchema } from "../../lib/validation/schemas.js";

export const prerender = false;

// Extend the base query schema with pagination
const PaginatedLogsQuerySchema = LogsQuerySchema.extend({
  page: z.preprocess((val) => Number(val), z.number().int().min(1)).default(1),
  per_page: z.preprocess((val) => Number(val), z.number().int().min(1).max(100)).default(10),
});

/**
 * POST /api/logs - Create a new meal log entry
 */
export async function POST(context: APIContext): Promise<Response> {
  try {
    console.log("Logs POST: Starting request");

    // 1. Check authentication
    const {
      data: { session },
      error: sessionError,
    } = await context.locals.supabase.auth.getSession();

    if (sessionError) {
      console.error("Logs POST session error:", sessionError);
      return new Response(
        JSON.stringify({
          error: {
            type: "authorization_error",
            message: "Session error: " + sessionError.message,
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!session?.user) {
      console.log("Logs POST: No session found");
      return new Response(
        JSON.stringify({
          error: {
            type: "authorization_error",
            message: "Authentication required",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Logs POST: Session validated for user:", session.user.id);

    // 2. Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await context.request.json();
      console.log("Logs POST: Parsed request body");
    } catch {
      console.error("Logs POST: Failed to parse JSON body");
      return new Response(
        JSON.stringify({
          error: {
            type: "validation_error",
            message: "Invalid JSON in request body",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
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
              message: error.message,
            })),
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validatedRequest = validationResult.data as CreateLogRequest;

    // 3. Create log
    const logService = new LogService(context.locals.supabase);
    const createdLog = await logService.createLog(validatedRequest, session.user.id);

    console.log("Logs POST: Log created successfully");

    return new Response(JSON.stringify({ data: createdLog }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Logs POST API error:", error);
    return new Response(
      JSON.stringify({
        error: {
          type: "server_error",
          message: error instanceof Error ? error.message : "Internal server error",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * GET /api/logs - Get meal log entries
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    console.log("Logs GET: Starting request");

    // 1. Check authentication
    const {
      data: { session },
      error: sessionError,
    } = await context.locals.supabase.auth.getSession();

    if (sessionError) {
      console.error("Logs GET session error:", sessionError);
      return new Response(
        JSON.stringify({
          error: {
            type: "authorization_error",
            message: "Session error: " + sessionError.message,
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!session?.user) {
      console.log("Logs GET: No session found");
      return new Response(
        JSON.stringify({
          error: {
            type: "authorization_error",
            message: "Authentication required",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Logs GET: Session validated for user:", session.user.id);

    // 2. Parse query parameters
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
              message: error.message,
            })),
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Get logs
    const logService = new LogService(context.locals.supabase);
    const logsResponse = await logService.getLogs(session.user.id, validationResult.data);

    console.log("Logs GET: Service response:", {
      hasData: !!logsResponse.data,
      dataLength: logsResponse.data?.length,
      hasError: !!logsResponse.error,
    });

    return new Response(JSON.stringify(logsResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Logs GET API error:", error);
    return new Response(
      JSON.stringify({
        error: {
          type: "server_error",
          message: error instanceof Error ? error.message : "Internal server error",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
