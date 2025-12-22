# API Endpoint Implementation Plan: GET /api/triggers

## 1. Endpoint Overview

The GET /api/triggers endpoint provides correlation analysis results by computing trigger scores for ingredients based on their association with symptoms. This is the core analytics feature that helps users identify potential food intolerances. The endpoint handles:

- Statistical correlation analysis via `get_top_triggers` RPC function
- Configurable date ranges for analysis periods
- Confidence interval calculations for statistical significance
- Minimum threshold enforcement for reliable results
- Performance optimization for complex calculations

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/triggers`
- **Authentication**: Required (Bearer token from Supabase Auth)
- **Content-Type**: Not applicable (GET request)

### Parameters

**Optional Query Parameters:**
- `start` (string): ISO date string (YYYY-MM-DD), default 30 days ago
- `end` (string): ISO date string (YYYY-MM-DD), default today
- `limit` (number): Maximum results to return, default 10, maximum 50

### Example URLs
```
GET /api/triggers
GET /api/triggers?start=2024-11-01&end=2025-01-15
GET /api/triggers?limit=20
GET /api/triggers?start=2024-12-01&limit=5
```

## 3. Used Types

### Request/Response DTOs
- `TriggersQueryParams` - Query parameter validation type
- `TriggersResponse` - Response wrapper with data and metadata
- `TriggerResponse` - Individual trigger analysis result
- `TriggerAnalysisMeta` - Analysis metadata and thresholds
- `ConfidenceInterval` - Statistical confidence interval structure
- `DateRange` - Date range metadata

### Service Models
- `TriggerAnalysisQuery` - Internal service query model
- `TriggerCalculationResult` - Raw RPC function result
- `StatisticalThresholds` - Configuration for analysis parameters

## 4. Response Details

### Success Response (200 OK)
```typescript
{
  data: [
    {
      ingredient_id: 123,
      name: "tomatoes",
      consumption_count: 12,
      avg_severity_when_present: 3.4,
      baseline_avg_severity: 2.1,
      trigger_score: 1.62,
      confidence_interval: {
        lower: 1.15,
        upper: 2.09,
        width: 0.94
      }
    }
  ],
  meta: {
    date_range: {
      start: "2024-12-15",
      end: "2025-01-15"
    },
    total_logs: 45,
    min_consumption_threshold: 5,
    min_logs_threshold: 10,
    confidence_level: 0.95
  }
}
```

### Error Responses
- **400 Bad Request**: Invalid date parameters, future dates
- **401 Unauthorized**: Missing or invalid authentication token
- **422 Unprocessable Entity**: Insufficient data for analysis
- **500 Internal Server Error**: RPC function failures

## 5. Data Flow

1. **Request Reception**: Astro endpoint receives GET request with query params
2. **Authentication**: Validate Bearer token and extract user ID
3. **Parameter Validation**: Zod schema validation with date range logic
4. **Data Sufficiency Check**: Verify minimum log count for analysis
5. **RPC Execution**: Call `get_top_triggers` PostgreSQL function
6. **Result Processing**: Filter results by confidence interval width
7. **Metadata Assembly**: Calculate analysis metadata and thresholds
8. **Response Formatting**: Structure data according to TriggersResponse

### Database RPC Function
```sql
-- get_top_triggers RPC function signature
CREATE OR REPLACE FUNCTION get_top_triggers(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  ingredient_id INTEGER,
  ingredient_name TEXT,
  consumption_count INTEGER,
  avg_severity_when_present DECIMAL,
  baseline_avg_severity DECIMAL,
  trigger_score DECIMAL,
  confidence_lower DECIMAL,
  confidence_upper DECIMAL,
  confidence_width DECIMAL
);
```

### Statistical Calculations (within RPC)
```sql
-- Core correlation calculation logic
WITH ingredient_logs AS (
  SELECT 
    li.ingredient_id,
    l.log_date,
    COALESCE(AVG(ls.severity), 0) as daily_avg_severity
  FROM logs l
  LEFT JOIN log_ingredients li ON l.id = li.log_id
  LEFT JOIN log_symptoms ls ON l.id = ls.log_id
  WHERE l.user_id = p_user_id 
    AND l.log_date BETWEEN p_start_date AND p_end_date
  GROUP BY li.ingredient_id, l.log_date
),
trigger_analysis AS (
  SELECT 
    ingredient_id,
    COUNT(*) as consumption_count,
    AVG(daily_avg_severity) as avg_severity_when_present,
    -- Bootstrap confidence intervals calculated here
  FROM ingredient_logs
  WHERE ingredient_id IS NOT NULL
  GROUP BY ingredient_id
  HAVING COUNT(*) >= 5  -- Minimum consumption threshold
)
-- Additional statistical analysis...
```

## 6. Security Considerations

### Authentication & Authorization
- **User Data Isolation**: RLS policies in RPC function ensure user-specific data
- **Function Security**: SECURITY DEFINER on RPC with proper user validation
- **Parameter Sanitization**: All inputs validated before RPC execution

### Data Privacy
- **Aggregate Data Only**: No individual log data exposed in results
- **Statistical Thresholds**: Minimum data requirements prevent profile inference
- **Time-bounded Analysis**: Date range limits prevent excessive historical analysis

## 7. Error Handling

### Query Parameter Errors (400)
- Invalid date formats or ranges
- Future dates in analysis period
- Invalid limit values (exceeding 50)

### Business Logic Errors (422)
- Insufficient total logs (less than 10)
- No ingredient consumption in date range
- All ingredients below consumption threshold

### Authentication Errors (401)
- Missing or expired authentication token

### Server Errors (500)
- RPC function execution failures
- Database performance issues
- Statistical calculation errors

## 8. Performance Considerations

### Optimization Strategies
- **RPC Function**: Server-side calculations avoid data transfer overhead
- **Indexed Queries**: Composite indexes on `(user_id, log_date)` and foreign keys
- **Result Caching**: Cache results for identical query parameters
- **Threshold Filtering**: Early filtering reduces computation overhead

### Potential Bottlenecks
- **Complex Statistics**: Bootstrap confidence intervals are computationally expensive
- **Large Date Ranges**: Analysis over months/years may timeout
- **Multiple Users**: Concurrent analysis requests may strain database

## 9. Implementation Steps

### Step 1: Create Query Parameter Validation Schema
```typescript
// src/lib/validation/trigger-schemas.ts
const TriggersQuerySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), 
  limit: z.coerce.number().int().min(1).max(50).default(10)
}).refine(data => {
  const now = new Date().toISOString().split('T')[0];
  if (data.end && data.end > now) {
    return false; // End date cannot be in future
  }
  if (data.start && data.end) {
    return new Date(data.start) <= new Date(data.end);
  }
  return true;
}, { message: "Invalid date range" });
```

### Step 2: Implement PostgreSQL RPC Function
```sql
-- supabase/migrations/20251221150000_get_top_triggers_rpc.sql
CREATE OR REPLACE FUNCTION get_top_triggers(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  ingredient_id INTEGER,
  ingredient_name TEXT,
  consumption_count INTEGER,
  avg_severity_when_present DECIMAL,
  baseline_avg_severity DECIMAL,
  trigger_score DECIMAL,
  confidence_lower DECIMAL,
  confidence_upper DECIMAL,
  confidence_width DECIMAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  min_logs_threshold INTEGER := 10;
  min_consumption_threshold INTEGER := 5;
  total_user_logs INTEGER;
BEGIN
  -- Check if user has sufficient logs for analysis
  SELECT COUNT(*) INTO total_user_logs
  FROM logs 
  WHERE user_id = p_user_id 
    AND log_date BETWEEN p_start_date AND p_end_date;
  
  IF total_user_logs < min_logs_threshold THEN
    RAISE EXCEPTION 'Insufficient data: minimum % logs required, found %', 
      min_logs_threshold, total_user_logs;
  END IF;

  RETURN QUERY
  WITH user_logs AS (
    -- Core calculation logic implemented here
    -- Including baseline severity calculation
    -- Bootstrap confidence interval calculation
    -- Trigger score computation
  )
  SELECT * FROM user_logs
  WHERE consumption_count >= min_consumption_threshold
    AND confidence_width <= 1.0  -- Filter out wide confidence intervals
  ORDER BY trigger_score DESC
  LIMIT p_limit;
END;
$$;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION get_top_triggers TO authenticated;
```

### Step 3: Create Service Layer
```typescript
// src/lib/services/trigger-analysis-service.ts
export class TriggerAnalysisService {
  constructor(private supabase: SupabaseClient) {}

  async getTriggerAnalysis(query: TriggerAnalysisQuery): Promise<TriggersResponse> {
    const dateRange = this.calculateDateRange(query.start, query.end);
    
    try {
      const { data, error } = await this.supabase.rpc('get_top_triggers', {
        p_user_id: query.userId,
        p_start_date: dateRange.start,
        p_end_date: dateRange.end,
        p_limit: query.limit
      });

      if (error) throw error;

      const triggers = data.map(this.mapRpcResultToTriggerResponse);
      const meta = await this.buildAnalysisMeta(query.userId, dateRange, query.limit);

      return { data: triggers, meta };
    } catch (error) {
      if (error.message.includes('Insufficient data')) {
        throw new BusinessLogicError('Insufficient data for trigger analysis', error.message);
      }
      throw error;
    }
  }

  private calculateDateRange(start?: string, end?: string): DateRange {
    const endDate = end || new Date().toISOString().split('T')[0];
    const startDate = start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return { start: startDate, end: endDate };
  }

  private mapRpcResultToTriggerResponse(rpcResult: any): TriggerResponse {
    return {
      ingredient_id: rpcResult.ingredient_id,
      name: rpcResult.ingredient_name,
      consumption_count: rpcResult.consumption_count,
      avg_severity_when_present: Number(rpcResult.avg_severity_when_present),
      baseline_avg_severity: Number(rpcResult.baseline_avg_severity),
      trigger_score: Number(rpcResult.trigger_score),
      confidence_interval: {
        lower: Number(rpcResult.confidence_lower),
        upper: Number(rpcResult.confidence_upper),
        width: Number(rpcResult.confidence_width)
      }
    };
  }
}
```

### Step 4: Create Astro Endpoint
```typescript
// src/pages/api/triggers.ts
export const prerender = false;

export async function GET(context: APIContext): Promise<Response> {
  try {
    const userId = await validateAuthToken(context);
    
    const url = new URL(context.request.url);
    const queryParams = TriggersQuerySchema.parse(Object.fromEntries(url.searchParams));
    
    const triggerService = new TriggerAnalysisService(context.locals.supabase);
    const result = await triggerService.getTriggerAnalysis({
      userId,
      ...queryParams
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Step 5: Add Result Caching
```typescript
// src/lib/cache/trigger-analysis-cache.ts
export class TriggerAnalysisCache {
  private cache = new Map<string, { result: TriggersResponse, expires: number }>();
  
  generateKey(userId: string, start: string, end: string, limit: number): string {
    return `${userId}:${start}:${end}:${limit}`;
  }
  
  get(key: string): TriggersResponse | null {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.result;
    }
    this.cache.delete(key);
    return null;
  }
  
  set(key: string, result: TriggersResponse, ttl: number = 3600000): void { // 1 hour TTL
    this.cache.set(key, { result, expires: Date.now() + ttl });
  }
}
```

### Step 6: Add Custom Error Types
```typescript
// src/lib/errors/business-logic-error.ts
export class BusinessLogicError extends Error {
  constructor(
    message: string,
    public details: string,
    public statusCode: number = 422
  ) {
    super(message);
    this.name = 'BusinessLogicError';
  }
}

export class InsufficientDataError extends BusinessLogicError {
  constructor(details: string) {
    super('Insufficient data for analysis', details);
  }
}
```

### Step 7: Add Performance Monitoring
```typescript
// src/lib/middleware/rpc-performance-monitor.ts
export function monitorRpcPerformance() {
  return async (rpcCall: () => Promise<any>) => {
    const startTime = Date.now();
    try {
      const result = await rpcCall();
      const duration = Date.now() - startTime;
      
      if (duration > 5000) { // Log slow RPC calls
        console.warn(`Slow RPC call detected: ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`RPC call failed after ${duration}ms:`, error);
      throw error;
    }
  };
}
```

### Step 8: Add Database Indexes for RPC Performance
```sql
-- supabase/migrations/20251221160000_trigger_analysis_indexes.sql
-- Optimize RPC function performance
CREATE INDEX IF NOT EXISTS logs_user_date_analysis_idx 
ON logs (user_id, log_date) 
WHERE log_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS log_ingredients_analysis_idx 
ON log_ingredients (log_id, ingredient_id)
WHERE ingredient_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS log_symptoms_severity_idx 
ON log_symptoms (log_id, severity);

-- Consider partial indexes for frequent queries
CREATE INDEX IF NOT EXISTS logs_recent_analysis_idx 
ON logs (user_id, log_date DESC) 
WHERE log_date >= CURRENT_DATE - INTERVAL '90 days';
```

### Step 9: Add Comprehensive Tests
```typescript
// tests/api/triggers.test.ts
describe('GET /api/triggers', () => {
  test('returns trigger analysis with default parameters');
  test('handles custom date ranges');
  test('respects result limits');
  test('throws error for insufficient data');
  test('handles statistical edge cases');
  test('enforces user data isolation');
  test('caches results appropriately');
});

// tests/rpc/get_top_triggers.test.sql
-- SQL tests for RPC function
```

### Step 10: Add Analytics Configuration
```typescript
// src/lib/config/analytics-config.ts
export const AnalyticsConfig = {
  MIN_LOGS_THRESHOLD: 10,
  MIN_CONSUMPTION_THRESHOLD: 5,
  CONFIDENCE_LEVEL: 0.95,
  MAX_CONFIDENCE_INTERVAL_WIDTH: 1.0,
  DEFAULT_ANALYSIS_PERIOD_DAYS: 30,
  CACHE_TTL_MINUTES: 60
} as const;
```