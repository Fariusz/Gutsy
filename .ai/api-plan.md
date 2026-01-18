# REST API Plan

## 1. Resources

- **logs** - User meal entries with ingredients and symptoms (public.logs, log_ingredients, log_symptoms)
- **ingredients** - Canonical ingredient reference data (public.ingredients)
- **symptoms** - Canonical symptom reference data (public.symptoms)
- **proposed_ingredients** - User-submitted ingredients pending admin review (public.proposed_ingredients)
- **triggers** - Correlation analysis results (computed via get_top_triggers RPC)
- **auth** - User authentication (managed by Supabase Auth)

## 2. Endpoints

### Logs Resource

#### POST /api/logs

**Description:** Create a new meal log with ingredients and symptoms
**Authentication:** Required (Bearer token)
**Query Parameters:** None

**Request Payload:**

```json
{
  "log_date": "2025-01-15",
  "notes": "Had dinner at restaurant",
  "meal_photo": "base64EncodedImage" | null,
  "ingredients": [
    {
      "ingredient_id": 123,
      "raw_text": null
    },
    {
      "ingredient_id": null,
      "raw_text": "spicy tomato sauce"
    }
  ],
  "symptoms": [
    {
      "symptom_id": 1,
      "severity": 4
    }
  ]
}
```

**Response Payload:**

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "user-uuid",
    "log_date": "2025-01-15",
    "notes": "Had dinner at restaurant",
    "meal_photo_url": "path/to/photo.jpg",
    "created_at": "2025-01-15T18:30:00Z",
    "ingredients": [
      {
        "ingredient_id": 123,
        "name": "tomatoes",
        "raw_text": "spicy tomato sauce",
        "match_confidence": 0.85
      }
    ],
    "symptoms": [
      {
        "symptom_id": 1,
        "name": "bloating",
        "severity": 4
      }
    ]
  }
}
```

**Success Codes:**

- 201 Created - Log created successfully

**Error Codes:**

- 400 Bad Request - Invalid payload or validation errors
- 401 Unauthorized - Authentication required
- 413 Payload Too Large - Photo exceeds size limit
- 422 Unprocessable Entity - Business logic validation failed

#### GET /api/logs

**Description:** List user's meal logs with optional date filtering and pagination
**Authentication:** Required (Bearer token)

**Query Parameters:**

- `start` (optional): ISO date string (YYYY-MM-DD)
- `end` (optional): ISO date string (YYYY-MM-DD)
- `page` (optional): integer, default 1
- `limit` (optional): integer, default 20, max 100

**Response Payload:**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "log_date": "2025-01-15",
      "notes": "Had dinner at restaurant",
      "meal_photo_url": "signed-url-expires-in-1h",
      "created_at": "2025-01-15T18:30:00Z",
      "ingredients": [
        {
          "ingredient_id": 123,
          "name": "tomatoes",
          "raw_text": "spicy tomato sauce",
          "match_confidence": 0.85
        }
      ],
      "symptoms": [
        {
          "symptom_id": 1,
          "name": "bloating",
          "severity": 4
        }
      ]
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_count": 87,
    "has_next": true,
    "has_prev": false
  }
}
```

**Success Codes:**

- 200 OK - Logs retrieved successfully

**Error Codes:**

- 400 Bad Request - Invalid query parameters
- 401 Unauthorized - Authentication required

### Ingredients Resource

#### GET /api/ingredients

**Description:** Get canonical ingredient list for selection
**Authentication:** Required (Bearer token)

**Query Parameters:**

- `search` (optional): string for name filtering
- `limit` (optional): integer, default 100, max 500

**Response Payload:**

```json
{
  "data": [
    {
      "id": 123,
      "name": "tomatoes",
      "source": "canonical"
    },
    {
      "id": 124,
      "name": "wheat flour",
      "source": "canonical"
    }
  ]
}
```

**Success Codes:**

- 200 OK - Ingredients retrieved successfully

**Error Codes:**

- 401 Unauthorized - Authentication required

#### POST /api/ingredients/propose

**Description:** Propose a new ingredient for admin review
**Authentication:** Required (Bearer token)

**Request Payload:**

```json
{
  "name": "organic quinoa flour",
  "notes": "Found in specialty health store products"
}
```

**Response Payload:**

```json
{
  "data": {
    "id": 456,
    "name": "organic quinoa flour",
    "status": "pending",
    "user_id": "user-uuid",
    "created_at": "2025-01-15T18:30:00Z"
  }
}
```

**Success Codes:**

- 201 Created - Proposal submitted successfully

**Error Codes:**

- 400 Bad Request - Invalid payload
- 401 Unauthorized - Authentication required
- 409 Conflict - Ingredient already exists or pending

### Symptoms Resource

#### GET /api/symptoms

**Description:** Get canonical symptom list for selection
**Authentication:** Required (Bearer token)

**Response Payload:**

```json
{
  "data": [
    {
      "id": 1,
      "name": "bloating"
    },
    {
      "id": 2,
      "name": "stomach pain"
    },
    {
      "id": 3,
      "name": "nausea"
    }
  ]
}
```

**Success Codes:**

- 200 OK - Symptoms retrieved successfully

**Error Codes:**

- 401 Unauthorized - Authentication required

### Triggers Resource

#### GET /api/triggers

**Description:** Get trigger analysis via correlation engine
**Authentication:** Required (Bearer token)

**Query Parameters:**

- `start` (optional): ISO date string, default 30 days ago
- `end` (optional): ISO date string, default today
- `limit` (optional): integer, default 10, max 50

**Response Payload:**

