# API Endpoint Implementation Plan: GET /api/ingredients

## 1. Endpoint Overview

The GET /api/ingredients endpoint provides access to the canonical ingredient database for user selection during log creation. This endpoint supports ingredient search functionality and ensures users can select from standardized ingredient names for consistent correlation analysis. The endpoint handles:

- Fast ingredient search with name filtering
- Paginated results for large ingredient databases
- Cached responses for improved performance
- Future support for user-contributed ingredients

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/ingredients`
- **Authentication**: Required (Bearer token from Supabase Auth)
- **Content-Type**: Not applicable (GET request)

### Parameters

**Optional Query Parameters:**
- `search` (string): Partial ingredient name for filtering
- `limit` (number): Maximum results to return, default 100, maximum 500

### Example URLs
```
GET /api/ingredients
GET /api/ingredients?search=tom
GET /api/ingredients?search=dairy&limit=50
GET /api/ingredients?limit=200
```

## 3. Used Types

### Request/Response DTOs
- `IngredientsQueryParams` - Query parameter validation type
- `IngredientsResponse` - Response wrapper for ingredient list
- `IngredientResponse` - Individual ingredient with metadata
- `Ingredient` - Database entity type from tables

### Service Models
- `IngredientSearchQuery` - Internal service query model

## 4. Response Details

### Success Response (200 OK)
```typescript
{
  data: [
    {
      id: 123,
      name: "tomatoes",
      source: "canonical"
    },
    {
      id: 124,
      name: "wheat flour", 
      source: "canonical"
    },
    {
      id: 125,
      name: "tomato sauce",
      source: "canonical"
    }
  ]
}
```

### Error Responses
- **400 Bad Request**: Invalid query parameters, limit exceeded
- **401 Unauthorized**: Missing or invalid authentication token
- **500 Internal Server Error**: Database query failures

## 5. Data Flow

1. **Request Reception**: Astro endpoint receives GET request with query params
2. **Authentication**: Validate Bearer token (required for rate limiting)
3. **Parameter Validation**: Zod schema validation of query parameters
4. **Cache Check**: Check if results are cached for search query
5. **Database Query**: Execute optimized search query with ILIKE pattern matching
6. **Result Formatting**: Map database results to IngredientResponse format
7. **Cache Update**: Store results in cache for future requests
8. **Response Assembly**: Return formatted ingredient list

### Database Query Pattern
```sql
-- Primary ingredient search query
SELECT id, name
FROM ingredients 
WHERE (? IS NULL OR name ILIKE ? || '%')
  AND status = 'active'  -- Only return active ingredients
ORDER BY 
  CASE WHEN name ILIKE ? || '%' THEN 1 ELSE 2 END,  -- Exact prefix matches first
  LENGTH(name),  -- Shorter names first
  name  -- Alphabetical order
LIMIT ?;

-- Future: Include user-contributed ingredients
SELECT id, name, 'canonical' as source FROM ingredients 
WHERE name ILIKE ? || '%'
UNION ALL
SELECT id, name, 'user' as source FROM proposed_ingredients 
WHERE name ILIKE ? || '%' AND status = 'approved'
ORDER BY source, name
LIMIT ?;
```

## 6. Security Considerations

### Authentication & Authorization
- **Token Validation**: Required to prevent abuse and rate limiting
- **Read-Only Access**: Users can only read ingredient data, no modifications
- **Rate Limiting**: Prevent excessive search queries from single users

### Data Protection
- **Input Sanitization**: Prevent SQL injection through parameterized queries
- **Search Limit Enforcement**: Maximum 500 results to prevent resource abuse
- **No Sensitive Data**: Only ingredient names exposed, no user data

## 7. Error Handling

### Query Parameter Errors (400)
- Invalid limit values (exceeding 500)
- Malformed search parameters
- Empty search strings that are too short

### Authentication Errors (401)
- Missing Authorization header
- Expired or invalid session token

### Server Errors (500)
- Database connection failures
- Search query timeouts
- Cache service errors

## 8. Performance Considerations

### Optimization Strategies
- **Database Indexing**: GIN index on ingredient names for fast text search
- **Result Caching**: Cache search results for common queries
- **Prefix Matching**: Use prefix matching for faster searches than full-text
- **Query Limiting**: Reasonable result limits prevent large payloads

### Potential Bottlenecks
- **Large Ingredient Database**: Searches may slow with thousands of ingredients
- **Complex Search Patterns**: ILIKE queries can be slow without proper indexes
- **Cache Misses**: Cold cache periods may show slower response times

## 9. Implementation Steps

### Step 1: Create Query Parameter Validation Schema
```typescript
// src/lib/validation/ingredient-schemas.ts
const IngredientsQuerySchema = z.object({
  search: z.string().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100)
});
```

### Step 2: Create Service Layer
```typescript
// src/lib/services/ingredient-service.ts
export class IngredientService {
  constructor(
    private supabase: SupabaseClient,
    private cache: IngredientCache
  ) {}

  async searchIngredients(query: IngredientSearchQuery): Promise<IngredientsResponse> {
    const cacheKey = this.cache.generateKey(query.search, query.limit);
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const ingredients = await this.ingredientRepository.searchIngredients(query);
    const result = {
      data: ingredients.map(ing => ({
        id: ing.id,
        name: ing.name,
        source: 'canonical' as const
      }))
    };

    this.cache.set(cacheKey, result);
    return result;
  }
}
```

### Step 3: Create Repository Layer  
```typescript
// src/lib/services/ingredient-repository.ts
export class IngredientRepository {
  constructor(private supabase: SupabaseClient) {}

