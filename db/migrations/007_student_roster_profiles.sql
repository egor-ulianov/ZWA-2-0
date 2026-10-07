alter table students add column if not exists first_name text not null default '';
alter table students add column if not exists last_name text not null default '';
alter table students add column if not exists parallel text not null default '';
alter table students add column if not exists active boolean not null default true;

create index if not exists students_active_parallel_idx
  on students (active, parallel, last_name, first_name, username);
