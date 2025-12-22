import type { APIContext } from "astro";
import { TriggerAnalysisService } from "../../lib/services/trigger-analysis-service";
import { TriggersQuerySchema } from "../../lib/validation/trigger-schemas";
import { handleApiError } from "../../lib/utils/error-handlers";
import { validateAuthToken } from "../../lib/auth/auth-helpers";

export const prerender = false;

/**
 * GET /api/triggers
 *
 * Provides trigger analysis and correlation results for ingredients
 * based on their association with symptoms over a specified time period.
 *
 * Query Parameters:
 * - start (optional): ISO date string (YYYY-MM-DD), default 30 days ago
 * - end (optional): ISO date string (YYYY-MM-DD), default today
 * - limit (optional): number, default 10, max 50
 *
 * Authentication: Required Bearer token
 *
 * Returns: TriggersResponse with trigger data and analysis metadata
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    // Validate authentication and extract user ID
    const userId = await validateAuthToken(context);

    // Parse and validate query parameters
    const url = new URL(context.request.url);
    const queryParams = TriggersQuerySchema.parse(Object.fromEntries(url.searchParams));

    // Initialize service with authenticated Supabase client
    const triggerService = new TriggerAnalysisService(context.locals.supabase);

    // Perform trigger analysis
    const result = await triggerService.getTriggerAnalysis({
      userId,
      ...queryParams,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=300", // 5 minute cache for performance
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
