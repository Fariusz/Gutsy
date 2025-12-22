-- ===========================================================================
-- Migration: Ingredient Normalization Search Indexes
-- Created: 2025-12-22 15:00:00 UTC
-- Purpose: Add full-text search and fuzzy matching capabilities for ingredient normalization
-- ===========================================================================

-- Enable the pg_trgm extension for trigram similarity matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create full-text search index for ingredient names (English configuration)
-- This supports text search queries like textsearch('ingredient', 'text', {type: 'websearch'})
CREATE INDEX IF NOT EXISTS ingredients_name_fts_idx 
ON ingredients USING GIN (to_tsvector('english', name));

-- Create trigram index for fuzzy string matching
-- This supports similarity queries and LIKE patterns with good performance
CREATE INDEX IF NOT EXISTS ingredients_name_trigram_idx 
ON ingredients USING GIN (name gin_trgm_ops);

-- Create case-insensitive text pattern index for ILIKE queries
-- This optimizes ILIKE '%pattern%' queries used in fallback matching
CREATE INDEX IF NOT EXISTS ingredients_name_pattern_idx 
ON ingredients (lower(name) text_pattern_ops);

-- Add a composite index for id and name lookups together
-- This optimizes queries that need both the ID and name for matching results
CREATE INDEX IF NOT EXISTS ingredients_id_name_idx 
ON ingredients (id, name);

-- ===========================================================================
-- Performance Notes:
-- - The FTS index enables fast text search with ranking and language support
-- - The trigram index allows fuzzy matching with similarity scoring
-- - The pattern index optimizes ILIKE queries for substring matching
-- - These indexes support the deterministic matching service operations
-- ===========================================================================