-- Supabase schema for assessments/tests/explorations/courses

create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null,
  audience text not null default 'visitor',
  content jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists explorations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  syllabus jsonb not null default '[]',
  created_at timestamptz not null default now()
);