```json
{
  "data": [
    {
      "ingredient_id": 123,
      "name": "tomatoes",
      "consumption_count": 12,
      "avg_severity_when_present": 3.4,
      "baseline_avg_severity": 2.1,
      "trigger_score": 1.62,
      "confidence_interval": {
        "lower": 1.15,
        "upper": 2.09,
        "width": 0.94
      }
    }
  ],
  "meta": {
    "date_range": {
      "start": "2024-12-15",
      "end": "2025-01-15"
    },
    "total_logs": 45,
    "min_consumption_threshold": 5,
    "min_logs_threshold": 10,
    "confidence_level": 0.95
  }
}
```

**Success Codes:**

- 200 OK - Triggers retrieved successfully

**Error Codes:**

- 400 Bad Request - Invalid date range
- 401 Unauthorized - Authentication required
- 422 Unprocessable Entity - Insufficient data for analysis

### Ingredient Normalization

#### POST /api/ingredients/normalize

**Description:** Normalize raw ingredient text to canonical ingredient IDs
**Authentication:** Required (Bearer token)
**Internal Use:** Called by POST /api/logs, can be exposed for testing

**Request Payload:**

```json
{
  "raw_text": "spicy tomato sauce with basil"
}
```

**Response Payload:**

```json
{
  "data": [
    {
      "ingredient_id": 123,
      "name": "tomatoes",
      "match_confidence": 0.95,
      "match_method": "deterministic"
    },
    {
      "ingredient_id": 456,
      "name": "basil",
      "match_confidence": 0.87,
      "match_method": "fuzzy"
    }
  ],
  "raw_text": "spicy tomato sauce with basil"
}
```

## 3. Authentication and Authorization

### Authentication Mechanism

- **Provider:** Supabase Auth
- **Method:** Bearer token in Authorization header
- **Token Source:** `context.locals.supabase.auth.getSession()`
- **Session Validation:** Server-side session verification on each request

### Authorization Levels

- **Authenticated Users:** Access to own data via RLS policies (`auth.uid() = user_id`)
- **Reference Data Access:** Read access to ingredients/symptoms for authenticated users
- **Admin Operations:** Restricted to admin role for ingredient/symptom modifications

### Row-Level Security (RLS) Implementation

```sql
-- Example RLS policy for logs table
CREATE POLICY "Users can only access their own logs" ON logs
FOR ALL USING (auth.uid() = user_id);

-- Example RLS policy for log_ingredients
CREATE POLICY "Users can only access ingredients for their logs" ON log_ingredients
FOR ALL USING (EXISTS (
  SELECT 1 FROM logs WHERE logs.id = log_ingredients.log_id AND logs.user_id = auth.uid()
));
```

## 4. Validation and Business Logic

### Input Validation (Zod Schemas)

#### Log Creation Validation

```typescript
const CreateLogSchema = z.object({
  log_date: z.string().date(),
  notes: z.string().max(1000).optional(),
  meal_photo: z.string().optional(),
  ingredients: z
    .array(
      z.object({
        ingredient_id: z.number().int().positive().optional(),
        raw_text: z.string().min(1).max(100).optional(),
      })
    )
    .min(1)
    .refine((items) => items.every((item) => item.ingredient_id || item.raw_text)),
  symptoms: z
    .array(
      z.object({
        symptom_id: z.number().int().positive(),
        severity: z.number().int().min(1).max(5),
      })
    )
    .min(1),
});
```

#### Query Parameter Validation

```typescript
const LogsQuerySchema = z.object({
  start: z.string().date().optional(),
  end: z.string().date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
```

### Business Logic Rules

#### Data Integrity Constraints

- Severity values: 1-5 range enforced at database and API levels
- Unique ingredient per log: Composite primary key `(log_id, ingredient_id)`
- Photo size limits: Max 10MB for meal photos
- Date constraints: Log dates cannot be in the future

#### Ingredient Normalization Logic

1. **Deterministic Mapping:** Primary method using tokenization + DB lookup
2. **Fuzzy Matching:** LLM fallback for unmatched ingredients
3. **Confidence Scoring:** 0.0-1.0 scale, minimum 0.5 for inclusion
4. **Metadata Storage:** `raw_text` and `match_confidence` stored for fuzzy matches only

#### Correlation Engine Business Rules

- **Minimum Data Requirements:** ≥10 total logs, ≥5 consumption instances per ingredient
- **Trigger Score Calculation:** `total_symptom_severity_when_present / total_logs_where_present`
- **Confidence Intervals:** Wilson or bootstrap method, configurable confidence level (default 95%)
- **Result Filtering:** Exclude results with confidence interval width > 1.0

#### Photo Storage Logic

- **Storage Method:** Supabase Storage private bucket
- **URL Generation:** Short-lived signed URLs (1 hour expiry) generated on-demand
- **Database Storage:** Object path only, not full URL
- **File Naming:** UUID-based naming to prevent conflicts

### Error Handling Patterns

#### Validation Errors (400 Bad Request)

```json
{
  "error": {
    "type": "validation_error",
    "message": "Invalid input data",
    "details": [
      {
        "field": "symptoms[0].severity",
        "message": "Severity must be between 1 and 5"
      }
    ]
  }
}
```

#### Business Logic Errors (422 Unprocessable Entity)

```json
{
  "error": {
    "type": "business_logic_error",
    "message": "Insufficient data for trigger analysis",
    "details": "Minimum 10 logs required for correlation analysis"
  }
}
```

#### Authorization Errors (403 Forbidden)

```json
{
  "error": {
    "type": "authorization_error",
    "message": "Access denied to this resource"
  }
}
```
