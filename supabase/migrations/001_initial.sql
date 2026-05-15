-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text,
  org text,
  plan text check (plan in ('starter', 'pro', 'enterprise')),
  plan_status text check (plan_status in ('active', 'trial', 'cancelled')) default 'trial',
  stripe_customer_id text,
  created_at timestamptz default now()
);
alter table public.users enable row level security;
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Properties table
create table public.properties (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.users(id) on delete cascade,
  name text not null,
  address text not null,
  city text not null,
  type text check (type in ('residential', 'commercial', 'transit', 'government')) default 'commercial',
  readiness_score int default 50 check (readiness_score between 0 and 100),
  created_at timestamptz default now()
);
alter table public.properties enable row level security;
create policy "Owners can manage their properties" on public.properties for all using (auth.uid() = owner_id);

-- Signatures table
create table public.signatures (
  id uuid default uuid_generate_v4() primary key,
  code text not null unique,
  cluster_size int default 1,
  first_seen date,
  last_seen date,
  city_trail text[] default '{}',
  confidence numeric(5,2) default 0,
  created_at timestamptz default now()
);
alter table public.signatures enable row level security;
create policy "Anyone can view signatures" on public.signatures for select using (true);

-- Incidents table
create table public.incidents (
  id uuid default uuid_generate_v4() primary key,
  property_id uuid references public.properties(id) on delete cascade,
  reported_by uuid references public.users(id),
  date date not null,
  cost_nok numeric(10,2),
  status text check (status in ('new', 'open', 'matched', 'closed')) default 'new',
  signature_id text references public.signatures(code),
  ai_match_confidence numeric(5,2),
  photo_urls text[] default '{}',
  gps_lat numeric(10,6),
  gps_lng numeric(10,6),
  evidence_hash text,
  police_ref text,
  created_at timestamptz default now()
);
alter table public.incidents enable row level security;
create policy "Property owners can view their incidents" on public.incidents
  for select using (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
  );
create policy "Authenticated users can insert incidents" on public.incidents
  for insert with check (auth.uid() = reported_by);

-- Bounties table
create table public.bounties (
  id uuid default uuid_generate_v4() primary key,
  incident_id uuid references public.incidents(id),
  signature_id text references public.signatures(code),
  amount_nok numeric(10,2) not null check (amount_nok >= 1000),
  status text check (status in ('open', 'claimed', 'paid', 'closed')) default 'open',
  tips_count int default 0,
  posted_by uuid references public.users(id),
  description text,
  city text,
  created_at timestamptz default now()
);
alter table public.bounties enable row level security;
create policy "Anyone can view open bounties" on public.bounties for select using (status = 'open');
create policy "Authenticated users can post bounties" on public.bounties
  for insert with check (auth.uid() = posted_by);

-- Indexes
create index incidents_property_id_idx on public.incidents(property_id);
create index incidents_signature_id_idx on public.incidents(signature_id);
create index bounties_status_idx on public.bounties(status);
create index bounties_city_idx on public.bounties(city);
