create extension if not exists pgcrypto;

create table if not exists sources (
  id uuid primary key default gen_random_uuid(), title text not null, publisher text, url text,
  published_at timestamptz, accessed_at timestamptz not null default now(), source_type text not null,
  metadata jsonb not null default '{}'::jsonb
);
create table if not exists geographies (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('country','state_ut','district','lok_sabha','assembly','city','place')),
  name text not null, code text, parent_id uuid references geographies(id), metadata jsonb not null default '{}'::jsonb,
  unique(kind,name,parent_id)
);
create table if not exists real_entities (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('person','party','institution','company','media','movement','organisation')),
  canonical_name text not null, short_name text, metadata jsonb not null default '{}'::jsonb
);
create table if not exists claims (
  id uuid primary key default gen_random_uuid(), subject_entity_id uuid references real_entities(id),
  title text not null, body text not null,
  status text not null check (status in ('VERIFIED','OFFICIAL_RECORD','COURT_FINDING','UNDER_INVESTIGATION','OFFICIAL_ALLEGATION','POLITICAL_ALLEGATION','DISPUTED','DENIED','UNVERIFIED')),
  event_date date, valid_from date, valid_to date, last_verified_at timestamptz, metadata jsonb not null default '{}'::jsonb
);
create table if not exists claim_sources (
  claim_id uuid references claims(id) on delete cascade, source_id uuid references sources(id) on delete cascade,
  relation text not null check (relation in ('supports','denies','context','reports')), primary key(claim_id,source_id,relation)
);
create table if not exists indicators (
  id uuid primary key default gen_random_uuid(), key text unique not null, label text not null, unit text, description text
);
create table if not exists indicator_values (
  id uuid primary key default gen_random_uuid(), indicator_id uuid references indicators(id), geography_id uuid references geographies(id),
  value numeric not null, reference_period text not null, observed_on date, source_id uuid references sources(id),
  confidence numeric check (confidence between 0 and 1), metadata jsonb not null default '{}'::jsonb
);
create table if not exists saves (
  id uuid primary key default gen_random_uuid(), user_id uuid, display_name text not null, schema_version integer not null,
  current_date date not null, real_world_snapshot_date date not null, world_state jsonb not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists save_journal (
  id bigserial primary key, save_id uuid references saves(id) on delete cascade, sequence_no bigint not null, game_date date not null,
  command_type text not null, command_payload jsonb not null, result_payload jsonb, created_at timestamptz not null default now(),
  unique(save_id,sequence_no)
);
create index if not exists idx_geo_parent on geographies(parent_id);
create index if not exists idx_claim_subject_date on claims(subject_entity_id,event_date);
create index if not exists idx_indicator_geo on indicator_values(indicator_id,geography_id,reference_period);
create index if not exists idx_save_journal on save_journal(save_id,sequence_no);
