/**
 * OpenRouter Service for LLM chat completions
 * Handles communication with OpenRouter API for various AI models
 */

import {
  type Message,
  type ResponseFormat,
  type ModelParameters,
  type ChatResponse,
  type Model,
  ChatRequestSchema,
  ChatResponseSchema,
  ModelsResponseSchema,
  OpenRouterErrorSchema,
} from '../validation/schemas.js';

export interface ChatOptions {
  model: string;
  messages: Message[];
  systemMessage?: string;
  responseFormat?: ResponseFormat;
  parameters?: ModelParameters;
}

export class OpenRouterServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false,
    public details?: any
  ) {
    super(message);
    this.name = 'OpenRouterServiceError';
  }
}

interface RequestOptions {
  method: string;
  headers: Record<string, string>;
  body?: string;
}

/**
 * Service class for interacting with OpenRouter API
 * Provides methods for chat completions and model management
 */
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly httpClient: typeof fetch;

  constructor(apiKey: string, baseUrl?: string) {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('OpenRouter API key is required and must be a string');
    }

    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'https://openrouter.ai/api/v1';
    this.httpClient = fetch;
  }

  /**
   * Main method for sending chat completion requests
   */
  async chat(options: ChatOptions): Promise<ChatResponse> {
    // Validate input using Zod schema
    const validationResult = ChatRequestSchema.safeParse(options);
    if (!validationResult.success) {
      throw new OpenRouterServiceError(
        `Invalid chat request: ${validationResult.error.message}`,
        'VALIDATION_ERROR',
        false,
        validationResult.error
      );
    }

    const { model, messages, systemMessage, responseFormat, parameters } = validationResult.data;

    // Format messages with optional system message
    const formattedMessages = this.formatMessages(messages, systemMessage);

    // Build request body
    const requestBody: any = {
      model,
      messages: formattedMessages,
    };

    // Add optional parameters
    if (parameters) {
      Object.assign(requestBody, parameters);
    }

    // Add response format if specified
    if (responseFormat) {
      requestBody.response_format = this.formatResponseFormat(responseFormat);
    }

    try {
      // Make the API request
      const response = await this.makeRequest<any>('/chat/completions', {
        method: 'POST',
        headers: {},
        body: JSON.stringify(requestBody),
      });

      // Validate and parse response
      const parsedResponse = ChatResponseSchema.safeParse(response);
      if (!parsedResponse.success) {
        throw new OpenRouterServiceError(
          'Invalid response format from OpenRouter API',
          'RESPONSE_PARSE_ERROR',
          false,
          parsedResponse.error
        );
      }

      return parsedResponse.data;
    } catch (error) {
      if (error instanceof OpenRouterServiceError) {
        throw error;
      }
      
      throw new OpenRouterServiceError(
        'Failed to complete chat request',
        'CHAT_REQUEST_FAILED',
        true,
        error
      );
    }
  }

  /**
   * Retrieves list of available models from OpenRouter
   */
  async getAvailableModels(): Promise<Model[]> {
    try {
      const response = await this.makeRequest<any>('/models', {
        method: 'GET',
        headers: {},
      });

      const parsedResponse = ModelsResponseSchema.safeParse(response);
      if (!parsedResponse.success) {
        throw new OpenRouterServiceError(
          'Invalid models response format from OpenRouter API',
          'RESPONSE_PARSE_ERROR',
          false,
          parsedResponse.error
        );
      }

      return parsedResponse.data.data;
    } catch (error) {
      if (error instanceof OpenRouterServiceError) {
        throw error;
      }
      
      throw new OpenRouterServiceError(
        'Failed to retrieve available models',
        'MODELS_REQUEST_FAILED',
        true,
        error
      );
    }
  }

  /**
   * Validates the provided API key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      // Make a simple request to test the API key
      await this.makeRequest<any>('/models', {
        method: 'GET',
        headers: {},
      });
      
      return true;
    } catch (error) {
      if (error instanceof OpenRouterServiceError) {
        // Only authentication errors indicate invalid key
        if (error.code === 'AUTHENTICATION_ERROR') {
          return false;
        }
        // Other errors might be temporary, so we re-throw them
        throw error;
      }
      
      throw new OpenRouterServiceError(
        'Failed to validate API key',
        'VALIDATION_REQUEST_FAILED',
        true,
        error
      );
    }
  }

  /**
   * Generic HTTP request handler with error handling and retries
   */
  private async makeRequest<T>(endpoint: string, options: RequestOptions): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.httpClient(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://localhost:3000', // Required by OpenRouter
            'X-Title': 'Gutsy App', // Required by OpenRouter
            ...options.headers,
          },
        });

        // Handle rate limiting with exponential backoff
        if (response.status === 429) {
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }

        // Handle server errors with retry
        if (response.status >= 500 && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: { code: 'PARSE_ERROR', message: errorText } };
          }

          const parsedError = OpenRouterErrorSchema.safeParse(errorData);
          if (parsedError.success) {
            this.handleApiError({
              status: response.status,
              data: parsedError.data,
            });
          } else {
            this.handleApiError({
              status: response.status,
              data: { error: { code: 'UNKNOWN_ERROR', message: 'Unknown API error' } },
            });
          }
        }

        const responseText = await response.text();
        try {
          return JSON.parse(responseText) as T;
        } catch (parseError) {
          throw new OpenRouterServiceError(
            'Failed to parse API response as JSON',
            'PARSE_ERROR',
            false,
            { responseText, parseError }
          );
        }
      } catch (error) {
        lastError = error;
        
        if (error instanceof OpenRouterServiceError) {
          throw error;
        }

        // Network errors - retry if not the last attempt
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    // If we've exhausted all retries
    throw new OpenRouterServiceError(
      `Request failed after ${maxRetries} attempts`,
      'NETWORK_ERROR',
      true,
      lastError
    );
  }

  /**
   * Formats messages according to OpenRouter API requirements
   */
  private formatMessages(messages: Message[], systemMessage?: string): Message[] {
    const formattedMessages: Message[] = [];

    // Add system message first if provided
    if (systemMessage && systemMessage.trim()) {
      formattedMessages.push({
        role: 'system',
        content: systemMessage.trim(),
      });
    }

    // Add user and assistant messages
    formattedMessages.push(...messages);

    return formattedMessages;
  }

  /**
   * Converts internal response format to OpenRouter API format
   */
  private formatResponseFormat(format?: ResponseFormat): any {
    if (!format) {
      return undefined;
    }

    return {
      type: format.type,
      json_schema: {
        name: format.json_schema.name,
        strict: format.json_schema.strict,
        schema: format.json_schema.schema,
      },
    };
  }

  /**
   * Centralized error handling and transformation
   */
  private handleApiError(errorResponse: { status: number; data: any }): never {
    const { status, data } = errorResponse;
    const error = data.error;

    switch (status) {
      case 401:
        throw new OpenRouterServiceError(
          'Invalid API key',
          'AUTHENTICATION_ERROR',
          false,
          error
        );
      case 403:
        throw new OpenRouterServiceError(
          'Access forbidden - check your API key permissions',
          'AUTHORIZATION_ERROR',
          false,
          error
        );
      case 404:
        throw new OpenRouterServiceError(
          'Model not found - check the model name',
          'MODEL_NOT_FOUND',
          false,
          error
        );
      case 400:
        throw new OpenRouterServiceError(
          `Invalid request: ${error.message || 'Bad request'}`,
          'VALIDATION_ERROR',
          false,
          error
        );
      case 429:
        throw new OpenRouterServiceError(
          'Rate limit exceeded - please retry later',
          'RATE_LIMIT_ERROR',
          true,
          error
        );
      case 500:
      case 502:
      case 503:
      case 504:
        throw new OpenRouterServiceError(
          'OpenRouter API server error - please retry later',
          'SERVER_ERROR',
          true,
          error
        );
      default:
        throw new OpenRouterServiceError(
          `Unexpected API error: ${error.message || 'Unknown error'}`,
          'UNKNOWN_ERROR',
          false,
          error
        );
    }
  }
}