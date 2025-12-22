-- Migration: Add indexes for efficient logs querying
-- Created: 2024-12-22
-- Purpose: Optimize GET /api/logs endpoint performance with proper indexing

-- Composite index for efficient log querying by user and date
-- This supports ORDER BY log_date DESC, created_at DESC with user filtering
CREATE INDEX IF NOT EXISTS logs_user_date_created_idx 
ON logs (user_id, log_date DESC, created_at DESC);

-- Index for date range queries without user filtering (for admin/analytics)
CREATE INDEX IF NOT EXISTS logs_date_range_idx 
ON logs (log_date) 
WHERE log_date IS NOT NULL;

-- Composite index for log_ingredients foreign key optimization
CREATE INDEX IF NOT EXISTS log_ingredients_log_ingredient_idx 
ON log_ingredients (log_id, ingredient_id);

-- Composite index for log_symptoms foreign key optimization  
CREATE INDEX IF NOT EXISTS log_symptoms_log_symptom_idx 
ON log_symptoms (log_id, symptom_id);

-- Index for ingredient name lookups (used in joins)
CREATE INDEX IF NOT EXISTS ingredients_name_idx 
ON ingredients (name);

-- Index for symptom name lookups (used in joins)
CREATE INDEX IF NOT EXISTS symptoms_name_idx 
ON symptoms (name);

-- Covering index for logs with commonly accessed columns
-- This can serve queries without accessing the main table
CREATE INDEX IF NOT EXISTS logs_user_covering_idx 
ON logs (user_id, log_date DESC) 
INCLUDE (id, created_at, notes, meal_photo_url);