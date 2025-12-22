# Ingredient Normalization API

A robust, high-performance REST API endpoint for normalizing raw ingredient text into standardized ingredient matches with confidence scoring.

## Overview

The `/api/ingredients/normalize` endpoint transforms natural language ingredient descriptions into structured data suitable for the meal logging and correlation engine. It uses a multi-stage matching pipeline with caching, analytics, and comprehensive error handling.

## Features

- **Multi-stage Matching Pipeline**: Deterministic text matching → Optional LLM fallback → Confidence filtering
- **High Performance**: Result caching, database query optimization, and concurrent request handling  
- **Comprehensive Analytics**: Performance monitoring, failure pattern analysis, and usage statistics
- **Robust Error Handling**: Detailed validation, graceful fallbacks, and informative error messages
- **Rate Limiting**: Prevents abuse while maintaining good UX for legitimate users
- **Full Test Coverage**: Unit tests, integration tests, and load testing tools

## API Specification

### Request

```http
POST /api/ingredients/normalize
Content-Type: application/json
Authorization: Bearer <session_token>

{
  "raw_text": "spicy tomato sauce with basil and oregano"
}
```

### Response (Success)

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
  "raw_text": "spicy tomato sauce with basil and oregano"
}
```

### Response (Error)

```json
{
  "error": {
    "type": "validation_error",
    "message": "Invalid input data",
    "details": [
      {
        "field": "raw_text",
        "message": "Raw text cannot exceed 100 characters"
      }
    ]
  }
}
```

## Architecture

### Processing Pipeline

1. **Text Preprocessing**: Clean and normalize input text
2. **Tokenization**: Split text into ingredient tokens, remove stop words/modifiers
3. **Deterministic Matching**: Database lookups using exact and fuzzy matching
4. **LLM Fallback** (Optional): AI-powered matching for unrecognized ingredients
5. **Confidence Filtering**: Remove matches below threshold
6. **Response Assembly**: Format and return results

### Database Integration

```sql
-- Required database indexes for performance
CREATE INDEX ingredients_name_fts_idx ON ingredients USING GIN (to_tsvector('english', name));
CREATE INDEX ingredients_name_trigram_idx ON ingredients USING GIN (name gin_trgm_ops);
CREATE INDEX ingredients_name_pattern_idx ON ingredients (lower(name) text_pattern_ops);
```

### Caching Strategy

- **LRU Cache**: 1000 entry in-memory cache with 1-hour TTL
- **Cache Keys**: Normalized from input text for consistency
- **Eviction**: Least recently used when at capacity
- **Cleanup**: Automatic expired entry removal

## Configuration

### Environment Variables

```bash
# Optional LLM Integration
ENABLE_LLM_NORMALIZATION=false
LLM_API_KEY=your_openai_api_key
LLM_API_URL=https://api.openai.com/v1/chat/completions

# Database (handled by Supabase)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

### Rate Limiting

- **Default**: 50 requests per minute per user
- **Mechanism**: In-memory rate limiter (use Redis in production)
- **Response**: HTTP 429 when exceeded

## Usage Examples

### Basic Normalization

```javascript
const response = await fetch('/api/ingredients/normalize', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionToken}`
  },
  body: JSON.stringify({
    raw_text: 'fresh organic tomatoes'
  })
});

const result = await response.json();
console.log(result.data); // Array of matched ingredients
```

### Error Handling

```javascript
try {
  const response = await fetch('/api/ingredients/normalize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`
    },
    body: JSON.stringify({
      raw_text: userInput
    })
  });

  if (!response.ok) {
    const error = await response.json();
    handleNormalizationError(error);
    return;
  }

  const result = await response.json();
  processIngredients(result.data);
} catch (error) {
  console.error('Network error:', error);
}
```

### Batch Processing

```javascript
// Process multiple ingredients efficiently
const ingredients = [
  'tomatoes and onions',
  'chicken breast',
  'olive oil and garlic'
];

