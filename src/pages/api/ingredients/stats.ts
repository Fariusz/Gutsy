import type { APIContext } from "astro";
import { normalizationCache } from "../../lib/cache/normalization-cache";
import { normalizationAnalytics } from "../../lib/services/normalization-analytics";

export const prerender = false;

/**
 * GET /api/ingredients/stats
 *
 * Returns performance statistics and monitoring data for the ingredient normalization service
 * Requires authentication and admin privileges in production
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    // Basic authentication check (in production, add admin role check)
    const {
      data: { session },
      error: authError,
    } = await context.locals.supabase.auth.getSession();

    if (authError || !session?.user) {
      return new Response(
        JSON.stringify({
          error: {
            type: "authorization_error",
            message: "Authentication required for statistics access",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Gather performance statistics
    const cacheStats = normalizationCache.getStats();
    const performanceStats = normalizationAnalytics.getPerformanceStats();
    const failurePatterns = normalizationAnalytics.getFailurePatterns(5);

    // Calculate additional metrics
    const recentEvents = normalizationAnalytics.exportEvents(100); // Last 100 events
    const uniqueUsers = new Set(recentEvents.map((e) => e.userId)).size;

    // Build comprehensive stats response
    const stats = {
      timestamp: new Date().toISOString(),
      cache: {
        size: cacheStats.size,
        maxSize: cacheStats.maxSize,
        utilization: ((cacheStats.size / cacheStats.maxSize) * 100).toFixed(1) + "%",
        hitRate: cacheStats.hitRate.toFixed(3),
        avgAccessCount: cacheStats.avgAccessCount.toFixed(2),
      },
      performance: {
        totalRequests: performanceStats.totalRequests,
        avgProcessingTime: Math.round(performanceStats.avgProcessingTime),
        avgConfidence: performanceStats.avgConfidence.toFixed(3),
        cacheHitRate: performanceStats.cacheHitRate.toFixed(3),
        failureRate: performanceStats.failureRate.toFixed(3),
        methodDistribution: performanceStats.methodDistribution,
      },
      usage: {
        uniqueUsers: uniqueUsers,
        recentEvents: recentEvents.length,
      },
      health: {
        status: performanceStats.failureRate < 0.05 ? "healthy" : "degraded",
        avgResponseTime: performanceStats.avgProcessingTime,
        errorRate: performanceStats.failureRate,
        cacheEfficiency: performanceStats.cacheHitRate,
      },
      failurePatterns: failurePatterns.map((p) => ({
        pattern: p.pattern,
        count: p.count,
        percentage: ((p.count / Math.max(1, performanceStats.totalRequests)) * 100).toFixed(2) + "%",
      })),
    };

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=60", // Cache for 1 minute
      },
    });
  } catch (error) {
    console.error("Error generating normalization statistics:", error);
    return new Response(
      JSON.stringify({
        error: {
          type: "internal_server_error",
          message: "Failed to generate statistics",
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
 * POST /api/ingredients/stats
 *
 * Performs maintenance operations on the normalization service
 * Supports cache cleanup and analytics reset
 */
export async function POST(context: APIContext): Promise<Response> {
  try {
    // Authentication check
    const {
      data: { session },
      error: authError,
    } = await context.locals.supabase.auth.getSession();

    if (authError || !session?.user) {
      return new Response(
        JSON.stringify({
          error: {
            type: "authorization_error",
            message: "Authentication required for maintenance operations",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await context.request.json();
    const { action } = body;

    let result;

    switch (action) {
      case "cleanup_cache":
        const removedCount = normalizationCache.cleanup();
        result = {
          action: "cleanup_cache",
          removedEntries: removedCount,
          message: `Cleaned up ${removedCount} expired cache entries`,
        };
        break;

      case "clear_cache":
        normalizationCache.clear();
        result = {
          action: "clear_cache",
          message: "All cache entries cleared",
        };
        break;

      case "get_detailed_analytics":
        const events = normalizationAnalytics.exportEvents(1000);
        const detailedStats = normalizationAnalytics.getPerformanceStats(7 * 24 * 60 * 60 * 1000); // 7 days

        result = {
          action: "get_detailed_analytics",
          events: events,
          weeklyStats: detailedStats,
          message: `Retrieved ${events.length} recent events and weekly statistics`,
        };
        break;

      default:
        return new Response(
          JSON.stringify({
            error: {
              type: "validation_error",
              message: "Invalid action. Supported actions: cleanup_cache, clear_cache, get_detailed_analytics",
            },
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
    }

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error performing maintenance operation:", error);
    return new Response(
      JSON.stringify({
        error: {
          type: "internal_server_error",
          message: "Failed to perform maintenance operation",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
