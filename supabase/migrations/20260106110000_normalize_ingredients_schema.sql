-- supabase/migrations/20260106110000_normalize_ingredients_schema.sql

-- This migration normalizes the ingredient storage to enable sophisticated correlation analysis
-- It creates proper tables for ingredients and their relationships to logs

-- Create ingredients table for normalized ingredient storage
create table public.ingredients (
    id serial primary key,
    name text not null unique,
    normalized_name text not null, -- lowercase, trimmed version for matching
    created_at timestamp with time zone default now() not null
);
alter table public.ingredients enable row level security;

-- Create junction table for log-ingredient relationships
create table public.log_ingredients (
    id serial primary key,
    log_id uuid not null references public.logs(id) on delete cascade,
    ingredient_id integer not null references public.ingredients(id) on delete cascade,
    created_at timestamp with time zone default now() not null,
    unique (log_id, ingredient_id) -- Prevent duplicate ingredient entries per log
);
alter table public.log_ingredients enable row level security;

-- Add indexes for performance
create index idx_ingredients_normalized_name on public.ingredients(normalized_name);
create index idx_log_ingredients_log_id on public.log_ingredients(log_id);
create index idx_log_ingredients_ingredient_id on public.log_ingredients(ingredient_id);

-- RLS policies for ingredients (read-only for all authenticated users)
create policy "authenticated_read_ingredients" on public.ingredients 
for select to authenticated using (true);

create policy "authenticated_insert_ingredients" on public.ingredients 
for insert to authenticated with check (true);

-- RLS policies for log_ingredients (users own their log ingredient relationships)
create policy "users_own_log_ingredients" on public.log_ingredients 
for all to authenticated
using (exists (
    select 1 from public.logs 
    where logs.id = log_id and logs.user_id = auth.uid()
));

-- Function to normalize ingredient names
create or replace function normalize_ingredient_name(ingredient_name text)
returns text
language sql
immutable
as $$
    select lower(trim(ingredient_name));
$$;

-- Function to find or create an ingredient
create or replace function find_or_create_ingredient(ingredient_name text)
returns integer
language plpgsql
as $$
declare
    ingredient_id integer;
    normalized_name text;
begin
    -- Normalize the ingredient name
    normalized_name := normalize_ingredient_name(ingredient_name);
    
    -- Skip empty or very short names
    if normalized_name is null or length(normalized_name) < 2 then
        return null;
    end if;
    
    -- Try to find existing ingredient
    select id into ingredient_id
    from public.ingredients
    where ingredients.normalized_name = normalized_name;
    
    -- If not found, create it
    if ingredient_id is null then
        insert into public.ingredients (name, normalized_name)
        values (ingredient_name, normalized_name)
        returning id into ingredient_id;
    end if;
    
    return ingredient_id;
end;
$$;

-- Migrate existing data from ingredient_names arrays to normalized tables
do $$
declare
    log_record record;
    ingredient_name text;
    ingredient_id integer;
begin
    -- Loop through all logs with ingredient_names
    for log_record in 
        select id, ingredient_names 
        from public.logs 
        where ingredient_names is not null and array_length(ingredient_names, 1) > 0
    loop
        -- Loop through each ingredient in the array
        foreach ingredient_name in array log_record.ingredient_names
        loop
            -- Find or create the ingredient
            ingredient_id := find_or_create_ingredient(ingredient_name);
            
            -- Create the log-ingredient relationship if ingredient was created successfully
            if ingredient_id is not null then
                insert into public.log_ingredients (log_id, ingredient_id)
                values (log_record.id, ingredient_id)
                on conflict (log_id, ingredient_id) do nothing; -- Skip duplicates
            end if;
        end loop;
    end loop;
end;
$$;

-- Remove the old ingredient_names column (commented out for safety)
-- alter table public.logs drop column ingredient_names;
-- Uncomment the above line after verifying the migration worked correctly