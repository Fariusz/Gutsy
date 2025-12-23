import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { SymptomsResponse } from "../../types";
import { SymptomRepository } from "./symptom-repository";

/**
 * Service class for handling symptom operations
 */
export class SymptomService {
  private readonly symptomRepository: SymptomRepository;

  constructor(private readonly supabase: SupabaseClient<Database>) {
    this.symptomRepository = new SymptomRepository(supabase);
  }

  /**
   * Get all symptoms
   * @returns SymptomsResponse with all available symptoms
   */
  async getAllSymptoms(): Promise<SymptomsResponse> {
    try {
      const symptoms = await this.symptomRepository.getAllSymptoms();
      return { data: symptoms };
    } catch (error) {
      console.error("Error in SymptomService.getAllSymptoms:", error);
      // In a real app, you'd want more robust error handling and logging
      return { data: [], error: "Failed to retrieve symptoms" };
    }
  }
}
