-- Test data and utilities for trigger analysis functionality
-- This file contains SQL test data and helper functions for testing the database functions

-- Test setup: Create test users and sample data
DO $$
DECLARE
    test_user_id uuid := '00000000-0000-0000-0000-000000000001';
    test_log_id_1 uuid := '10000000-0000-0000-0000-000000000001';
    test_log_id_2 uuid := '10000000-0000-0000-0000-000000000002';
    test_log_id_3 uuid := '10000000-0000-0000-0000-000000000003';
    test_log_id_4 uuid := '10000000-0000-0000-0000-000000000004';
    test_log_id_5 uuid := '10000000-0000-0000-0000-000000000005';
    
    dairy_ingredient_id int;
    tomato_ingredient_id int;
    cabbage_ingredient_id int;
    bread_ingredient_id int;
    
    bloating_symptom_id int;
    rash_symptom_id int;
    gas_symptom_id int;
    headache_symptom_id int;
BEGIN
    -- Create test ingredients
    dairy_ingredient_id := find_or_create_ingredient('Dairy');
    tomato_ingredient_id := find_or_create_ingredient('Tomatoes');
    cabbage_ingredient_id := find_or_create_ingredient('Cabbage');
    bread_ingredient_id := find_or_create_ingredient('Bread');
    
    -- Get symptom IDs
    SELECT id INTO bloating_symptom_id FROM symptoms WHERE name = 'bloating';
    SELECT id INTO rash_symptom_id FROM symptoms WHERE name = 'hives'; -- Using hives as rash equivalent
    SELECT id INTO gas_symptom_id FROM symptoms WHERE name = 'gas';
    SELECT id INTO headache_symptom_id FROM symptoms WHERE name = 'headache';
    
    -- Create test logs
    INSERT INTO logs (id, user_id, log_date, notes, ingredient_names) VALUES
    (test_log_id_1, test_user_id, '2024-01-01', 'Breakfast with milk', ARRAY['Dairy', 'Bread']),
    (test_log_id_2, test_user_id, '2024-01-02', 'Lunch with tomato salad', ARRAY['Tomatoes', 'Bread']),
    (test_log_id_3, test_user_id, '2024-01-03', 'Dinner with cabbage soup', ARRAY['Cabbage']),
    (test_log_id_4, test_user_id, '2024-01-04', 'Cheese pizza', ARRAY['Dairy', 'Bread']),
    (test_log_id_5, test_user_id, '2024-01-05', 'Tomato pasta', ARRAY['Tomatoes', 'Bread']);
    
    -- Create log-ingredient relationships
    INSERT INTO log_ingredients (log_id, ingredient_id) VALUES
    (test_log_id_1, dairy_ingredient_id),
    (test_log_id_1, bread_ingredient_id),
    (test_log_id_2, tomato_ingredient_id),
    (test_log_id_2, bread_ingredient_id),
    (test_log_id_3, cabbage_ingredient_id),
    (test_log_id_4, dairy_ingredient_id),
    (test_log_id_4, bread_ingredient_id),
    (test_log_id_5, tomato_ingredient_id),
    (test_log_id_5, bread_ingredient_id);
    
    -- Create symptom occurrences
    -- Dairy causes bloating (2/2 times = 100%)
    INSERT INTO log_symptoms (log_id, symptom_id, severity) VALUES
    (test_log_id_1, bloating_symptom_id, 4),
    (test_log_id_4, bloating_symptom_id, 3);
    
    -- Tomatoes cause rash (1/2 times = 50%)
    INSERT INTO log_symptoms (log_id, symptom_id, severity) VALUES
    (test_log_id_2, rash_symptom_id, 2);
    
    -- Cabbage causes gas (1/1 times = 100%)
    INSERT INTO log_symptoms (log_id, symptom_id, severity) VALUES
    (test_log_id_3, gas_symptom_id, 3);
    
    -- Add some background headaches (not correlated with any specific ingredient)
    INSERT INTO log_symptoms (log_id, symptom_id, severity) VALUES
    (test_log_id_1, headache_symptom_id, 2),
    (test_log_id_3, headache_symptom_id, 1);
    
    -- Verify the test data was created
    RAISE NOTICE 'Test data created successfully:';
    RAISE NOTICE '- Test user: %', test_user_id;
    RAISE NOTICE '- Dairy ingredient ID: %', dairy_ingredient_id;
    RAISE NOTICE '- Tomato ingredient ID: %', tomato_ingredient_id;
    RAISE NOTICE '- Cabbage ingredient ID: %', cabbage_ingredient_id;
    RAISE NOTICE '- Total logs: 5';
    RAISE NOTICE '- Total log_ingredients: 9';
    RAISE NOTICE '- Total log_symptoms: 6';
END $$;

-- Test function: get_top_triggers
-- Expected results: Dairy should have highest trigger score (causes bloating 100% of time)
SELECT 'Testing get_top_triggers function' as test_case;
SELECT * FROM get_top_triggers(
    '00000000-0000-0000-0000-000000000001'::uuid,
    '2024-01-01'::date,
    '2024-01-31'::date,
    10
);

-- Test function: get_ingredient_symptom_correlations
-- Expected results: Should show specific ingredient-symptom pairs with rates
SELECT 'Testing get_ingredient_symptom_correlations function' as test_case;
SELECT * FROM get_ingredient_symptom_correlations(
    '00000000-0000-0000-0000-000000000001'::uuid,
    '2024-01-01'::date,
    '2024-01-31'::date,
    20
);

-- Test normalization function
SELECT 'Testing normalize_ingredient_name function' as test_case;
SELECT 
    normalize_ingredient_name('  DAIRY  ') as normalized_dairy,
    normalize_ingredient_name('Tomatoes') as normalized_tomatoes,
    normalize_ingredient_name('') as normalized_empty,
    normalize_ingredient_name('a') as normalized_single_char;

-- Test find_or_create_ingredient function
SELECT 'Testing find_or_create_ingredient function' as test_case;
SELECT 
    find_or_create_ingredient('New Test Ingredient') as new_ingredient_id,
    find_or_create_ingredient('Dairy') as existing_ingredient_id;

-- Cleanup function for tests
CREATE OR REPLACE FUNCTION cleanup_test_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Delete test data in correct order to respect foreign key constraints
    DELETE FROM log_symptoms WHERE log_id IN (
        SELECT id FROM logs WHERE user_id = '00000000-0000-0000-0000-000000000001'
    );
    
    DELETE FROM log_ingredients WHERE log_id IN (
        SELECT id FROM logs WHERE user_id = '00000000-0000-0000-0000-000000000001'
    );
    
    DELETE FROM logs WHERE user_id = '00000000-0000-0000-0000-000000000001';
    
    -- Optionally clean up test ingredients (be careful not to delete real data)
    DELETE FROM ingredients WHERE name IN ('New Test Ingredient');
    
    RAISE NOTICE 'Test data cleaned up successfully';
END $$;