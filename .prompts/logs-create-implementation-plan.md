# API Endpoint Implementation Plan: POST /api/logs

## 1. Endpoint Overview

The POST /api/logs endpoint creates a new meal log entry with associated ingredients and symptoms. This is a core functionality that enables users to record their food consumption and track potential reactions. The endpoint handles:

- User meal log creation with date and optional notes
- Photo upload and storage to Supabase Storage
- Ingredient normalization (matching raw text to canonical ingredients)
- Symptom tracking with severity scores
- Comprehensive validation and error handling

## 2. Request Details

- **HTTP Method**: POST
- **URL Structure**: `/api/logs`
- **Authentication**: Required (Bearer token from Supabase Auth)
- **Content-Type**: `application/json`

### Parameters

**Required:**
- `log_date` (string): ISO date string (YYYY-MM-DD)
- `ingredients` (array): Minimum 1 item, each containing either `ingredient_id` OR `raw_text`
- `symptoms` (array): Minimum 1 item, each containing `symptom_id` and `severity` (1-5)

**Optional:**
- `notes` (string): User notes, max 1000 characters
- `meal_photo` (string): Base64 encoded image, max 10MB

### Request Body Structure
```typescript
{
  log_date: "2025-01-15",
  notes: "Had dinner at restaurant",
  meal_photo: "base64EncodedImage" | null,
  ingredients: [
    { ingredient_id: 123, raw_text: null },
    { ingredient_id: null, raw_text: "spicy tomato sauce" }
  ],
  symptoms: [
    { symptom_id: 1, severity: 4 }
  ]
}
```

## 3. Used Types

### Request/Response DTOs
- `CreateLogRequest` - Main request payload type
- `CreateLogIngredientItem` - Individual ingredient specification
- `CreateLogSymptomItem` - Individual symptom with severity
- `LogResponse` - Complete log response with populated data
- `LogIngredientResponse` - Populated ingredient data in response
- `LogSymptomResponse` - Populated symptom data in response

### Error Types
- `ValidationErrorResponse` - For 400 Bad Request errors
- `BusinessLogicErrorResponse` - For 422 Unprocessable Entity errors
- `AuthorizationErrorResponse` - For 401/403 errors

### Service Command Models
- `CreateLogCommand` - Internal service command model
- `NormalizeIngredientsCommand` - For ingredient normalization service
- `UploadPhotoCommand` - For photo storage service

## 4. Response Details

### Success Response (201 Created)
```typescript
{
  data: {
    id: "550e8400-e29b-41d4-a716-446655440000",
    user_id: "user-uuid",
    log_date: "2025-01-15",
    notes: "Had dinner at restaurant",
    meal_photo_url: "signed-url-expires-in-1h",
    created_at: "2025-01-15T18:30:00Z",
    ingredients: [
      {
        ingredient_id: 123,
        name: "tomatoes",
        raw_text: "spicy tomato sauce",
        match_confidence: 0.85
      }
    ],
    symptoms: [
      {
        symptom_id: 1,
        name: "bloating",
        severity: 4
      }
    ]
  }
}
```

### Error Responses
- **400 Bad Request**: Validation errors, malformed JSON
- **401 Unauthorized**: Missing or invalid authentication token
- **413 Payload Too Large**: Photo exceeds 10MB limit
- **422 Unprocessable Entity**: Business logic validation failures
- **500 Internal Server Error**: Database or storage service failures

## 5. Data Flow

1. **Request Reception**: Astro endpoint receives POST request
2. **Authentication**: Validate Bearer token via `context.locals.supabase.auth.getSession()`
3. **Input Validation**: Zod schema validation of request payload
4. **Photo Processing**: If photo provided, validate size and upload to Supabase Storage
5. **Ingredient Normalization**: Process raw_text ingredients through normalization service
6. **Database Transaction**: 
   - Insert log record
   - Insert log_ingredients associations
   - Insert log_symptoms associations
7. **Response Assembly**: Query populated data and generate signed photo URL
8. **Return Response**: Send 201 with complete log data

### Database Interactions
```sql
-- Main log insertion
INSERT INTO logs (user_id, log_date, notes, meal_photo_url) VALUES (...);

-- Ingredient associations
INSERT INTO log_ingredients (log_id, ingredient_id, raw_text, match_confidence) VALUES (...);

-- Symptom associations  
INSERT INTO log_symptoms (log_id, symptom_id, severity) VALUES (...);

-- Response query with joins
SELECT l.*, i.name, s.name FROM logs l
JOIN log_ingredients li ON l.id = li.log_id
JOIN ingredients i ON li.ingredient_id = i.id
JOIN log_symptoms ls ON l.id = ls.log_id
JOIN symptoms s ON ls.symptom_id = s.id
WHERE l.id = ? AND l.user_id = ?;
```

## 6. Security Considerations

