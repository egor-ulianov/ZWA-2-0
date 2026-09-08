create table if not exists grade_normalization_runs (
  id uuid primary key,
  test_number smallint not null check (test_number between 1 and 4),
  max_points smallint not null check (max_points between 1 and 12),
  actor text not null,
  model text not null,
  prompt_version text not null,
  original_attempts jsonb not null,
  normalized_items jsonb not null,
  status text not null default 'previewed' check (status in ('previewed', 'applied')),
  applied_by text,
  created_at timestamptz not null default now(),
  applied_at timestamptz
);
