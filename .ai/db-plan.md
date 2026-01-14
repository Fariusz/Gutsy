# Database Planning Summary - Gutsy MVP (Simplified)

## Final Implementation Decision

After review, we've chosen the **simplest possible approach** for the MVP:

- **Ingredients**: Stored as `text[]` array (`ingredient_names`) directly in the `logs` table
- **No ingredient normalization**: Users enter ingredient names as simple text
- **No separate ingredients table**: Keeps the database schema minimal and MVP-focused

## Decisions Made

1.  **Foreign Key Integrity**: Add a foreign key constraint from `logs.user_id` to `auth.users.id` with `ON DELETE CASCADE` for referential integrity and GDPR compliance.
2.  **Simple Ingredient Storage**: Ingredients are stored as a `text[]` array (`ingredient_names`) directly within the `logs` table for maximum simplicity.
3.  **Many-to-Many for Symptoms**: Use a `log_symptoms` join table to manage the many-to-many relationship between `logs` and `symptoms`, storing `severity` for each association.
4.  **Data Validation**: Add a `CHECK (severity >= 1 AND severity <= 5)` constraint to the `log_symptoms` table to enforce business rules at the database level.
5.  **Performance Optimization**: Implement basic indexes on `logs(user_id, log_date)` and `log_symptoms(symptom_id)` to support common query patterns.
6.  **Row-Level Security**: Enable RLS on all tables with policies scoped by `auth.uid()` to ensure users can only access their own data.
7.  **Canonical Symptom Access**: Allow `SELECT` access to the canonical `symptoms` table for all authenticated users.

## Database Schema

The database schema for Gutsy MVP establishes a privacy-first food intolerance tracking application built on Supabase. The core entities include user logs, a canonical symptoms list, and a join table to connect them.

### Key Schema Elements

- **users**: Managed by Supabase Auth (`auth.users` table).
- **logs**: User meal entries with a date, notes, and a simple array of ingredient names (`ingredient_names text[]`).
- **symptoms**: A canonical reference list of symptoms.
- **log_symptoms**: A many-to-many join table connecting `logs` and `symptoms`, which also stores the `severity` of each symptom for a given log.

### Correlation Engine Approach

The `get_top_triggers` RPC will work with ingredient name strings instead of normalized IDs:

```sql
-- Example correlation logic using text arrays
SELECT
  ingredient_name,
  COUNT(*) as consumption_count,
  AVG(ls.severity) as avg_severity_when_present
FROM (
  SELECT unnest(ingredient_names) as ingredient_name, id
  FROM logs
  WHERE user_id = $1
) l
JOIN log_symptoms ls ON l.id = ls.log_id
GROUP BY ingredient_name
HAVING COUNT(*) >= 5  -- Minimum consumption threshold
ORDER BY avg_severity_when_present DESC;
```

### Benefits of Simple Approach

- **Faster MVP development**: No complex ingredient normalization logic needed
- **Easier maintenance**: Simple text arrays are straightforward to work with
- **User-friendly**: Users can enter ingredients in natural language
- **Still effective**: Correlation analysis works with text-based grouping

### Security Architecture

Row-Level Security (RLS) is enabled across all tables. Policies on the `logs` and `log_symptoms` tables enforce data ownership by matching `auth.uid()` with the `user_id`. The canonical `symptoms` table allows read access to all authenticated users. Foreign key constraints with `CASCADE DELETE` ensure user data is cleanly removed upon account deletion.

### Performance Considerations

The schema is supported by indexes on foreign keys and frequently queried columns, such as `(user_id, log_date)`, to ensure responsive queries for fetching user logs. For ingredient correlation, case-insensitive matching with `LOWER()` can be used if needed.

### Data Integrity

Database-level constraints include a `CHECK` constraint for the `severity` range (1-5) and a `UNIQUE` constraint on `(log_id, symptom_id)` in the `log_symptoms` table to prevent duplicate entries.

## Removed Complexity

- ❌ **ingredients** table (not needed for MVP)
- ❌ **log_ingredients** junction table (not needed for MVP)
- ❌ Ingredient normalization service
- ❌ Canonical ingredient catalog
- ❌ Complex matching algorithms

## Next Steps

1. The database schema is already implemented correctly in the migration
2. TypeScript interfaces have been simplified to match
3. Repository and service layers updated for text array approach
4. Ready to implement the `get_top_triggers` RPC with text-based correlation
