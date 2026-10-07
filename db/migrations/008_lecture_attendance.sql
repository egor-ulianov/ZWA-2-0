drop table if exists attendance;
drop table if exists attendance_revisions;

create table attendance_revisions (
  lecture_number integer primary key check (lecture_number between 1 and 13),
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);

create table attendance (
  lecture_number integer not null check (lecture_number between 1 and 13),
  username text not null references students(username) on delete cascade,
  present boolean not null,
  updated_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (lecture_number, username)
);
