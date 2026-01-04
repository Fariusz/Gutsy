-- Add comprehensive list of food intolerance symptoms
-- Expanding from basic 6 symptoms to cover digestive, skin, respiratory, and neurological categories

-- Add new digestive symptoms (avoiding duplicates of existing: bloating, gas, nausea, diarrhea)
insert into public.symptoms (name) values 
('abdominal_pain'),
('constipation'),
('reflux'),
('stomach_cramps'),
('vomiting');

-- Add skin and allergy symptoms
insert into public.symptoms (name) values 
('flushing'),
('hives'),
('itching'),
('rashes'),
('swelling');

-- Add respiratory symptoms  
insert into public.symptoms (name) values 
('asthma'),
('coughing'),
('runny_nose'),
('stuffy_nose'),
('wheezing');

-- Add neurological and general symptoms (avoiding duplicate of existing: headache)
insert into public.symptoms (name) values 
('anxiety'),
('depression'),
('fatigue'),
('insomnia'),
('joint_pain'),
('nervousness');

-- Update existing stomach_pain to abdominal_pain for consistency (optional - can be done separately if needed)
-- update public.symptoms set name = 'stomach_pain' where name = 'stomach_pain'; -- keeping as is for now