  async searchIngredients(query: IngredientSearchQuery): Promise<Ingredient[]> {
    let dbQuery = this.supabase
      .from('ingredients')
      .select('id, name')
      .limit(query.limit);

    if (query.search) {
      // Use prefix matching for better performance
      dbQuery = dbQuery.ilike('name', `${query.search}%`);
    }

    // Order by relevance: exact prefix matches first, then by length, then alphabetically
    if (query.search) {
      dbQuery = dbQuery.order('name'); // Temporary ordering, will be refined
    } else {
      dbQuery = dbQuery.order('name');
    }

    const { data, error } = await dbQuery;

    if (error) {
      throw new Error(`Ingredient search failed: ${error.message}`);
    }

    // Post-process for better ordering
    if (query.search && data) {
      return this.sortSearchResults(data, query.search);
    }

    return data || [];
  }

  private sortSearchResults(ingredients: Ingredient[], searchTerm: string): Ingredient[] {
    const searchLower = searchTerm.toLowerCase();
    
    return ingredients.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      // Exact matches first
      const aExact = aName === searchLower ? 1 : 0;
      const bExact = bName === searchLower ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;
      
      // Prefix matches next
      const aPrefix = aName.startsWith(searchLower) ? 1 : 0;
      const bPrefix = bName.startsWith(searchLower) ? 1 : 0;
      if (aPrefix !== bPrefix) return bPrefix - aPrefix;
      
      // Shorter names first
      const lengthDiff = a.name.length - b.name.length;
      if (lengthDiff !== 0) return lengthDiff;
      
      // Alphabetical order
      return a.name.localeCompare(b.name);
    });
  }
}
```

### Step 4: Create Astro Endpoint
```typescript
// src/pages/api/ingredients.ts
export const prerender = false;

export async function GET(context: APIContext): Promise<Response> {
  try {
    const userId = await validateAuthToken(context);
    
    const url = new URL(context.request.url);
    const queryParams = IngredientsQuerySchema.parse(Object.fromEntries(url.searchParams));
    
    const ingredientService = new IngredientService(
      context.locals.supabase,
      new IngredientCache()
    );
    
    const result = await ingredientService.searchIngredients(queryParams);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300" // 5 minute cache
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Step 5: Add Caching Layer
```typescript
// src/lib/cache/ingredient-cache.ts
export class IngredientCache {
  private cache = new Map<string, { result: IngredientsResponse, expires: number }>();
  
  generateKey(search?: string, limit?: number): string {
    return `ingredients:${search || 'all'}:${limit || 100}`;
  }
  
  get(key: string): IngredientsResponse | null {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.result;
    }
    this.cache.delete(key);
    return null;
  }
  
  set(key: string, result: IngredientsResponse, ttl: number = 1800000): void { // 30 min TTL
    this.cache.set(key, { result, expires: Date.now() + ttl });
  }

  invalidate(): void {
    this.cache.clear();
  }

  invalidateSearch(searchTerm: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(searchTerm.toLowerCase())
    );
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}
```

### Step 6: Add Database Indexes
```sql
-- supabase/migrations/20251221170000_ingredient_search_indexes.sql
-- Optimized index for ingredient name searches
CREATE INDEX IF NOT EXISTS ingredients_name_search_idx 
ON ingredients USING GIN (name gin_trgm_ops);

-- Prefix search optimization
CREATE INDEX IF NOT EXISTS ingredients_name_prefix_idx 
ON ingredients (name text_pattern_ops);

-- Enable trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add status column for future ingredient management
ALTER TABLE ingredients 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS ingredients_status_idx 
ON ingredients (status) 
WHERE status = 'active';
```

### Step 7: Add Rate Limiting
```typescript
// src/lib/middleware/rate-limiter.ts
export class RateLimiter {
  private requests = new Map<string, { count: number, resetTime: number }>();
  
  checkLimit(userId: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId);
    
    if (!userRequests || userRequests.resetTime < now) {
      this.requests.set(userId, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (userRequests.count >= maxRequests) {
      return false;
    }
    
    userRequests.count++;
    return true;
  }
}
```

### Step 8: Add Search Analytics
```typescript
// src/lib/analytics/search-analytics.ts
export class SearchAnalytics {
  async logSearch(userId: string, searchTerm: string, resultCount: number): Promise<void> {
    // Optional: Log search patterns for improving ingredient database
    console.log(`Search: "${searchTerm}" -> ${resultCount} results for user ${userId}`);
  }

  async getPopularSearches(limit: number = 10): Promise<string[]> {
    // Could implement popular search tracking for autocomplete
    return [];
  }
}
```

### Step 9: Add Performance Monitoring
```typescript
// src/lib/middleware/search-performance-monitor.ts
export function monitorSearchPerformance() {
  return {
    beforeSearch: () => Date.now(),
    afterSearch: (startTime: number, searchTerm: string, resultCount: number) => {
      const duration = Date.now() - startTime;
      
      if (duration > 1000) {
        console.warn(`Slow ingredient search: "${searchTerm}" took ${duration}ms, ${resultCount} results`);
      }
      
      // Could send to monitoring service
    }
  };
}
```

### Step 10: Add Comprehensive Tests
```typescript
// tests/api/ingredients.test.ts
describe('GET /api/ingredients', () => {
  test('returns all ingredients without search parameter');
  test('filters ingredients by search term');
  test('respects limit parameter');
  test('orders results by relevance');
  test('handles empty search results');
  test('enforces authentication requirement');
  test('caches search results effectively');
  test('handles rate limiting');
  
  describe('search ordering', () => {
    test('prioritizes exact matches');
    test('prioritizes prefix matches');
    test('orders by name length');
    test('falls back to alphabetical order');
  });
});

// tests/services/ingredient-service.test.ts
describe('IngredientService', () => {
  test('caches search results');
  test('invalidates cache appropriately');
  test('handles database errors gracefully');
});
```