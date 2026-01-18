import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { SymptomsResponse } from "../../types";
import { SymptomRepository } from "./symptom-repository";
import { logger } from "../utils/logger";

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
      logger.debug("SymptomService: Starting getAllSymptoms");
      const symptoms = await this.symptomRepository.getAllSymptoms();
      logger.info(`SymptomService: Successfully retrieved ${symptoms.length} symptoms`);
      return { data: symptoms };
    } catch (error) {
      logger.error("SymptomService error in getAllSymptoms", { error });
      const errorMessage = error instanceof Error ? error.message : "Failed to retrieve symptoms";
      return { data: [], error: errorMessage };
    }
  }
}
