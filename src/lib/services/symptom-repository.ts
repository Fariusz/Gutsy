import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { SymptomResponse } from "../../types";

/**
 * Repository for symptom-related database operations
 */
export class SymptomRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Get all symptoms from the database
   * @returns Array of symptoms
   */
  async getAllSymptoms(): Promise<SymptomResponse[]> {
    try {
      const { data, error } = await this.supabase.from("symptoms").select("id, name");

      if (error) {
        console.error("Supabase error fetching symptoms:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        console.warn("No symptoms data returned from database");
        return [];
      }

      console.log(`Successfully fetched ${data.length} symptoms`);
      return data.map((symptom) => ({
        id: symptom.id,
        name: symptom.name,
      }));
    } catch (error) {
      console.error("Repository error in getAllSymptoms:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Unexpected error fetching symptoms");
    }
  }
}
