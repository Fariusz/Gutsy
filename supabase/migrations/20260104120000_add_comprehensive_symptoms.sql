-- Add comprehensive list of food intolerance symptoms
-- Expanding from basic 6 symptoms to cover digestive, skin, respiratory, and neurological categories

-- Add new digestive symptoms (avoiding duplicates of existing: bloating, gas, nausea, diarrhea)
insert into public.symptoms (name) 
select unnest(array[
    'abdominal_pain',
    'constipation',
    'reflux',
    'stomach_cramps',
    'vomiting'
]) on conflict (name) do nothing;

-- Add skin and allergy symptoms
insert into public.symptoms (name) 
select unnest(array[
    'flushing',
    'hives',
    'itching',
    'rashes',
    'swelling'
]) on conflict (name) do nothing;

-- Add respiratory symptoms  
insert into public.symptoms (name) 
select unnest(array[
    'asthma',
    'coughing',
    'runny_nose',
    'stuffy_nose',
    'wheezing'
]) on conflict (name) do nothing;

-- Add neurological and general symptoms (avoiding duplicate of existing: headache)
insert into public.symptoms (name) 
select unnest(array[
    'anxiety',
    'depression',
    'fatigue',
    'insomnia',
    'joint_pain',
    'nervousness'
]) on conflict (name) do nothing;

-- Update existing stomach_pain to abdominal_pain for consistency (optional - can be done separately if needed)
-- update public.symptoms set name = 'stomach_pain' where name = 'stomach_pain'; -- keeping as is for now