import type { APIContext } from "astro";
import { z } from "zod";
import { LogService } from "../../lib/services/log-service";
import type { CreateLogRequest, ErrorResponse } from "../../types";

export const prerender = false;

const CreateLogSchema = z.object({
  log_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  notes: z.string().optional(),
  ingredients: z.array(z.string()),
  symptoms: z.array(
    z.object({
      symptom_id: z.number(),
      severity: z.number().min(1).max(5),
    })
  ),
});

const LogsQuerySchema = z.object({
  page: z.preprocess((val) => Number(val), z.number().int().min(1)).default(1),
  per_page: z.preprocess((val) => Number(val), z.number().int().min(1).max(100)).default(10),
});

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
 * GET /api/logs - Get meal log entries
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

    // 2. Validate query parameters
    const queryParams = Object.fromEntries(context.url.searchParams.entries());
    const validationResult = LogsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      const validationErrors = validationResult.error.errors.map((error) => ({
        field: error.path.join("."),
        message: error.message,
      }));
      return new Response(
        JSON.stringify({
          error: {
            type: "validation_error",
            message: "Invalid query parameters",
            details: validationErrors,
          },
        } as ErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Get logs using service layer
    const logService = new LogService(context.locals.supabase);
    const logsResponse = await logService.getLogs(session.user.id, validationResult.data);

    // 4. Return success response
    return new Response(JSON.stringify(logsResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching logs:", error);

    return new Response(
      JSON.stringify({
        error: {
          type: "business_logic_error",
          message: "Failed to fetch logs",
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
