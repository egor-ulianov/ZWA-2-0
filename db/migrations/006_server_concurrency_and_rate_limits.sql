create table if not exists attendance_revisions (
  attendance_date date primary key,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);

insert into attendance_revisions (attendance_date, revision)
select distinct attendance_date, 0 from attendance
on conflict (attendance_date) do nothing;

create table if not exists rate_limit_buckets (
  bucket_key text not null check (char_length(bucket_key) between 1 and 128),
  window_start timestamptz not null,
  request_count integer not null check (request_count >= 0 and request_count <= 100000),
  updated_at timestamptz not null default now(),
  primary key (bucket_key, window_start)
);

create index if not exists rate_limit_buckets_updated_at_idx
  on rate_limit_buckets (updated_at);
