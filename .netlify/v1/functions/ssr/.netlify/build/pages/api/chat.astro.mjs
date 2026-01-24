import { C as ChatRequestSchema, a as ChatResponseSchema, M as ModelsResponseSchema, O as OpenRouterErrorSchema } from '../../chunks/schemas_DPM-KRni.mjs';
export { renderers } from '../../renderers.mjs';

class OpenRouterServiceError extends Error {
  constructor(message, code, retryable = false, details) {
    super(message);
    this.code = code;
    this.retryable = retryable;
    this.details = details;
    this.name = "OpenRouterServiceError";
  }
}
class OpenRouterService {
  apiKey;
  baseUrl;
  httpClient;
  constructor(apiKey, baseUrl) {
    if (!apiKey || typeof apiKey !== "string") {
      throw new Error("OpenRouter API key is required and must be a string");
    }
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || "https://openrouter.ai/api/v1";
    this.httpClient = fetch;
  }
  /**
   * Main method for sending chat completion requests
   */
  async chat(options) {
    const validationResult = ChatRequestSchema.safeParse(options);
    if (!validationResult.success) {
      throw new OpenRouterServiceError(
        `Invalid chat request: ${validationResult.error.message}`,
        "VALIDATION_ERROR",
        false,
        validationResult.error
      );
    }
    const { model, messages, systemMessage, responseFormat, parameters } = validationResult.data;
    const formattedMessages = this.formatMessages(messages, systemMessage);
    const requestBody = {
      model,
      messages: formattedMessages
    };
    if (parameters) {
      Object.assign(requestBody, parameters);
    }
    if (responseFormat) {
      requestBody.response_format = this.formatResponseFormat(responseFormat);
    }
    try {
      const response = await this.makeRequest("/chat/completions", {
        method: "POST",
        headers: {},
        body: JSON.stringify(requestBody)
      });
      const parsedResponse = ChatResponseSchema.safeParse(response);
      if (!parsedResponse.success) {
        throw new OpenRouterServiceError(
          "Invalid response format from OpenRouter API",
          "RESPONSE_PARSE_ERROR",
          false,
          parsedResponse.error
        );
      }
      return parsedResponse.data;
    } catch (error) {
      if (error instanceof OpenRouterServiceError) {
        throw error;
      }
      throw new OpenRouterServiceError("Failed to complete chat request", "CHAT_REQUEST_FAILED", true, error);
    }
  }
  /**
   * Retrieves list of available models from OpenRouter
   */
  async getAvailableModels() {
    try {
      const response = await this.makeRequest("/models", {
        method: "GET",
        headers: {}
      });
      const parsedResponse = ModelsResponseSchema.safeParse(response);
      if (!parsedResponse.success) {
        throw new OpenRouterServiceError(
          "Invalid models response format from OpenRouter API",
          "RESPONSE_PARSE_ERROR",
          false,
          parsedResponse.error
        );
      }
      return parsedResponse.data.data;
    } catch (error) {
      if (error instanceof OpenRouterServiceError) {
        throw error;
      }
      throw new OpenRouterServiceError("Failed to retrieve available models", "MODELS_REQUEST_FAILED", true, error);
    }
  }
  /**
   * Validates the provided API key
   */
  async validateApiKey() {
    try {
      await this.makeRequest("/models", {
        method: "GET",
        headers: {}
      });
      return true;
    } catch (error) {
      if (error instanceof OpenRouterServiceError) {
        if (error.code === "AUTHENTICATION_ERROR") {
          return false;
        }
        throw error;
      }
      throw new OpenRouterServiceError("Failed to validate API key", "VALIDATION_REQUEST_FAILED", true, error);
    }
  }
  /**
   * Calculate exponential backoff delay
   */
  calculateBackoffDelay(attempt) {
    return Math.pow(2, attempt) * 1e3;
  }
  /**
   * Create request headers for OpenRouter API
   */
  createHeaders(additionalHeaders) {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://localhost:3000",
      // Required by OpenRouter
      "X-Title": "Gutsy App",
      // Required by OpenRouter
      ...additionalHeaders
    };
  }
  /**
   * Handle rate limiting with exponential backoff
   */
  async handleRateLimit(attempt, maxRetries) {
    if (attempt < maxRetries) {
      const delay = this.calculateBackoffDelay(attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return true;
    }
    return false;
  }
  /**
   * Generic HTTP request handler with error handling and retries
   */
  async makeRequest(endpoint, options) {
    const url = `${this.baseUrl}${endpoint}`;
    const maxRetries = 3;
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.httpClient(url, {
          ...options,
          headers: this.createHeaders(options.headers)
        });
        if (response.status === 429) {
          const shouldRetry = await this.handleRateLimit(attempt, maxRetries);
          if (shouldRetry) continue;
          throw new Error("Rate limit exceeded after maximum retries");
        }
        if (response.status >= 500 && attempt < maxRetries) {
          const shouldRetry = await this.handleRateLimit(attempt, maxRetries);
          if (shouldRetry) continue;
        }
        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: { code: "PARSE_ERROR", message: errorText } };
          }
          const parsedError = OpenRouterErrorSchema.safeParse(errorData);
          if (parsedError.success) {
            this.handleApiError({
              status: response.status,
              data: parsedError.data
            });
          } else {
            this.handleApiError({
              status: response.status,
              data: { error: { code: "UNKNOWN_ERROR", message: "Unknown API error" } }
            });
          }
        }
        const responseText = await response.text();
        try {
          return JSON.parse(responseText);
        } catch (parseError) {
          throw new OpenRouterServiceError("Failed to parse API response as JSON", "PARSE_ERROR", false, {
            responseText,
            parseError
          });
        }
      } catch (error) {
        lastError = error;
        if (error instanceof OpenRouterServiceError) {
          throw error;
        }
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1e3;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }
    }
    throw new OpenRouterServiceError(`Request failed after ${maxRetries} attempts`, "NETWORK_ERROR", true, lastError);
  }
  /**
   * Formats messages according to OpenRouter API requirements
   */
  formatMessages(messages, systemMessage) {
    const formattedMessages = [];
    if (systemMessage?.trim()) {
      formattedMessages.push({
        role: "system",
        content: systemMessage.trim()
      });
    }
    formattedMessages.push(...messages);
    return formattedMessages;
  }
  /**
   * Converts internal response format to OpenRouter API format
   */
  formatResponseFormat(format) {
    if (!format) {
      return void 0;
    }
    return {
      type: format.type,
      json_schema: {
        name: format.json_schema.name,
        strict: format.json_schema.strict,
        schema: format.json_schema.schema
      }
    };
  }
  /**
   * Centralized error handling and transformation
   */
  handleApiError(errorResponse) {
    const { status, data } = errorResponse;
    const error = data.error;
    switch (status) {
      case 401:
        throw new OpenRouterServiceError("Invalid API key", "AUTHENTICATION_ERROR", false, error);
      case 403:
        throw new OpenRouterServiceError("Access forbidden - check your API key permissions", "AUTHORIZATION_ERROR", false, error);
      case 404:
        throw new OpenRouterServiceError("Model not found - check the model name", "MODEL_NOT_FOUND", false, error);
      case 400:
        throw new OpenRouterServiceError(`Invalid request: ${error.message || "Bad request"}`, "VALIDATION_ERROR", false, error);
      case 429:
        throw new OpenRouterServiceError("Rate limit exceeded - please retry later", "RATE_LIMIT_ERROR", true, error);
      case 500:
      case 502:
      case 503:
      case 504:
        throw new OpenRouterServiceError("OpenRouter API server error - please retry later", "SERVER_ERROR", true, error);
      default:
        throw new OpenRouterServiceError(`Unexpected API error: ${error.message || "Unknown error"}`, "UNKNOWN_ERROR", false, error);
    }
  }
}

