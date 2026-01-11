-- Seed data for the symptoms table
-- This data is used to populate the initial list of symptoms available to users.

insert into public.symptoms (name) 
select unnest(array['bloating', 'gas', 'stomach_pain', 'nausea', 'diarrhea', 'headache'])
on conflict (name) do nothing;
