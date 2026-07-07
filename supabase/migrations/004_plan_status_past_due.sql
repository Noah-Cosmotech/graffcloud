-- Allow a distinct 'past_due' entitlement state so failed-payment (dunning)
-- subscriptions are recorded as not-entitled rather than as an active trial.
-- Idempotent — safe to run on an existing database.
alter table public.users drop constraint if exists users_plan_status_check;
alter table public.users add constraint users_plan_status_check
  check (plan_status in ('active', 'trial', 'cancelled', 'past_due'));