const prerender = false;
const ChatEndpointSchema = ChatRequestSchema.extend({
  // Additional endpoint-specific validations can go here
});
const POST = async (context) => {
  try {
    const {
      data: { session },
      error: sessionError
    } = await context.locals.supabase.auth.getSession();
    if (sessionError || !session) {
      return new Response(
        JSON.stringify({
          error: "Authentication required",
          code: "UNAUTHORIZED"
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    let body;
    try {
      body = await context.request.json();
    } catch (parseError) {
      console.error("Chat API - JSON parse error:", parseError);
      return new Response(
        JSON.stringify({
          error: "Invalid JSON in request body",
          code: "INVALID_JSON"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const validationResult = ChatEndpointSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request data",
          code: "VALIDATION_ERROR",
          details: validationResult.error.issues
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const apiKey = "";
    if (!apiKey) {
      console.error("OPENROUTER_API_KEY environment variable is not set");
      return new Response(
        JSON.stringify({
          error: "OpenRouter service is not configured",
          code: "SERVICE_UNAVAILABLE"
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const openRouterService = new OpenRouterService(apiKey);
    const chatResponse = await openRouterService.chat(validationResult.data);
    return new Response(JSON.stringify(chatResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Chat API error:", error);
    if (error && typeof error === "object" && "name" in error && error.name === "OpenRouterServiceError") {
      const serviceError = error;
      const statusCode = (() => {
        switch (serviceError.code) {
          case "AUTHENTICATION_ERROR":
          case "AUTHORIZATION_ERROR":
            return 401;
          case "VALIDATION_ERROR":
          case "MODEL_NOT_FOUND":
            return 400;
          case "RATE_LIMIT_ERROR":
            return 429;
          case "SERVER_ERROR":
            return 503;
          default:
            return 500;
        }
      })();
      return new Response(
        JSON.stringify({
          error: serviceError.message,
          code: serviceError.code,
          retryable: serviceError.retryable
        }),
        {
          status: statusCode,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        code: "INTERNAL_ERROR"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
const GET = async (context) => {
  try {
    const {
      data: { session },
      error: sessionError
    } = await context.locals.supabase.auth.getSession();
    if (sessionError || !session) {
      return new Response(
        JSON.stringify({
          error: "Authentication required",
          code: "UNAUTHORIZED"
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const apiKey = "";
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "OpenRouter service is not configured",
          code: "SERVICE_UNAVAILABLE"
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const openRouterService = new OpenRouterService(apiKey);
    const models = await openRouterService.getAvailableModels();
    return new Response(JSON.stringify({ models }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Models API error:", error);
    if (error && typeof error === "object" && "name" in error && error.name === "OpenRouterServiceError") {
      const serviceError = error;
      return new Response(
        JSON.stringify({
          error: serviceError.message,
          code: serviceError.code,
          retryable: serviceError.retryable
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    return new Response(
      JSON.stringify({
        error: "Failed to retrieve models",
        code: "INTERNAL_ERROR"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
