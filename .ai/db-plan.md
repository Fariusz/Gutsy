# Database Planning Summary - Gutsy MVP

## Decisions Made

1. Add foreign key constraint from `logs.user_id` to `auth.users.id` with ON DELETE CASCADE for referential integrity and GDPR compliance
2. Create separate `proposed_ingredients` table for user-submitted ingredients pending admin review, keeping canonical `ingredients` table clean
3. Make `raw_text` and `match_confidence` fields in `log_ingredients` nullable, populated only for fuzzy matches from LLM fallback
4. Add CHECK constraint on `log_symptoms.severity` column to enforce 1-5 range at database level
5. Implement comprehensive indexing strategy with composite indexes on frequently queried columns
6. Enable RLS on all user data tables with policies scoped by `auth.uid()`
7. Allow SELECT access to canonical tables (`ingredients`, `symptoms`) for all authenticated users, restrict modifications to admin role
8. Store only object paths in `meal_photo_url`, generate signed URLs on-demand for security
9. Use composite primary key `(log_id, ingredient_id)` for `log_ingredients` table to ensure uniqueness
10. Start with in-RPC calculations for MVP, plan materialized views for future performance optimization

## Matched Recommendations

1. **Foreign Key Integrity**: Add `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` to logs table for data consistency and GDPR compliance
2. **User Content Separation**: Create `proposed_ingredients` table with fields `id`, `name`, `user_id`, `status` ('pending', 'approved', 'rejected'), `created_at` for admin review workflow
3. **Flexible Data Fields**: Make `raw_text` and `match_confidence` nullable in `log_ingredients`, populated only when ingredients are derived from text input via normalizeIngredients function
4. **Data Validation**: Add `CHECK (severity >= 1 AND severity <= 5)` constraint to enforce business rules at database level
5. **Performance Optimization**: Implement composite indexes on `(user_id, log_date)` for logs, `(log_id, ingredient_id)` for log_ingredients, and `(log_id, symptom_id)` for log_symptoms
6. **Row-Level Security**: Enable RLS with `auth.uid() = user_id` for logs table and existence checks for join tables referencing log ownership
7. **Canonical Data Access**: Allow `SELECT` for `auth.role() = 'authenticated'` on ingredients/symptoms, restrict modifications to admin role
8. **Secure File Storage**: Store object paths only, generate short-lived signed URLs in backend to avoid exposing long-lived URLs
9. **Data Uniqueness**: Use composite primary key to naturally enforce one ingredient per log constraint
10. **Scalability Planning**: Consider materialized view `user_ingredient_counts` for future performance as data grows

## Database Planning Summary

The database schema planning for Gutsy MVP focuses on a privacy-first food intolerance tracking application built on Supabase. The core entities include user logs with optional photos, canonical ingredients and symptoms lists, and join tables for tracking ingredient consumption and symptom severity.

### Key Schema Elements

- **users**: Managed by Supabase Auth (`auth.users` table) - no custom user table needed
- **logs**: User meal entries with date, notes, and photo URL (object path only)
- **ingredients/symptoms**: Canonical reference data with admin-controlled modifications
- **log_ingredients/log_symptoms**: Many-to-many relationships tracking consumption and severity
- **proposed_ingredients**: Separate table for user submissions pending admin review

### Security Architecture

Row-Level Security (RLS) is enabled across all tables with policies scoped by `auth.uid()`. User data tables (logs and join tables) enforce ownership through user_id matching, while canonical tables allow read access to authenticated users but restrict modifications to admin roles. Foreign key constraints with CASCADE DELETE ensure GDPR compliance for user data removal.

### Performance Considerations

The correlation engine (`get_top_triggers` RPC) is supported by composite indexes on frequently queried columns. The initial MVP will perform calculations within the RPC, with materialized views planned for future scalability. Photo storage uses object paths with on-demand signed URL generation for security.

### Data Integrity

Database-level constraints include CHECK constraints for severity ranges (1-5), composite primary keys for natural uniqueness enforcement, and nullable fields for optional fuzzy matching metadata from the `normalizeIngredients` function.

## Unresolved Issues

1. **Admin Role Implementation**: While admin role restrictions are planned for canonical data modification, the specific implementation of admin roles in Supabase needs to be defined
2. **Materialized View Refresh Strategy**: Future performance optimization requires determining refresh frequency and triggers for the proposed `user_ingredient_counts` materialized view
3. **Photo Storage Bucket Configuration**: Specific Supabase storage bucket policies, file size limits, and retention policies need to be established
4. **RPC Performance Thresholds**: The exact implementation of confidence interval calculations and thresholds in the `get_top_triggers` RPC requires detailed specification
5. **Migration Strategy**: Approach for migrating user-proposed ingredients from the pending table to the canonical ingredients table needs definition
