-- Fix: handle_new_user trigger was dropping org from signup metadata.
-- Signup form passes { name, org } in raw_user_meta_data; persist both.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, org)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'org'
  );
  return new;
end;
$$ language plpgsql security definer;
