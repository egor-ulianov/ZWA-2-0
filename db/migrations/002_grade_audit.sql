create table if not exists grade_attempts (
  id bigserial primary key,
  username text not null references students(username) on delete cascade,
  test_number smallint not null check (test_number between 1 and 4),
  points smallint not null check (points >= 0),
  max_points smallint not null check (max_points between 1 and 100 and points <= max_points),
  reasoning text not null default '' check (char_length(reasoning) <= 4000),
  source text not null check (source in ('ai', 'teacher', 'normalized')),
  actor text not null,
  model text,
  prompt_version text,
  image_count smallint not null default 0 check (image_count between 0 and 4),
  created_at timestamptz not null default now()
);

create table if not exists published_grades (
  username text not null references students(username) on delete cascade,
  test_number smallint not null check (test_number between 1 and 4),
  attempt_id bigint not null references grade_attempts(id),
  updated_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (username, test_number)
);

create index if not exists grade_attempts_student_test_idx on grade_attempts (username, test_number, created_at desc);
