-- get_top_triggers RPC function for statistical trigger analysis
-- Created: 2025-12-22
-- Purpose: Calculate correlation between ingredients and symptoms for trigger identification

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
  baseline_severity DECIMAL;
BEGIN
  -- Verify user has sufficient logs for meaningful analysis
  SELECT COUNT(*) INTO total_user_logs
  FROM logs 
  WHERE user_id = p_user_id 
    AND log_date BETWEEN p_start_date AND p_end_date;
  
  IF total_user_logs < min_logs_threshold THEN
    RAISE EXCEPTION 'Insufficient data: minimum % logs required, found %', 
      min_logs_threshold, total_user_logs;
  END IF;

  -- Calculate overall baseline severity (average across all logs)
  SELECT COALESCE(AVG(ls.severity), 0) INTO baseline_severity
  FROM logs l
  LEFT JOIN log_symptoms ls ON l.id = ls.log_id
  WHERE l.user_id = p_user_id 
    AND l.log_date BETWEEN p_start_date AND p_end_date;

  RETURN QUERY
  WITH ingredient_consumption AS (
    -- Get logs where each ingredient was consumed
    SELECT DISTINCT
      li.ingredient_id,
      i.name as ingredient_name,
      l.id as log_id,
      l.log_date
    FROM logs l
    JOIN log_ingredients li ON l.id = li.log_id
    JOIN ingredients i ON li.ingredient_id = i.id
    WHERE l.user_id = p_user_id 
      AND l.log_date BETWEEN p_start_date AND p_end_date
  ),
  
  ingredient_severity_stats AS (
    -- Calculate severity stats when ingredient is present
    SELECT 
      ic.ingredient_id,
      ic.ingredient_name,
      COUNT(DISTINCT ic.log_id) as consumption_count,
      COALESCE(AVG(ls.severity), 0) as avg_severity_when_present,
      baseline_severity,
      -- Simple trigger score: ratio of severity when present vs baseline
      CASE 
        WHEN baseline_severity > 0 THEN COALESCE(AVG(ls.severity), 0) / baseline_severity
        ELSE COALESCE(AVG(ls.severity), 0)
      END as trigger_score,
      -- Calculate standard error for confidence intervals
      CASE 
        WHEN COUNT(DISTINCT ic.log_id) > 1 THEN 
          STDDEV(ls.severity) / SQRT(COUNT(DISTINCT ic.log_id))
        ELSE 1.0
      END as std_error
    FROM ingredient_consumption ic
    LEFT JOIN log_symptoms ls ON ic.log_id = ls.log_id
    GROUP BY ic.ingredient_id, ic.ingredient_name, baseline_severity
    HAVING COUNT(DISTINCT ic.log_id) >= min_consumption_threshold
  ),
  
  trigger_analysis AS (
    -- Add confidence intervals using normal approximation
    SELECT 
      iss.ingredient_id,
      iss.ingredient_name,
      iss.consumption_count,
      ROUND(iss.avg_severity_when_present::numeric, 2) as avg_severity_when_present,
      ROUND(iss.baseline_severity::numeric, 2) as baseline_avg_severity,
      ROUND(iss.trigger_score::numeric, 2) as trigger_score,
      -- 95% confidence interval (±1.96 * standard_error)
      ROUND((iss.trigger_score - 1.96 * iss.std_error)::numeric, 2) as confidence_lower,
      ROUND((iss.trigger_score + 1.96 * iss.std_error)::numeric, 2) as confidence_upper,
      ROUND((2 * 1.96 * iss.std_error)::numeric, 2) as confidence_width
    FROM ingredient_severity_stats iss
    WHERE iss.trigger_score > 1.0  -- Only show ingredients that increase severity
  )
  
  SELECT 
    ta.ingredient_id,
    ta.ingredient_name,
    ta.consumption_count,
    ta.avg_severity_when_present,
    ta.baseline_avg_severity,
    ta.trigger_score,
    ta.confidence_lower,
    ta.confidence_upper,
    ta.confidence_width
  FROM trigger_analysis ta
  WHERE ta.confidence_width <= 1.0  -- Filter out results with wide confidence intervals
  ORDER BY ta.trigger_score DESC
  LIMIT p_limit;
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION get_top_triggers TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_top_triggers IS 'Calculates ingredient trigger scores based on correlation with symptom severity. Returns ingredients ranked by their association with increased symptoms.';
