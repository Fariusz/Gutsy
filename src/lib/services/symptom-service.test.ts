import { describe, it, expect, vi, beforeEach } from "vitest";
import { SymptomService } from "./symptom-service";
import { SymptomRepository } from "./symptom-repository";

// Mock the SymptomRepository
vi.mock("./symptom-repository");

describe("SymptomService", () => {
  let symptomService: SymptomService;
  let mockSupabase: any;
  let mockSymptomRepository: vi.Mocked<SymptomRepository>;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Mock Supabase client
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(),
      })),
    };

    // Create a new instance of SymptomService before each test
    symptomService = new SymptomService(mockSupabase);

    // Get the mocked instance
    mockSymptomRepository = vi.mocked(SymptomRepository).mock.instances[0] as vi.Mocked<SymptomRepository>;
  });

  describe("getAllSymptoms", () => {
    it("should return all symptoms successfully", async () => {
      const mockSymptoms = [
        { id: "1", name: "Headache", created_at: new Date().toISOString() },
        { id: "2", name: "Nausea", created_at: new Date().toISOString() },
      ];

      // Mock the implementation of getAllSymptoms in the repository
      mockSymptomRepository.getAllSymptoms.mockResolvedValue(mockSymptoms);

      const result = await symptomService.getAllSymptoms();

      expect(result.data).toEqual(mockSymptoms);
      expect(result.error).toBeUndefined();
      expect(mockSymptomRepository.getAllSymptoms).toHaveBeenCalledOnce();
    });

    it("should return an error message if fetching symptoms fails", async () => {
      const errorMessage = "Failed to retrieve symptoms";
      // Mock the implementation to throw an error
      mockSymptomRepository.getAllSymptoms.mockRejectedValue(new Error(errorMessage));

      const result = await symptomService.getAllSymptoms();

      expect(result.data).toEqual([]);
      expect(result.error).toBe(errorMessage);
      expect(mockSymptomRepository.getAllSymptoms).toHaveBeenCalledOnce();
    });
  });
});
