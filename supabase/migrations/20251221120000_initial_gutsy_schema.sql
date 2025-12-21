-- Gutsy MVP Database Schema
-- Simple schema for food intolerance tracking

-- ingredients: reference data for food ingredients
create table public.ingredients (
    id serial primary key,
    name text not null unique,
    created_at timestamp with time zone default now() not null
);
alter table public.ingredients enable row level security;

-- symptoms: reference data for digestive symptoms  
create table public.symptoms (
    id serial primary key,
    name text not null unique,
    created_at timestamp with time zone default now() not null
);
alter table public.symptoms enable row level security;

-- logs: user meal entries
create table public.logs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    log_date date not null,
    notes text,
    meal_photo_url text,
    created_at timestamp with time zone default now() not null
);
alter table public.logs enable row level security;

-- log_ingredients: which ingredients were in each meal
create table public.log_ingredients (
    log_id uuid not null references public.logs(id) on delete cascade,
    ingredient_id integer not null references public.ingredients(id),
    raw_text text,
    match_confidence numeric(3,2),
    created_at timestamp with time zone default now() not null,
    primary key (log_id, ingredient_id)
);
alter table public.log_ingredients enable row level security;

-- log_symptoms: symptom severity for each meal
create table public.log_symptoms (
    log_id uuid not null references public.logs(id) on delete cascade,
    symptom_id integer not null references public.symptoms(id),
    severity integer not null check (severity >= 1 and severity <= 5),
    created_at timestamp with time zone default now() not null,
    primary key (log_id, symptom_id)
);
alter table public.log_symptoms enable row level security;

-- basic indexes
create index idx_logs_user_date on public.logs(user_id, log_date);
create index idx_log_ingredients_ingredient on public.log_ingredients(ingredient_id);
create index idx_log_symptoms_symptom on public.log_symptoms(symptom_id);

-- RLS policies - authenticated users can read reference data
create policy "authenticated_read_ingredients" on public.ingredients for select to authenticated using (true);
create policy "authenticated_read_symptoms" on public.symptoms for select to authenticated using (true);

-- RLS policies - users can manage their own data
create policy "users_own_logs" on public.logs for all to authenticated using (auth.uid() = user_id);

create policy "users_own_log_ingredients" on public.log_ingredients for all to authenticated 
using (exists (select 1 from public.logs where logs.id = log_id and logs.user_id = auth.uid()));

create policy "users_own_log_symptoms" on public.log_symptoms for all to authenticated
using (exists (select 1 from public.logs where logs.id = log_id and logs.user_id = auth.uid()));

-- seed data
insert into public.ingredients (name) values 
('wheat'), ('dairy'), ('eggs'), ('nuts'), ('soy'), ('gluten'), ('lactose');

insert into public.symptoms (name) values 
('bloating'), ('gas'), ('stomach_pain'), ('nausea'), ('diarrhea'), ('headache');