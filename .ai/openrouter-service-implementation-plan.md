# OpenRouter Service Implementation Plan

## Service Description

The `OpenRouterService` is a class-based service that handles communication with the OpenRouter API for Large Language Model (LLM) chat completions. It provides a clean interface for sending structured prompts and receiving responses from various AI models available through OpenRouter.

## Constructor Description

The service constructor accepts:
- `apiKey: string` - OpenRouter API key for authentication
- `baseUrl?: string` - Optional base URL (defaults to https://openrouter.ai/api/v1)

## Public Methods and Fields

### 1. `chat(options: ChatOptions): Promise<ChatResponse>`
**Purpose:** Main method for sending chat completion requests to OpenRouter API.

**Parameters:**
- `model: string` - Model name (e.g., "anthropic/claude-3.5-sonnet", "openai/gpt-4")
- `messages: Message[]` - Array of chat messages with role and content
- `systemMessage?: string` - Optional system message to set context
- `responseFormat?: ResponseFormat` - Optional structured response format with JSON schema
- `parameters?: ModelParameters` - Optional model parameters (temperature, max_tokens, etc.)

**Returns:** Promise resolving to structured chat response

### 2. `getAvailableModels(): Promise<Model[]>`
**Purpose:** Retrieves list of available models from OpenRouter.

### 3. `validateApiKey(): Promise<boolean>`
**Purpose:** Validates the provided API key by making a test request.

## Private Methods and Fields

### 1. Private Fields
- `private apiKey: string` - Stored API key
- `private baseUrl: string` - API base URL
- `private httpClient: typeof fetch` - HTTP client for requests

### 2. `private makeRequest<T>(endpoint: string, options: RequestOptions): Promise<T>`
**Purpose:** Generic HTTP request handler with error handling and retries.

### 3. `private formatMessages(messages: Message[], systemMessage?: string): FormattedMessage[]`
**Purpose:** Formats messages according to OpenRouter API requirements.

### 4. `private formatResponseFormat(format?: ResponseFormat): OpenRouterResponseFormat | undefined`
**Purpose:** Converts internal response format to OpenRouter API format.

### 5. `private handleApiError(error: any): never`
**Purpose:** Centralized error handling and transformation.

## Error Handling

### Error Scenarios
1. **Authentication Errors (401)** - Invalid API key
2. **Rate Limiting (429)** - Too many requests
3. **Model Not Found (404)** - Invalid model name
4. **Validation Errors (400)** - Invalid request parameters
5. **Network Errors** - Connection issues
6. **Server Errors (5xx)** - OpenRouter API issues

### Error Response Structure
```typescript
interface OpenRouterError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
}
```

### Retry Logic
- Retry on 429 (rate limiting) with exponential backoff
- Retry on 5xx errors up to 3 attempts
- No retry on 4xx errors (except 429)

## Security Considerations

1. **API Key Protection**
   - Never log or expose API keys
   - Validate key format before use
   - Store securely in environment variables

2. **Input Validation**
   - Validate all user inputs using Zod schemas
   - Sanitize message content
   - Validate model names against allowed list

3. **Rate Limiting**
   - Implement client-side rate limiting
   - Handle 429 responses gracefully

## Step-by-Step Implementation Plan

### Step 1: Create Core Service Structure
1. Create `src/lib/services/openrouter-service.ts`
2. Define TypeScript interfaces for all data types
3. Implement the service class constructor and private fields

### Step 2: Add Zod Validation Schemas
1. Add OpenRouter-specific schemas to `src/lib/validation/schemas.ts`
2. Define schemas for chat requests, responses, and error handling
3. Include response_format JSON schema validation

### Step 3: Implement Core HTTP Communication
1. Implement the private `makeRequest` method
2. Add error handling and retry logic
3. Create helper methods for request formatting

### Step 4: Implement Public Chat Method
1. Implement the main `chat` method
2. Add support for system messages, user messages, and structured responses
3. Handle model parameters and response formatting

### Step 5: Create API Endpoint
1. Create `src/pages/api/chat.ts` endpoint
2. Integrate with the OpenRouterService
3. Add authentication and input validation

### Step 6: Add Supporting Methods
1. Implement `getAvailableModels` method
2. Add `validateApiKey` method
3. Create comprehensive error handling

### Step 7: Testing and Documentation
1. Create unit tests for the service
2. Add integration tests for the API endpoint
3. Update documentation and type definitions

## Configuration Examples

### System Message
```typescript
const systemMessage = "You are a helpful assistant that provides accurate information about cooking recipes.";
```

### User Message
```typescript
const messages = [
  { role: "user", content: "What ingredients do I need for chocolate chip cookies?" }
];
```

### Structured Response Format
```typescript
const responseFormat = {
  type: 'json_schema',
  json_schema: {
    name: 'recipe_ingredients',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        ingredients: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              amount: { type: 'string' },
              unit: { type: 'string' }
            },
            required: ['name', 'amount', 'unit']
          }
        },
        totalItems: { type: 'number' }
      },
      required: ['ingredients', 'totalItems']
    }
  }
};
```

### Model Parameters
```typescript
const parameters = {
  temperature: 0.7,
  max_tokens: 1000,
  top_p: 0.9
};
```