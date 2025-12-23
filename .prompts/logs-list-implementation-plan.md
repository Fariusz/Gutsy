# API Endpoint Implementation Plan: GET /api/logs

## 1. Endpoint Overview

The GET /api/logs endpoint retrieves a paginated list of user's meal logs with optional date filtering. This endpoint supports the core functionality for users to view their historical food intake records and track patterns over time. The endpoint handles:

- Paginated log retrieval with configurable page size
- Date range filtering for specific time periods
- Populated ingredient and symptom data with joins
- Signed URL generation for meal photos
- Performance optimization through indexed queries

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/logs`
- **Authentication**: Required (Bearer token from Supabase Auth)
- **Content-Type**: Not applicable (GET request)

### Parameters

**Optional Query Parameters:**

- `start` (string): ISO date string (YYYY-MM-DD) for range start
- `end` (string): ISO date string (YYYY-MM-DD) for range end
- `page` (number): Page number, default 1, minimum 1
- `limit` (number): Items per page, default 20, maximum 100

### Example URLs

```
GET /api/logs
GET /api/logs?start=2024-12-01&end=2025-01-15
GET /api/logs?page=2&limit=50
GET /api/logs?start=2024-12-01&page=1&limit=10
```

## 3. Used Types

### Request/Response DTOs

- `LogsQueryParams` - Query parameter validation type
- `LogsListResponse` - Paginated response wrapper
- `LogResponse` - Individual log item in response
- `LogIngredientResponse` - Populated ingredient data
- `LogSymptomResponse` - Populated symptom data
- `PaginationMeta` - Pagination metadata structure

### Service Models

- `GetLogsQuery` - Internal service query model
- `PaginationOptions` - Service layer pagination handling

## 4. Response Details

### Success Response (200 OK)

```typescript
{
  data: [
    {
      id: "550e8400-e29b-41d4-a716-446655440000",
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
  ],
  pagination: {
    current_page: 1,
    total_pages: 5,
    total_count: 87,
    has_next: true,
    has_prev: false
  }
}
```

### Error Responses

- **400 Bad Request**: Invalid query parameters, malformed dates
- **401 Unauthorized**: Missing or invalid authentication token
- **500 Internal Server Error**: Database query failures

## 5. Data Flow

1. **Request Reception**: Astro endpoint receives GET request with query params
2. **Authentication**: Validate Bearer token via `context.locals.supabase.auth.getSession()`
3. **Parameter Validation**: Zod schema validation of query parameters
4. **Query Construction**: Build database query with filters and pagination
5. **Database Query**: Execute optimized query with joins for ingredients/symptoms
6. **Photo URL Generation**: Generate signed URLs for meal photos
7. **Pagination Calculation**: Compute pagination metadata
8. **Response Assembly**: Format data according to LogsListResponse structure

### Database Query Pattern

```sql
-- Main query with joins and pagination
SELECT
  l.id, l.log_date, l.notes, l.meal_photo_url, l.created_at,
  li.ingredient_id, i.name as ingredient_name, li.raw_text, li.match_confidence,
  ls.symptom_id, s.name as symptom_name, ls.severity
FROM logs l
LEFT JOIN log_ingredients li ON l.id = li.log_id
LEFT JOIN ingredients i ON li.ingredient_id = i.id
LEFT JOIN log_symptoms ls ON l.id = ls.log_id
LEFT JOIN symptoms s ON ls.symptom_id = s.id
WHERE l.user_id = ?
  AND (? IS NULL OR l.log_date >= ?)
  AND (? IS NULL OR l.log_date <= ?)
ORDER BY l.log_date DESC, l.created_at DESC
LIMIT ? OFFSET ?;

-- Count query for pagination
SELECT COUNT(*) FROM logs l
WHERE l.user_id = ?
  AND (? IS NULL OR l.log_date >= ?)
  AND (? IS NULL OR l.log_date <= ?);
```

## 6. Security Considerations

### Authentication & Authorization

- **Bearer Token Validation**: Verify Supabase session token
- **User Isolation**: RLS policies ensure users only see their own logs
- **Query Parameter Sanitization**: Prevent SQL injection through validation

### Data Protection

- **Photo Access**: Generate short-lived signed URLs (1 hour expiry)
- **Rate Limiting**: Consider implementing rate limits for large data queries
- **Data Pagination**: Prevent excessive data exposure through pagination limits

## 7. Error Handling

### Query Parameter Errors (400)

- Invalid date formats (not YYYY-MM-DD)
- Invalid page numbers (less than 1)
- Invalid limit values (exceeding maximum of 100)
- End date before start date

### Authentication Errors (401)

- Missing Authorization header
- Expired or invalid session token

### Server Errors (500)

- Database connection failures
- Supabase Storage errors for photo URLs
- Query timeout issues

## 8. Performance Considerations

### Optimization Strategies

- **Database Indexing**: Composite index on `(user_id, log_date DESC)`
- **Query Efficiency**: Use LIMIT/OFFSET for pagination
- **Photo URL Caching**: Cache signed URLs for recently accessed photos
- **Response Size Control**: Pagination prevents large response payloads

### Potential Bottlenecks

- **Large Date Ranges**: Queries spanning months may be slow
- **Complex Joins**: Multiple LEFT JOINs with ingredients/symptoms
- **Photo URL Generation**: Bulk signed URL creation

## 9. Implementation Steps

### Step 1: Create Query Parameter Validation Schema

```typescript
// src/lib/validation/log-schemas.ts
const LogsQuerySchema = z
  .object({
    start: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    end: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine(
    (data) => {
      if (data.start && data.end) {
        return new Date(data.start) <= new Date(data.end);
      }
      return true;
    },
    { message: "End date must be after start date" }
  );
```

### Step 2: Create Service Layer

```typescript
// src/lib/services/log-service.ts (extend existing)
export class LogService {
  async getUserLogs(query: GetLogsQuery): Promise<LogsListResponse> {
    const { logs, totalCount } = await this.logRepository.getLogsWithPagination(query);
    const populatedLogs = await this.populateLogData(logs);

    return {
      data: populatedLogs,
      pagination: this.calculatePagination(query.page, query.limit, totalCount),
    };
  }

  private async populateLogData(logs: Log[]): Promise<LogResponse[]> {
    // Generate signed URLs and populate related data
  }

  private calculatePagination(page: number, limit: number, total: number): PaginationMeta {
    // Calculate pagination metadata
  }
}
```

### Step 3: Create Astro GET Endpoint

```typescript
// src/pages/api/logs.ts (extend existing file)
export async function GET(context: APIContext): Promise<Response> {
  try {
    const userId = await validateAuthToken(context);

    const url = new URL(context.request.url);
    const queryParams = LogsQuerySchema.parse(Object.fromEntries(url.searchParams));

    const logService = new LogService(context.locals.supabase);
    const result = await logService.getUserLogs({
      userId,
      ...queryParams,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Step 4: Implement Repository Layer

```typescript
// src/lib/services/log-repository.ts (extend existing)
export class LogRepository {
  async getLogsWithPagination(query: GetLogsQuery): Promise<{ logs: LogWithRelations[]; totalCount: number }> {
    const offset = (query.page - 1) * query.limit;

    const { data: logs, error: logsError } = await this.supabase
      .from("logs")
      .select(
        `
        *,
        log_ingredients (
          ingredient_id,
          raw_text,
          match_confidence,
          ingredients (name)
        ),
        log_symptoms (
          symptom_id,
          severity,
          symptoms (name)
        )
      `
      )
      .eq("user_id", query.userId)
      .gte("log_date", query.start || "1900-01-01")
      .lte("log_date", query.end || "2100-12-31")
      .order("log_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + query.limit - 1);

    const { count, error: countError } = await this.supabase
      .from("logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", query.userId)
      .gte("log_date", query.start || "1900-01-01")
      .lte("log_date", query.end || "2100-12-31");

    if (logsError || countError) throw new Error("Database query failed");

    return { logs: logs || [], totalCount: count || 0 };
  }
}
```

### Step 5: Add Photo URL Service

```typescript
// src/lib/services/photo-storage-service.ts (extend existing)
export class PhotoStorageService {
  async generateSignedUrls(photoPaths: string[]): Promise<Map<string, string>> {
    const urlMap = new Map<string, string>();

    for (const path of photoPaths) {
      if (path) {
        const { data } = await this.supabase.storage.from("meal-photos").createSignedUrl(path, 3600); // 1 hour expiry

        if (data?.signedUrl) {
          urlMap.set(path, data.signedUrl);
        }
      }
    }

    return urlMap;
  }
}
```

### Step 6: Add Performance Monitoring

```typescript
// src/lib/middleware/performance-monitor.ts
export function logQueryPerformance(startTime: number, queryType: string, recordCount: number) {
  const duration = Date.now() - startTime;
  if (duration > 1000) {
    // Log slow queries
    console.warn(`Slow query detected: ${queryType} took ${duration}ms for ${recordCount} records`);
  }
}
```

### Step 7: Implement Caching Strategy

```typescript
// src/lib/cache/photo-url-cache.ts
export class PhotoUrlCache {
  private cache = new Map<string, { url: string; expires: number }>();

  get(photoPath: string): string | null {
    const cached = this.cache.get(photoPath);
    if (cached && cached.expires > Date.now()) {
      return cached.url;
    }
    return null;
  }

  set(photoPath: string, url: string, ttl: number = 3000000): void {
    // 50 min TTL
    this.cache.set(photoPath, { url, expires: Date.now() + ttl });
  }
}
```

### Step 8: Add Database Indexes

```sql
-- supabase/migrations/20251221140000_logs_query_indexes.sql
-- Composite index for efficient log querying
CREATE INDEX IF NOT EXISTS logs_user_date_idx
ON logs (user_id, log_date DESC, created_at DESC);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS logs_user_date_range_idx
ON logs (user_id, log_date)
WHERE log_date IS NOT NULL;
```

### Step 9: Add Comprehensive Tests

```typescript
// tests/api/logs-get.test.ts
describe("GET /api/logs", () => {
  test("returns paginated logs with default parameters");
  test("filters logs by date range");
  test("respects pagination limits");
  test("generates signed URLs for photos");
  test("handles invalid query parameters");
  test("enforces user isolation via RLS");
});
```

### Step 10: Add Error Recovery

```typescript
// src/lib/middleware/error-recovery.ts
export function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  // Implement exponential backoff retry logic for transient failures
}
```