### Authentication & Authorization
- **Bearer Token Validation**: Verify Supabase session token on every request
- **User Ownership**: RLS policies ensure users can only access their own data
- **Session Expiry**: Handle expired tokens gracefully with 401 responses

### Data Protection
- **Photo Storage**: Use Supabase Storage private buckets with signed URLs
- **Input Sanitization**: Zod validation prevents injection attacks
- **File Upload Security**: Validate photo MIME types and size limits

### Row-Level Security Policies
```sql
-- Users can only insert logs for themselves
CREATE POLICY "Users can insert their own logs" ON logs
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only access ingredients for their logs
CREATE POLICY "Users access log_ingredients for own logs" ON log_ingredients
FOR ALL USING (EXISTS (
  SELECT 1 FROM logs WHERE logs.id = log_ingredients.log_id AND logs.user_id = auth.uid()
));
```

## 7. Error Handling

### Validation Errors (400)
- Invalid date formats
- Missing required fields
- Invalid severity values (not 1-5)
- Empty ingredients/symptoms arrays
- Notes exceeding 1000 characters

### Authentication Errors (401)
- Missing Authorization header
- Expired or invalid token
- User session not found

### Business Logic Errors (422)
- Photo size exceeds 10MB limit
- Ingredient normalization failures
- Database constraint violations
- Invalid ingredient/symptom IDs

### Server Errors (500)
- Database connection failures
- Supabase Storage service errors
- Unexpected service exceptions

## 8. Performance Considerations

### Optimization Strategies
- **Database Indexing**: Composite indexes on `(user_id, log_date)` for efficient queries
- **Photo Processing**: Async upload to avoid blocking request
- **Ingredient Normalization**: Cache common normalizations
- **Response Size**: Limit joined data to essential fields only

### Potential Bottlenecks
- **Large Photo Uploads**: 10MB limit may cause timeout issues
- **Complex Ingredient Normalization**: LLM fallback adds latency
- **Multiple Database Inserts**: Transaction overhead for log creation

## 9. Implementation Steps

### Step 1: Create Zod Validation Schema
```typescript
// src/lib/validation/log-schemas.ts
const CreateLogSchema = z.object({
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(date => !isNaN(Date.parse(date))),
  notes: z.string().max(1000).optional(),
  meal_photo: z.string().optional(),
  ingredients: z.array(z.object({
    ingredient_id: z.number().int().positive().optional(),
    raw_text: z.string().min(1).max(100).optional()
  })).min(1).refine(items => items.every(item => item.ingredient_id || item.raw_text)),
  symptoms: z.array(z.object({
    symptom_id: z.number().int().positive(),
    severity: z.number().int().min(1).max(5)
  })).min(1)
});
```

### Step 2: Create Service Layer
```typescript
// src/lib/services/log-service.ts
export class LogService {
  async createLog(command: CreateLogCommand): Promise<LogResponse>
  private async uploadPhoto(photo: string): Promise<string>
  private async normalizeIngredients(items: CreateLogIngredientItem[]): Promise<LogIngredientResponse[]>
  private async populateSymptoms(items: CreateLogSymptomItem[]): Promise<LogSymptomResponse[]>
}
```

### Step 3: Create Astro Endpoint
```typescript
// src/pages/api/logs.ts
export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  // Implementation following Astro patterns
}
```

### Step 4: Implement Photo Storage Service
```typescript
// src/lib/services/photo-storage-service.ts
export class PhotoStorageService {
  async uploadPhoto(photoData: string, userId: string): Promise<string>
  async generateSignedUrl(photoPath: string): Promise<string>
}
```

### Step 5: Implement Ingredient Normalization Service
```typescript
// src/lib/services/ingredient-normalization-service.ts
export class IngredientNormalizationService {
  async normalizeIngredients(rawTexts: string[]): Promise<NormalizedIngredientMatch[]>
  private async deterministicMatch(text: string): Promise<NormalizedIngredientMatch[]>
  private async fuzzyMatch(text: string): Promise<NormalizedIngredientMatch[]>
}
```

### Step 6: Implement Database Operations
```typescript
// src/lib/services/log-repository.ts
export class LogRepository {
  async createLogWithAssociations(logData: CreateLogCommand): Promise<string>
  async getPopulatedLog(logId: string, userId: string): Promise<LogResponse>
}
```

### Step 7: Add Error Handling Middleware
```typescript
// src/lib/middleware/error-handler.ts
export function handleApiError(error: unknown): Response
```

### Step 8: Implement Authentication Middleware
```typescript
// src/lib/middleware/auth-middleware.ts
export async function validateAuthToken(context: APIContext): Promise<string>
```

### Step 9: Add Comprehensive Tests
```typescript
// tests/api/logs.test.ts
- Unit tests for validation schemas
- Integration tests for service layer
- E2E tests for complete endpoint flow
```

### Step 10: Configure RLS Policies
```sql
-- supabase/migrations/20251221130000_logs_rls_policies.sql
-- Implement comprehensive RLS policies for all related tables
```