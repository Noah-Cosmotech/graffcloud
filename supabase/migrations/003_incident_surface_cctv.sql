-- Persist surface type and CCTV-availability flag collected on the upload form.
-- Additive and idempotent — safe to run on an existing database.
alter table public.incidents add column if not exists surface text;
alter table public.incidents add column if not exists cctv boolean not null default false;
