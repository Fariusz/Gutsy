import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateLogRequest,
  LogResponse,
  CreateLogIngredientItem,
  CreateLogSymptomItem,
  LogIngredientResponse,
  LogsListResponse,
  PaginationMeta,
} from "../../types";
import type { Database } from "../../db/database.types";
import { PhotoStorageService } from "./photo-storage-service";
import { IngredientNormalizationService } from "./ingredient-normalization-service";
import { LogRepository } from "./log-repository";
import { IngredientRepository } from "./ingredient-repository";
import type { GetLogsQuery } from "../validation/ingredient-schemas";
import { timeFunction, photoUrlCache } from "../utils/performance-monitor";

/**
 * Internal command model for log creation
 */
export interface CreateLogCommand {
  userId: string;
  logDate: string;
  notes?: string;
  mealPhotoUrl?: string;
  ingredients: CreateLogIngredientItem[];
  symptoms: CreateLogSymptomItem[];
}

/**
 * Service class for handling log operations
 */
export class LogService {
  private readonly photoStorageService: PhotoStorageService;
  private readonly ingredientNormalizationService: IngredientNormalizationService;
  private readonly logRepository: LogRepository;
  private readonly ingredientRepository: IngredientRepository;

  constructor(private readonly supabase: SupabaseClient<Database>) {
    this.photoStorageService = new PhotoStorageService(supabase);
    this.ingredientNormalizationService = new IngredientNormalizationService(supabase);
    this.logRepository = new LogRepository(supabase);
    this.ingredientRepository = new IngredientRepository(supabase);
  }

  /**
   * Create a new meal log with associated ingredients and symptoms
   */
  async createLog(request: CreateLogRequest, userId: string): Promise<LogResponse> {
    try {
      // 1. Upload photo if provided
      let mealPhotoUrl: string | undefined;
      if (request.meal_photo) {
        mealPhotoUrl = await this.uploadPhoto(request.meal_photo, userId);
      }

      // 2. Normalize ingredients
      const normalizedIngredients = await this.normalizeIngredients(request.ingredients);

      // 3. Validate symptoms
      await this.validateSymptoms(request.symptoms);

      // 4. Create log with database transaction
      const command: CreateLogCommand = {
        userId,
        logDate: request.log_date,
        notes: request.notes,
        mealPhotoUrl,
        ingredients: request.ingredients,
        symptoms: request.symptoms,
      };

      const logId = await this.logRepository.createLogWithAssociations(command, normalizedIngredients);

      // 5. Retrieve and return the populated log
      return await this.logRepository.getPopulatedLog(logId, userId);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to create log");
    }
  }

  /**
   * Upload photo to Supabase Storage and return the URL
   */
  private async uploadPhoto(photoData: string, userId: string): Promise<string> {
    return await this.photoStorageService.uploadPhoto(photoData, userId);
  }

  /**
   * Normalize ingredient raw text to match canonical ingredients
   */
  private async normalizeIngredients(items: CreateLogIngredientItem[]): Promise<LogIngredientResponse[]> {
    const results: LogIngredientResponse[] = [];

    for (const item of items) {
      if (item.ingredient_id) {
        // Validate that the ingredient ID exists
        const ingredient = await this.ingredientRepository.getIngredientById(item.ingredient_id);
        if (!ingredient) {
          throw new Error(`Ingredient with ID ${item.ingredient_id} not found`);
        }

        results.push({
          ingredient_id: ingredient.id,
          name: ingredient.name,
          raw_text: null,
          match_confidence: null,
        });
      } else if (item.raw_text) {
        // Normalize raw text to find matching ingredients
        const matches = await this.ingredientNormalizationService.normalizeIngredient(item.raw_text);

        if (matches.length === 0) {
          throw new Error(`Could not normalize ingredient: "${item.raw_text}"`);
        }

        // Use the best match
        const bestMatch = matches[0];
        results.push({
          ingredient_id: bestMatch.ingredient_id,
          name: bestMatch.name,
          raw_text: item.raw_text,
          match_confidence: bestMatch.match_confidence,
        });
      }
    }

    return results;
  }

  /**
   * Validate that all symptom IDs exist in the database
   */
  private async validateSymptoms(symptoms: CreateLogSymptomItem[]): Promise<void> {
    const symptomIds = symptoms.map((s) => s.symptom_id);
    const validIds = await this.logRepository.validateSymptomIds(symptomIds);

    const invalidIds = symptomIds.filter((id) => !validIds.includes(id));
    if (invalidIds.length > 0) {
      throw new Error(`Invalid symptom IDs: ${invalidIds.join(", ")}`);
    }
  }

  /**
   * Retrieve user logs with pagination and optional date filtering
   */
  async getUserLogs(query: GetLogsQuery): Promise<LogsListResponse> {
    try {
      return await timeFunction(
        async () => {
          // 1. Get logs with pagination from repository
          const { logs, totalCount } = await this.logRepository.getLogsWithPagination(query);

          // 2. Transform logs and generate signed URLs for photos
          const populatedLogs = await this.populateLogData(logs);

          // 3. Calculate pagination metadata
          const pagination = this.calculatePagination(query.page, query.limit, totalCount);

          return {
            data: populatedLogs,
            pagination,
          };
        },
        `getUserLogs_page${query.page}_limit${query.limit}`,
        query.userId
      );
    } catch (error) {
      throw new Error(`Failed to retrieve logs: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Populate log data with signed URLs for photos and format response
   */
  private async populateLogData(logs: any[]): Promise<LogResponse[]> {
    if (logs.length === 0) return [];

    // Extract photo paths and check cache first
    const photoPaths = logs.filter((log) => log.meal_photo_url).map((log) => log.meal_photo_url);

    const signedUrls = new Map<string, string>();

    // Check cache for existing URLs
    const uncachedPaths: string[] = [];
    for (const path of photoPaths) {
      const cachedUrl = photoUrlCache.get(path);
      if (cachedUrl) {
        signedUrls.set(path, cachedUrl);
      } else {
        uncachedPaths.push(path);
      }
    }

    // Generate signed URLs for uncached photos
    if (uncachedPaths.length > 0) {
      const newSignedUrls = await this.photoStorageService.generateSignedUrls(uncachedPaths);

      // Cache the new URLs
      for (const [path, url] of newSignedUrls.entries()) {
        signedUrls.set(path, url);
        photoUrlCache.set(path, url);
      }
    }

    // Transform logs to response format
    return logs.map((log) => ({
      id: log.id,
      user_id: log.user_id,
      log_date: log.log_date,
      notes: log.notes,
      meal_photo_url: log.meal_photo_url ? signedUrls.get(log.meal_photo_url) || null : null,
      created_at: log.created_at,
      ingredients:
        log.log_ingredients?.map((li: any) => ({
          ingredient_id: li.ingredient_id,
          name: li.ingredients?.name || "Unknown",
          raw_text: li.raw_text,
          match_confidence: li.match_confidence,
        })) || [],
      symptoms:
        log.log_symptoms?.map((ls: any) => ({
          symptom_id: ls.symptom_id,
          name: ls.symptoms?.name || "Unknown",
          severity: ls.severity,
        })) || [],
    }));
  }

  /**
   * Calculate pagination metadata
   */
  private calculatePagination(page: number, limit: number, total: number): PaginationMeta {
    const totalPages = Math.ceil(total / limit);

    return {
      current_page: page,
      total_pages: totalPages,
      total_count: total,
      has_next: page < totalPages,
      has_prev: page > 1,
    };
  }
}
