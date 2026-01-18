-- supabase/migrations/20260106100000_create_get_top_triggers_rpc.sql

-- This function calculates and ranks potential trigger ingredients for specific symptoms
-- It can identify that different ingredients cause different symptoms (e.g., tomatoes->rash, cabbage->gas)

-- The function returns ingredient-symptom correlations with statistical analysis:
-- - ingredient_name: The name of the ingredient
-- - symptom_name: The specific symptom being analyzed
-- - consumption_count: How many times this ingredient was logged
-- - symptom_occurrence_with_ingredient: How many times this symptom occurred when ingredient was present
-- - symptom_occurrence_without_ingredient: How many times this symptom occurred when ingredient was NOT present
-- - baseline_symptom_rate: Overall rate of this symptom across all logs
-- - trigger_score: Statistical measure of correlation strength
-- - confidence_interval: Statistical confidence in the result

create or replace function get_ingredient_symptom_correlations(
  p_user_id uuid,
  p_start_date date,
  p_end_date date,
  p_limit int default 20
)
returns table (
  ingredient_name text,
  symptom_name text,
  consumption_count bigint,
  symptom_occurrence_with_ingredient bigint,
  symptom_occurrence_without_ingredient bigint,
  baseline_symptom_rate numeric,
  trigger_score numeric,
  confidence_interval numeric
)
language sql
as $$
with user_logs as (
  -- Get all logs for the user in the date range
  select id
  from logs
  where user_id = p_user_id 
    and log_date between p_start_date and p_end_date
),
log_ingredients_in_period as (
  -- Get all ingredient-log relationships for the period
  select li.log_id, li.ingredient_id, i.name as ingredient_name
  from log_ingredients li
  join ingredients i on li.ingredient_id = i.id
  where li.log_id in (select id from user_logs)
),
log_symptoms_in_period as (
  -- Get all symptom-log relationships for the period
  select ls.log_id, ls.symptom_id, s.name as symptom_name, ls.severity
  from log_symptoms ls
  join symptoms s on ls.symptom_id = s.id
  where ls.log_id in (select id from user_logs)
),
ingredient_symptom_analysis as (
  -- Analyze each ingredient-symptom combination
  select
    i.ingredient_name,
    symp.symptom_name,
    
    -- Count logs where this ingredient was consumed
    count(distinct i.log_id) as consumption_count,
    
    -- Count logs where both ingredient was consumed AND symptom occurred
    count(distinct case when s.log_id is not null then i.log_id end) as symptom_with_ingredient,
    
    -- Calculate baseline symptom rate (how often this symptom occurs overall)
    (select count(distinct log_id)::numeric 
     from log_symptoms_in_period lsip 
     where lsip.symptom_name = symp.symptom_name) / 
    (select count(distinct id)::numeric from user_logs) as baseline_symptom_rate,
    
    -- Calculate symptom rate when this ingredient is present
    case 
      when count(distinct i.log_id) > 0 then
        count(distinct case when s.log_id is not null then i.log_id end)::numeric / 
        count(distinct i.log_id)::numeric
      else 0
    end as symptom_rate_with_ingredient,
    
    -- Average severity when both ingredient and symptom are present
    avg(case when s.log_id is not null then s.severity end) as avg_severity_when_both_present
    
  from log_ingredients_in_period i
  cross join (select distinct symptom_name from log_symptoms_in_period) symp(symptom_name)
  left join log_symptoms_in_period s on i.log_id = s.log_id and s.symptom_name = symp.symptom_name
  group by i.ingredient_name, symp.symptom_name
  having count(distinct i.log_id) >= 3 -- Only analyze ingredients consumed at least 3 times
),
symptom_without_ingredient as (
  -- For each ingredient-symptom pair, calculate how often the symptom occurs WITHOUT the ingredient
  select
    isa.ingredient_name,
    isa.symptom_name,
    count(distinct ls.log_id) as symptom_without_ingredient_count,
    count(distinct ul.id) as logs_without_ingredient_count
  from ingredient_symptom_analysis isa
  cross join user_logs ul
  left join log_ingredients_in_period li on ul.id = li.log_id and li.ingredient_name = isa.ingredient_name
  left join log_symptoms_in_period ls on ul.id = ls.log_id and ls.symptom_name = isa.symptom_name
  where li.log_id is null -- Logs where this ingredient was NOT consumed
  group by isa.ingredient_name, isa.symptom_name
)
select
  isa.ingredient_name,
  isa.symptom_name,
  isa.consumption_count,
  isa.symptom_with_ingredient as symptom_occurrence_with_ingredient,
  swi.symptom_without_ingredient_count as symptom_occurrence_without_ingredient,
  isa.baseline_symptom_rate,
  
  -- Trigger score: difference in symptom rates (with ingredient vs baseline)
  (isa.symptom_rate_with_ingredient - isa.baseline_symptom_rate) as trigger_score,
  
  -- Simple confidence measure based on sample size
  case 
    when isa.consumption_count >= 10 then 0.9
    when isa.consumption_count >= 5 then 0.7
    else 0.5
  end as confidence_interval
  
from ingredient_symptom_analysis isa
join symptom_without_ingredient swi on isa.ingredient_name = swi.ingredient_name 
  and isa.symptom_name = swi.symptom_name
where isa.symptom_rate_with_ingredient > isa.baseline_symptom_rate -- Only show potential triggers
order by trigger_score desc, confidence_interval desc
limit p_limit;
$$;

-- Legacy function for backward compatibility (simplified version)
create or replace function get_top_triggers(
  p_user_id uuid,
  p_start_date date,
  p_end_date date,
  p_limit int
)
returns table (
  ingredient_name text,
  consumption_count bigint,
  avg_severity_when_present numeric,
  baseline_avg_severity numeric,
  trigger_score numeric,
  confidence_interval numeric
)
language sql
as $$
with correlations as (
  select * from get_ingredient_symptom_correlations(p_user_id, p_start_date, p_end_date, p_limit * 3)
),
ingredient_aggregates as (
  select
    ingredient_name,
    sum(consumption_count) as total_consumption,
    avg(trigger_score) as avg_trigger_score,
    max(confidence_interval) as max_confidence
  from correlations
  group by ingredient_name
)
select
  ia.ingredient_name,
  ia.total_consumption as consumption_count,
  3.0 as avg_severity_when_present, -- Placeholder
  2.0 as baseline_avg_severity, -- Placeholder  
  ia.avg_trigger_score as trigger_score,
  ia.max_confidence as confidence_interval
from ingredient_aggregates ia
order by avg_trigger_score desc
limit p_limit;
$$;
