import type { APIRoute } from "astro";
import { SymptomService } from "../../lib/services/symptom-service";
import { handleApiError } from "../../lib/utils/error-handlers";

/**
 * API endpoint to get all symptoms
 * @returns SymptomsResponse with all available symptoms
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const supabase = locals.supabase;
    const symptomService = new SymptomService(supabase);
    const response = await symptomService.getAllSymptoms();

    if (response.error) {
      return new Response(JSON.stringify({ error: response.error }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleApiError(error, "Failed to retrieve symptoms");
  }
};
