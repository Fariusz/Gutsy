import { describe, it, expect } from "vitest";
import { ZodError, z } from "zod";
import {
  handleApiError,
  createSuccessResponse,
  createNotFoundErrorResponse,
  BusinessLogicError,
  InsufficientDataError,
  RateLimitError,
} from "./error-handlers";
import { AuthenticationError } from "../auth/auth-helpers";

describe("error-handlers", () => {
  describe("handleApiError", () => {
    it("should handle Zod validation errors", () => {
      const schema = z.object({ name: z.string() });
      try {
        schema.parse({ name: 123 });
      } catch (error) {
        const response = handleApiError(error);
        expect(response.status).toBe(400);
        expect(response.headers.get("Content-Type")).toBe("application/json");
      }
    });

    it("should handle AuthenticationError", () => {
      const error = new AuthenticationError("Invalid credentials");
      const response = handleApiError(error);
      
      expect(response.status).toBe(401);
    });

    it("should handle BusinessLogicError", () => {
      const error = new BusinessLogicError("Business error", "Some details");
      const response = handleApiError(error);
      
      expect(response.status).toBe(400);
    });

    it("should handle RateLimitError", () => {
      const error = new RateLimitError("Rate limit exceeded");
      const response = handleApiError(error);
      
      expect(response.status).toBe(429);
      expect(response.headers.get("Retry-After")).toBe("60");
    });

    it("should handle generic errors", () => {
      const error = new Error("Generic error");
      const response = handleApiError(error);
      
      expect(response.status).toBe(500);
    });

    it("should handle unknown errors", () => {
      const response = handleApiError("string error");
      
      expect(response.status).toBe(500);
    });
  });

  describe("createSuccessResponse", () => {
    it("should create successful response with default status", () => {
      const data = { message: "success" };
      const response = createSuccessResponse(data);
      
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should create successful response with custom status", () => {
      const data = { message: "created" };
      const response = createSuccessResponse(data, { status: 201 });
      
      expect(response.status).toBe(201);
    });

    it("should add cache control headers when provided", () => {
      const data = { message: "success" };
      const response = createSuccessResponse(data, { 
        cacheControl: "public, max-age=3600" 
      });
      
      expect(response.headers.get("Cache-Control")).toBe("public, max-age=3600");
    });
  });

  describe("createNotFoundErrorResponse", () => {
    it("should create 404 response with resource name", () => {
      const response = createNotFoundErrorResponse("User");
      
      expect(response.status).toBe(404);
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });
  });

  describe("BusinessLogicError", () => {
    it("should create error with default status code", () => {
      const error = new BusinessLogicError("Test error", "Details");
      
      expect(error.message).toBe("Test error");
      expect(error.details).toBe("Details");
      expect(error.statusCode).toBe(422);
    });

    it("should create error with custom status code", () => {
      const error = new BusinessLogicError("Test error", "Details", 400);
      
      expect(error.statusCode).toBe(400);
    });
  });

  describe("InsufficientDataError", () => {
    it("should extend BusinessLogicError", () => {
      const error = new InsufficientDataError("Not enough data");
      
      expect(error).toBeInstanceOf(BusinessLogicError);
      expect(error.message).toBe("Insufficient data for trigger analysis");
      expect(error.details).toBe("Not enough data");
    });
  });
});