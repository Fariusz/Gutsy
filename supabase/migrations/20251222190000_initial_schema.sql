-- Gutsy Simplified Database Schema
-- A minimal schema for logging meals and symptoms.

-- symptoms: reference data for digestive symptoms  
create table if not exists public.symptoms (
    id serial primary key,
    name text not null unique,
    created_at timestamp with time zone default now() not null
);
alter table public.symptoms enable row level security;

-- logs: user meal entries
create table if not exists public.logs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    log_date date not null,
    notes text,
    ingredient_names text[],
    created_at timestamp with time zone default now() not null
);
alter table public.logs enable row level security;

-- log_symptoms: symptom severity for each meal
create table if not exists public.log_symptoms (
    id serial primary key,
    log_id uuid not null references public.logs(id) on delete cascade,
    symptom_id integer not null references public.symptoms(id),
    severity integer not null check (severity >= 1 and severity <= 5),
    created_at timestamp with time zone default now() not null,
    unique (log_id, symptom_id)
);
alter table public.log_symptoms enable row level security;

-- basic indexes
create index if not exists idx_logs_user_date on public.logs(user_id, log_date);
create index if not exists idx_log_symptoms_symptom on public.log_symptoms(symptom_id);

-- RLS policies

-- Policy: authenticated_read_symptoms
-- Reason: Allows any authenticated user to read the list of available symptoms.
create policy "authenticated_read_symptoms" on public.symptoms for select to authenticated using (true);

-- Policy: users_own_logs
-- Reason: Ensures users can only create, read, update, and delete their own logs.
create policy "users_own_logs" on public.logs for all to authenticated using (auth.uid() = user_id);

-- Policy: users_own_log_symptoms
-- Reason: Ensures users can only manage log_symptoms linked to their own logs.
create policy "users_own_log_symptoms" on public.log_symptoms for all to authenticated
using (exists (select 1 from public.logs where logs.id = log_id and logs.user_id = auth.uid()));
