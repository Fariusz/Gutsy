import { describe, it, expect, vi, beforeEach, type MockedFunction } from "vitest";
import { OpenRouterService, OpenRouterServiceError } from "./openrouter-service.js";
import type { ChatOptions } from "./openrouter-service.js";

// Mock fetch globally
const mockFetch = vi.fn() as MockedFunction<typeof fetch>;
globalThis.fetch = mockFetch;

describe("OpenRouterService", () => {
  let service: OpenRouterService;
  const mockApiKey = "test-api-key";
  const mockBaseUrl = "https://test-openrouter.ai/api/v1";

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OpenRouterService(mockApiKey, mockBaseUrl);
  });

  describe("Constructor", () => {
    it("should create service with valid API key", () => {
      expect(service).toBeInstanceOf(OpenRouterService);
    });

    it("should throw error with invalid API key", () => {
      expect(() => new OpenRouterService("")).toThrow("OpenRouter API key is required");
      expect(() => new OpenRouterService(null as any)).toThrow("OpenRouter API key is required");
    });

    it("should use default base URL when not provided", () => {
      const defaultService = new OpenRouterService(mockApiKey);
      expect(defaultService).toBeInstanceOf(OpenRouterService);
    });
  });

  describe("chat method", () => {
    const validChatOptions: ChatOptions = {
      model: "anthropic/claude-3.5-sonnet",
      messages: [{ role: "user", content: "Hello" }],
    };

    const mockSuccessResponse = {
      id: "chatcmpl-123",
      model: "anthropic/claude-3.5-sonnet",
      choices: [
        {
          message: { role: "assistant", content: "Hello! How can I help you?" },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 15,
        total_tokens: 25,
      },
    };

    it("should successfully send chat request", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockSuccessResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const result = await service.chat(validChatOptions);

      expect(result).toEqual(mockSuccessResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/chat/completions`,
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockApiKey}`,
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("should include system message when provided", async () => {
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockSuccessResponse), { status: 200 }));

      const optionsWithSystem: ChatOptions = {
        ...validChatOptions,
        systemMessage: "You are a helpful assistant.",
      };

      await service.chat(optionsWithSystem);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1]?.body as string);

      expect(requestBody.messages[0]).toEqual({
        role: "system",
        content: "You are a helpful assistant.",
      });
    });

    it("should include response format when provided", async () => {
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockSuccessResponse), { status: 200 }));

      const optionsWithFormat: ChatOptions = {
        ...validChatOptions,
        responseFormat: {
          type: "json_schema",
          json_schema: {
            name: "test_schema",
            strict: true,
            schema: { type: "object", properties: { result: { type: "string" } } },
          },
        },
      };

      await service.chat(optionsWithFormat);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1]?.body as string);

      expect(requestBody.response_format).toBeDefined();
      expect(requestBody.response_format.type).toBe("json_schema");
    });

    it("should throw validation error for invalid input", async () => {
      const invalidOptions = {
        model: "", // Invalid empty model
        messages: [],
      } as ChatOptions;

      await expect(service.chat(invalidOptions)).rejects.toThrow(OpenRouterServiceError);
    });

    it("should handle API errors correctly", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { code: "invalid_api_key", message: "Invalid API key" } }), {
          status: 401,
        })
      );

      await expect(service.chat(validChatOptions)).rejects.toThrow(OpenRouterServiceError);
    });
  });

  describe("getAvailableModels method", () => {
    const mockModelsResponse = {
      data: [
        {
          id: "anthropic/claude-3.5-sonnet",
          name: "Claude 3.5 Sonnet",
          pricing: { prompt: "0.000003", completion: "0.000015" },
        },
      ],
    };

    it("should retrieve available models", async () => {
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(mockModelsResponse), { status: 200 }));

      const result = await service.getAvailableModels();

      expect(result).toEqual(mockModelsResponse.data);
      expect(mockFetch).toHaveBeenCalledWith(`${mockBaseUrl}/models`, expect.objectContaining({ method: "GET" }));
    });

    it("should handle models API errors", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { code: "server_error", message: "Server error" } }), {
          status: 500,
        })
      );

      await expect(service.getAvailableModels()).rejects.toThrow(OpenRouterServiceError);
    }, 10000);
  });

  describe("validateApiKey method", () => {
    it("should return true for valid API key", async () => {
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }));

      const result = await service.validateApiKey();

      expect(result).toBe(true);
    });

    it("should return false for invalid API key", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { code: "invalid_api_key", message: "Invalid API key" } }), {
          status: 401,
        })
      );

      const result = await service.validateApiKey();

      expect(result).toBe(false);
    });

    it("should throw error for other API errors", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { code: "server_error", message: "Server error" } }), {
          status: 500,
        })
      );

      await expect(service.validateApiKey()).rejects.toThrow(OpenRouterServiceError);
    }, 10000);
  });

  describe("Error handling and retries", () => {
    it("should retry on rate limiting with exponential backoff", async () => {
      // Mock rate limit response followed by success
      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ error: { code: "rate_limit", message: "Rate limited" } }), {
            status: 429,
          })
        )
        .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }));

      // Mock timers to speed up test
      vi.useFakeTimers();

      const promise = service.validateApiKey();

      // Fast-forward timers
      await vi.advanceTimersByTimeAsync(2000);

      const result = await promise;

      vi.useRealTimers();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should retry on server errors", async () => {
      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ error: { code: "server_error", message: "Server error" } }), {
            status: 500,
          })
        )
        .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }));

      vi.useFakeTimers();

      const promise = service.validateApiKey();
      await vi.advanceTimersByTimeAsync(2000);

      const result = await promise;

      vi.useRealTimers();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
