-- supabase/migrations/20251222170000_trigger_analysis_indexes.sql

-- Index to speed up trigger analysis queries by user_id and log_date
CREATE INDEX IF NOT EXISTS idx_logs_user_id_log_date ON logs (user_id, log_date DESC);

-- Index on ingredients table for faster lookups by name
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients (name);

-- Index on log_ingredients for joining with logs and ingredients
CREATE INDEX IF NOT EXISTS idx_log_ingredients_log_id ON log_ingredients (log_id);
CREATE INDEX IF NOT EXISTS idx_log_ingredients_ingredient_id ON log_ingredients (ingredient_id);

