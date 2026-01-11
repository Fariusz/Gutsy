-- Test data migration for trigger analysis testing
-- This adds realistic test data including ingredients, symptoms, logs, and relationships

-- Insert test ingredients with proper normalized_name values
INSERT INTO ingredients (name, normalized_name) VALUES
('Tomatoes', 'tomatoes'),
('Dairy', 'dairy'),
('Gluten', 'gluten'),
('Eggs', 'eggs'),
('Nuts', 'nuts'),
('Soy', 'soy'),
('Shellfish', 'shellfish'),
('Chocolate', 'chocolate'),
('Caffeine', 'caffeine'),
('Onions', 'onions'),
('Garlic', 'garlic'),
('Spicy Food', 'spicy-food')
ON CONFLICT (name) DO NOTHING;

-- Insert test symptoms  
INSERT INTO symptoms (name) VALUES
('Stomach Pain'),
('Bloating'),
('Nausea'),
('Headache'),
('Rash'),
('Fatigue'),
('Diarrhea'),
('Heartburn'),
('Joint Pain'),
('Brain Fog')
ON CONFLICT (name) DO NOTHING;

-- Create a function to populate test data for a specific user
CREATE OR REPLACE FUNCTION create_test_data_for_user(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    log_record RECORD;
    ingredient_id_tomatoes INT;
    ingredient_id_dairy INT;
    ingredient_id_gluten INT;
    ingredient_id_eggs INT;
    ingredient_id_nuts INT;
    ingredient_id_chocolate INT;
    ingredient_id_spicy INT;
    ingredient_id_soy INT;
    symptom_id_stomach INT;
    symptom_id_bloating INT;
    symptom_id_headache INT;
    symptom_id_rash INT;
    symptom_id_nausea INT;
    symptom_id_fatigue INT;
BEGIN
    -- Get ingredient IDs
    SELECT id INTO ingredient_id_tomatoes FROM ingredients WHERE name = 'Tomatoes';
    SELECT id INTO ingredient_id_dairy FROM ingredients WHERE name = 'Dairy';
    SELECT id INTO ingredient_id_gluten FROM ingredients WHERE name = 'Gluten';
    SELECT id INTO ingredient_id_eggs FROM ingredients WHERE name = 'Eggs';
    SELECT id INTO ingredient_id_nuts FROM ingredients WHERE name = 'Nuts';
    SELECT id INTO ingredient_id_chocolate FROM ingredients WHERE name = 'Chocolate';
    SELECT id INTO ingredient_id_spicy FROM ingredients WHERE name = 'Spicy Food';
    SELECT id INTO ingredient_id_soy FROM ingredients WHERE name = 'Soy';
    
    -- Get symptom IDs
    SELECT id INTO symptom_id_stomach FROM symptoms WHERE name = 'Stomach Pain';
    SELECT id INTO symptom_id_bloating FROM symptoms WHERE name = 'Bloating';
    SELECT id INTO symptom_id_headache FROM symptoms WHERE name = 'Headache';
    SELECT id INTO symptom_id_rash FROM symptoms WHERE name = 'Rash';
    SELECT id INTO symptom_id_nausea FROM symptoms WHERE name = 'Nausea';
    SELECT id INTO symptom_id_fatigue FROM symptoms WHERE name = 'Fatigue';

    -- Delete existing test logs for this user to avoid conflicts
    DELETE FROM logs WHERE user_id = target_user_id AND notes LIKE '%test%' OR notes IN (
        'Pizza lunch', 'Scrambled eggs breakfast', 'Pasta with tomato sauce', 
        'Coffee and nuts', 'Salad with tomatoes', 'Ice cream (dairy)',
        'Bread and eggs', 'Spicy curry with tomatoes', 'Chocolate bar', 'Soy milk and cereal'
    );

    -- Insert test logs for the user
    INSERT INTO logs (id, user_id, log_date, notes, created_at) VALUES
    (gen_random_uuid(), target_user_id, '2026-01-02', 'Pizza lunch', '2026-01-02 12:00:00+00'),
    (gen_random_uuid(), target_user_id, '2026-01-03', 'Scrambled eggs breakfast', '2026-01-03 08:00:00+00'),
    (gen_random_uuid(), target_user_id, '2026-01-04', 'Pasta with tomato sauce', '2026-01-04 19:00:00+00'),
    (gen_random_uuid(), target_user_id, '2026-01-05', 'Coffee and nuts', '2026-01-05 10:00:00+00'),
    (gen_random_uuid(), target_user_id, '2026-01-06', 'Salad with tomatoes', '2026-01-06 13:00:00+00'),
    (gen_random_uuid(), target_user_id, '2026-01-07', 'Ice cream (dairy)', '2026-01-07 20:00:00+00'),
    (gen_random_uuid(), target_user_id, '2026-01-08', 'Bread and eggs', '2026-01-08 09:00:00+00'),
    (gen_random_uuid(), target_user_id, '2026-01-09', 'Spicy curry with tomatoes', '2026-01-09 18:00:00+00'),
    (gen_random_uuid(), target_user_id, '2026-01-10', 'Chocolate bar', '2026-01-10 15:00:00+00'),
    (gen_random_uuid(), target_user_id, '2026-01-11', 'Soy milk and cereal', '2026-01-11 08:00:00+00');

    -- Now populate ingredients and symptoms for each log
    FOR log_record IN 
        SELECT id, log_date, notes 
        FROM logs 
        WHERE user_id = target_user_id 
        AND log_date >= '2026-01-02' 
        AND log_date <= '2026-01-11'
        ORDER BY log_date
    LOOP
        -- Add ingredients based on meal description
        CASE
            WHEN log_record.notes = 'Pizza lunch' THEN
                INSERT INTO log_ingredients (log_id, ingredient_id) VALUES
                (log_record.id, ingredient_id_tomatoes),
                (log_record.id, ingredient_id_dairy),
                (log_record.id, ingredient_id_gluten);
                -- Symptoms: moderate stomach pain
                INSERT INTO log_symptoms (log_id, symptom_id, severity) VALUES
                (log_record.id, symptom_id_stomach, 3),
                (log_record.id, symptom_id_bloating, 2);
                
            WHEN log_record.notes = 'Scrambled eggs breakfast' THEN
                INSERT INTO log_ingredients (log_id, ingredient_id) VALUES
                (log_record.id, ingredient_id_eggs),
                (log_record.id, ingredient_id_dairy);
                -- No symptoms
                
            WHEN log_record.notes = 'Pasta with tomato sauce' THEN
                INSERT INTO log_ingredients (log_id, ingredient_id) VALUES
                (log_record.id, ingredient_id_tomatoes),
                (log_record.id, ingredient_id_gluten);
                -- Symptoms: severe stomach pain (tomatoes trigger pattern)
                INSERT INTO log_symptoms (log_id, symptom_id, severity) VALUES
                (log_record.id, symptom_id_stomach, 4),
                (log_record.id, symptom_id_nausea, 3);
                
            WHEN log_record.notes = 'Coffee and nuts' THEN
                INSERT INTO log_ingredients (log_id, ingredient_id) VALUES
                (log_record.id, ingredient_id_nuts);
                -- No symptoms
                
            WHEN log_record.notes = 'Salad with tomatoes' THEN
                INSERT INTO log_ingredients (log_id, ingredient_id) VALUES
                (log_record.id, ingredient_id_tomatoes);
                -- Symptoms: mild stomach pain (confirming tomatoes trigger)
                INSERT INTO log_symptoms (log_id, symptom_id, severity) VALUES
                (log_record.id, symptom_id_stomach, 2),
                (log_record.id, symptom_id_headache, 2);
                
            WHEN log_record.notes = 'Ice cream (dairy)' THEN
                INSERT INTO log_ingredients (log_id, ingredient_id) VALUES
                (log_record.id, ingredient_id_dairy);
                -- Symptoms: mild bloating
                INSERT INTO log_symptoms (log_id, symptom_id, severity) VALUES
                (log_record.id, symptom_id_bloating, 2);
                
            WHEN log_record.notes = 'Bread and eggs' THEN
                INSERT INTO log_ingredients (log_id, ingredient_id) VALUES
                (log_record.id, ingredient_id_gluten),
                (log_record.id, ingredient_id_eggs);
                -- No symptoms
                
            WHEN log_record.notes = 'Spicy curry with tomatoes' THEN
                INSERT INTO log_ingredients (log_id, ingredient_id) VALUES
                (log_record.id, ingredient_id_tomatoes),
                (log_record.id, ingredient_id_spicy);
                -- Symptoms: severe symptoms (both ingredients)
                INSERT INTO log_symptoms (log_id, symptom_id, severity) VALUES
                (log_record.id, symptom_id_stomach, 5),
                (log_record.id, symptom_id_nausea, 4),
                (log_record.id, symptom_id_headache, 3);
                
            WHEN log_record.notes = 'Chocolate bar' THEN
                INSERT INTO log_ingredients (log_id, ingredient_id) VALUES
                (log_record.id, ingredient_id_chocolate);
                -- Symptoms: mild headache
                INSERT INTO log_symptoms (log_id, symptom_id, severity) VALUES
                (log_record.id, symptom_id_headache, 2);
                
            WHEN log_record.notes = 'Soy milk and cereal' THEN
                INSERT INTO log_ingredients (log_id, ingredient_id) VALUES
                (log_record.id, ingredient_id_soy),
                (log_record.id, ingredient_id_gluten);
                -- No symptoms
                
            ELSE
                -- Default case, no ingredients added
                NULL;
        END CASE;
    END LOOP;
    
    RAISE NOTICE 'Test data created for user %', target_user_id;
END;
$$;