const results = await Promise.all(
  ingredients.map(text => 
    fetch('/api/ingredients/normalize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({ raw_text: text })
    }).then(r => r.json())
  )
);
```

## Monitoring & Analytics

### Performance Statistics

```http
GET /api/ingredients/stats
Authorization: Bearer <session_token>
```

Returns comprehensive performance metrics:

```json
{
  "timestamp": "2025-12-22T15:30:00.000Z",
  "cache": {
    "size": 245,
    "maxSize": 1000,
    "utilization": "24.5%",
    "hitRate": "0.687",
    "avgAccessCount": "2.34"
  },
  "performance": {
    "totalRequests": 1543,
    "avgProcessingTime": 156,
    "avgConfidence": "0.891",
    "cacheHitRate": "0.687",
    "failureRate": "0.023",
    "methodDistribution": {
      "deterministic": 1401,
      "hybrid": 98,
      "llm": 44
    }
  },
  "health": {
    "status": "healthy",
    "avgResponseTime": 156,
    "errorRate": 0.023,
    "cacheEfficiency": 0.687
  }
}
```

### Cache Management

```http
POST /api/ingredients/stats
Authorization: Bearer <session_token>
Content-Type: application/json

{
  "action": "cleanup_cache"
}
```

## Testing

### Run Unit Tests

```bash
npm test
```

### Run Integration Tests

```bash
npm run test -- src/lib/services/__tests__/integration.test.ts
```

### Load Testing

```bash
# Start development server
npm run dev

# Run load tests (update auth tokens first)
npm run load-test
```

### Manual Testing

```bash
# Test basic functionality
curl -X POST http://localhost:3000/api/ingredients/normalize \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer your_token" \\
  -d '{"raw_text": "tomatoes and basil"}'

# Test validation
curl -X POST http://localhost:3000/api/ingredients/normalize \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer your_token" \\
  -d '{"raw_text": ""}'

# Test rate limiting (run multiple times quickly)
for i in {1..55}; do
  curl -X POST http://localhost:3000/api/ingredients/normalize \\
    -H "Content-Type: application/json" \\
    -H "Authorization: Bearer same_token" \\
    -d '{"raw_text": "test ingredient"}' &
done
wait
```

## Performance Characteristics

### Benchmarks (Local Development)

- **Simple ingredients** (e.g., "tomatoes"): ~50-100ms
- **Complex phrases** (e.g., "organic free-range chicken with herbs"): ~150-300ms  
- **Cache hits**: ~10-30ms
- **Rate limiting overhead**: ~5ms per request
- **Concurrent capacity**: 50+ requests/second

### Optimization Features

- **Database Indexes**: Full-text search, trigram matching, pattern matching
- **Connection Pooling**: Supabase handles connection management
- **Result Caching**: 1-hour TTL with LRU eviction  
- **Query Optimization**: Minimal database round trips
- **Lazy LLM Loading**: LLM service only created when enabled

## Production Considerations

### Scaling

- **Horizontal Scaling**: Stateless design supports multiple instances
- **Database**: Supabase handles read replicas and connection pooling
- **Caching**: Consider Redis for distributed caching
- **Rate Limiting**: Use Redis-based rate limiter for consistency

### Monitoring

- **Health Checks**: Use `/api/ingredients/stats` endpoint
- **Alerting**: Monitor failure rates, response times, and cache efficiency
- **Logging**: Structured logging for debugging and analysis

### Security

- **Authentication**: Session-based auth via Supabase
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: Prevents abuse and DoS attacks
- **Error Handling**: No sensitive information leaked in errors

## Development

### Adding New Matching Methods

1. Implement matching interface in service
2. Update method enum in types
3. Add analytics tracking
4. Include in confidence filtering
5. Add tests for new method

### Extending Analytics

1. Add new event fields to `NormalizationEvent`
2. Update analytics service methods
3. Extend stats endpoint response
4. Update monitoring dashboards

### Performance Tuning

1. Monitor `/api/ingredients/stats` for bottlenecks
2. Adjust cache size and TTL based on usage patterns
3. Optimize database queries using `EXPLAIN ANALYZE`
4. Consider background cache warming for common ingredients

## Troubleshooting

### Common Issues

**High response times**
- Check database connection pool usage
- Verify index usage with `EXPLAIN ANALYZE`
- Monitor cache hit rates
- Consider increasing cache size

**High error rates**  
- Check input validation patterns
- Verify ingredient database completeness
- Monitor LLM service availability
- Review authentication token handling

**Cache inefficiency**
- Analyze cache eviction patterns
- Adjust cache size or TTL
- Check for cache key normalization issues
- Monitor cache cleanup frequency

### Debugging

Enable debug logging:
```javascript
// In normalization service
if (import.meta.env.DEV) {
  console.log('Normalization debug:', {
    rawText,
    tokens,
    matches: allMatches.length,
    processingTime: Date.now() - startTime
  });
}
```

## API Versioning

Current version: `v1` (implicit)

Future versions will be explicitly versioned:
- `/api/v2/ingredients/normalize`
- Backward compatibility maintained for 6 months
- Breaking changes communicated in advance