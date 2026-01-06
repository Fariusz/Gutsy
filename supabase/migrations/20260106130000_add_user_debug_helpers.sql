-- Debug helper function to check if user exists in auth.users
-- This helps diagnose foreign key constraint issues

create or replace function get_user_exists(user_id uuid)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from auth.users 
    where id = user_id
  );
$$;

-- Grant execute permissions
grant execute on function get_user_exists(uuid) to authenticated;