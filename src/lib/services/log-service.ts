import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateLogRequest,
  LogResponse,
  CreateLogSymptomItem,
  LogsListResponse,
  PaginationMeta,
} from "../../types";
import type { Database } from "../../db/database.types";
import { LogRepository } from "./log-repository";

/**
 * Internal command model for log creation
 */
export interface CreateLogCommand {
  userId: string;
  logDate: string;
  notes?: string;
  ingredients: string[];
  symptoms: CreateLogSymptomItem[];
}

/**
 * Service class for handling log operations
 */
export class LogService {
  private readonly logRepository: LogRepository;

  constructor(private readonly supabase: SupabaseClient<Database>) {
    this.logRepository = new LogRepository(supabase);
  }

  /**
   * Create a new meal log with associated ingredients and symptoms
   */
  async createLog(request: CreateLogRequest, userId: string): Promise<LogResponse> {
    try {
      const command: CreateLogCommand = {
        userId,
        logDate: request.log_date,
        notes: request.notes,
        ingredients: request.ingredients, // ingredients are already strings
        symptoms: request.symptoms,
      };

      const logId = await this.logRepository.createLogWithAssociations(command);

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
   * Get paginated logs for a user
   */
  async getLogs(userId: string, query: any): Promise<LogsListResponse> {
    const { data, count, error } = await this.logRepository.getPaginatedLogs(userId, query);

    if (error) {
      throw new Error("Failed to retrieve logs");
    }

    // Populate each log with ingredients and symptoms
    const populatedLogs: LogResponse[] = [];
    for (const rawLog of data || []) {
      try {
        const populatedLog = await this.logRepository.getPopulatedLog(rawLog.id, userId);
        populatedLogs.push(populatedLog);
      } catch (error) {
        console.error(`Failed to populate log ${rawLog.id}:`, error);
        // Skip this log if we can't populate it
        continue;
      }
    }

    const pagination: PaginationMeta = {
      page: query.page,
      per_page: query.per_page,
      total: count ?? 0,
      total_pages: Math.ceil((count ?? 0) / query.per_page),
    };

    return {
      data: populatedLogs,
      meta: pagination,
    };
  }

  /**
   * Get a single log by ID
   */
  async getLogById(logId: number, userId: string): Promise<LogResponse> {
    const log = await this.logRepository.getPopulatedLog(logId, userId);
    if (!log) {
      throw new Error("Log not found");
    }
    return log;
  }
}
