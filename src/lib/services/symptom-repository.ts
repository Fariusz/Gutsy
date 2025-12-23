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
    const { data, error } = await this.supabase.from("symptoms").select("id, name");

    if (error) {
      console.error("Error fetching symptoms:", error);
      throw new Error("Failed to fetch symptoms");
    }

    return (data || []).map((symptom) => ({
      id: symptom.id,
      name: symptom.name,
    }));
  }
}
