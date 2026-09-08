-- A pre-hardening deployment used attendance(date text, username, present).
-- Keep it for a one-time copy instead of mutating its primary key in requests.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = current_schema() and table_name = 'attendance')
     and not exists (select 1 from information_schema.columns where table_schema = current_schema() and table_name = 'attendance' and column_name = 'attendance_date') then
    alter table attendance rename to attendance_legacy;
  end if;
end $$;

create table if not exists students (
  username text primary key check (username ~ '^[a-z0-9][a-z0-9._-]{0,63}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists student_access (
  username text primary key references students(username) on delete cascade,
  auth_code_hash text not null,
  expires_at timestamptz,
  revoked_at timestamptz,
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists assignments (
  username text primary key references students(username) on delete cascade,
  assignment_task_checked boolean not null default false,
  assignment_midterm_ok boolean not null default false,
  assignment_topic text check (char_length(assignment_topic) <= 500),
  assignment_partner text check (char_length(assignment_partner) <= 200),
  assignment_final_points integer check (assignment_final_points between 0 and 100),
  updated_by text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists attendance (
  attendance_date date not null,
  username text not null references students(username) on delete cascade,
  present boolean not null,
  updated_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (attendance_date, username)
);

create table if not exists revoked_sessions (
  session_id uuid primary key,
  expires_at timestamptz not null,
  revoked_at timestamptz not null default now()
);

create index if not exists revoked_sessions_expires_at_idx on revoked_sessions (expires_at);

-- Preserve only the minimum legacy roster/progress information. Existing plaintext
-- auth_code values are intentionally not copied; teachers must issue replacement codes.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = current_schema() and table_name = 'progress') then
    insert into students (username)
      select distinct lower(trim(username)) from progress
      where username ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$'
      on conflict (username) do nothing;
    insert into assignments (username, assignment_task_checked, assignment_midterm_ok, assignment_topic, assignment_partner, assignment_final_points, updated_by)
      select lower(trim(username)), coalesce(assignment_task_checked, false), coalesce(assignment_midterm_ok, false),
        left(assignment_topic, 500), left(assignment_partner, 200),
        case when assignment_final_points between 0 and 100 then assignment_final_points else null end, 'legacy-migration'
      from progress where username ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$'
      on conflict (username) do nothing;
  end if;
end $$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = current_schema() and table_name = 'attendance_legacy') then
    insert into students (username)
      select distinct lower(trim(username)) from attendance_legacy
      where username ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$'
      on conflict (username) do nothing;
    insert into attendance (attendance_date, username, present, updated_by)
      select to_date(date::text, 'YYYY-MM-DD'), lower(trim(username)), present, 'legacy-migration'
      from attendance_legacy
      where date::text ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
        and to_char(to_date(date::text, 'YYYY-MM-DD'), 'YYYY-MM-DD') = date::text
        and username ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$'
      on conflict (attendance_date, username) do nothing;
  end if;
end $$;
