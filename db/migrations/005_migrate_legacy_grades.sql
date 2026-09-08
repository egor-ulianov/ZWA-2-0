-- Copy every recoverable legacy score into the audited grade model before the
-- legacy tables are retired. The migration runner executes this file in one
-- transaction, so a failure leaves the old storage available for retry.
alter table if exists grade_attempts add column if not exists legacy_key text;
create unique index if not exists grade_attempts_legacy_key_idx
  on grade_attempts (legacy_key) where legacy_key is not null;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = current_schema() and table_name = 'progress'
  ) then
    insert into students (username)
      select distinct lower(trim(username))
      from progress
      where username is not null
        and lower(trim(username)) ~ '^[a-z0-9][a-z0-9._-]{0,63}$'
      on conflict (username) do nothing;
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = current_schema() and table_name = 'test_grades'
  ) then
    insert into students (username)
      select distinct lower(trim(username))
      from test_grades
      where username is not null
        and lower(trim(username)) ~ '^[a-z0-9][a-z0-9._-]{0,63}$'
      on conflict (username) do nothing;
  end if;
end
$$;

-- The legacy test_grades stream contains the most detailed history. Preserve
-- every valid row and use its original timestamp when it is available.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = current_schema() and table_name = 'test_grades'
  ) then
    insert into grade_attempts (
      username, test_number, points, max_points, reasoning, source, actor,
      model, prompt_version, image_count, created_at, legacy_key
    )
    select lower(trim(t.username)), t.test_number::smallint,
      t.points::smallint, greatest(12, t.points)::smallint,
      left(coalesce(t.reasoning, ''), 4000), 'teacher', 'legacy-migration',
      null, null, greatest(0, least(coalesce(t.images_count, 0), 4))::smallint,
      coalesce(t.graded_at, now()), 'test_grades:' || t.id::text
    from test_grades t
    where t.username is not null
      and lower(trim(t.username)) ~ '^[a-z0-9][a-z0-9._-]{0,63}$'
      and t.test_number between 1 and 4
      and t.points between 0 and 100
    on conflict do nothing;
  end if;
end
$$;

-- A legacy progress row was a second source of truth. Keep its score as an
-- auditable fallback only when there was no corresponding test_grades row.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = current_schema()
      and table_name = 'progress'
      and column_name in ('test1', 'test2', 'test3', 'test4')
    having count(*) = 4
  ) then
    insert into grade_attempts (
      username, test_number, points, max_points, reasoning, source, actor,
      model, prompt_version, image_count, legacy_key
    )
    select lower(trim(p.username)), legacy.test_number::smallint,
      legacy.points::smallint, greatest(12, legacy.points)::smallint,
      'Imported from legacy progress', 'teacher', 'legacy-migration',
      null, null, 0, 'progress:' || p.id::text || ':' || legacy.test_number::text
    from progress p
    cross join lateral (values
      (1, p.test1), (2, p.test2), (3, p.test3), (4, p.test4)
    ) as legacy(test_number, points)
    where p.username is not null
      and lower(trim(p.username)) ~ '^[a-z0-9][a-z0-9._-]{0,63}$'
      and legacy.points between 0 and 100
    on conflict do nothing;
  end if;
end
$$;

-- Publish one deterministic legacy winner per student/test. A test_grades row
-- wins over the progress copy, then the newest timestamp and largest ID win.
insert into published_grades (username, test_number, attempt_id, updated_by)
select username, test_number, id, 'legacy-migration'
from (
  select ga.username, ga.test_number, ga.id,
    row_number() over (
      partition by ga.username, ga.test_number
      order by (ga.legacy_key like 'test_grades:%') desc,
        ga.created_at desc, ga.id desc
    ) as winner
  from grade_attempts ga
  where ga.legacy_key is not null
) candidates
where winner = 1
on conflict (username, test_number) do update
set attempt_id = excluded.attempt_id,
    updated_by = excluded.updated_by,
    updated_at = now()
where exists (
  select 1 from grade_attempts current_attempt
  where current_attempt.id = published_grades.attempt_id
    and current_attempt.legacy_key is not null
);

-- The new APIs have no dependency on either legacy grade representation.
drop table if exists test_grades;
alter table if exists progress drop column if exists test1;
alter table if exists progress drop column if exists test2;
alter table if exists progress drop column if exists test3;
alter table if exists progress drop column if exists test4;

-- Grade attempts are audit history: they may be inserted, but never edited or
-- deleted. Restrict student deletion so history cannot disappear via CASCADE.
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'grade_attempts_username_fkey') then
    alter table grade_attempts drop constraint grade_attempts_username_fkey;
  end if;
  if exists (select 1 from pg_constraint where conname = 'published_grades_username_fkey') then
    alter table published_grades drop constraint published_grades_username_fkey;
  end if;
  if exists (select 1 from pg_constraint where conname = 'published_grades_attempt_id_fkey') then
    alter table published_grades drop constraint published_grades_attempt_id_fkey;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'grade_attempts_student_fk') then
    alter table grade_attempts add constraint grade_attempts_student_fk
      foreign key (username) references students(username) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'published_grades_student_fk') then
    alter table published_grades add constraint published_grades_student_fk
      foreign key (username) references students(username) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'published_grades_attempt_fk') then
    alter table published_grades add constraint published_grades_attempt_fk
      foreign key (attempt_id) references grade_attempts(id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'grade_attempts_identity_key') then
    alter table grade_attempts add constraint grade_attempts_identity_key unique (id, username, test_number);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'published_grades_attempt_owner_fk') then
    alter table published_grades add constraint published_grades_attempt_owner_fk
      foreign key (attempt_id, username, test_number)
      references grade_attempts(id, username, test_number) on delete restrict;
  end if;
end
$$;

create or replace function reject_grade_attempt_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'grade_attempts rows are immutable';
end
$$;

drop trigger if exists grade_attempts_immutable on grade_attempts;
create trigger grade_attempts_immutable
before update or delete on grade_attempts
for each row execute function reject_grade_attempt_mutation();

create or replace function guard_normalization_run_mutation()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE'
    or new.id is distinct from old.id
    or new.test_number is distinct from old.test_number
    or new.max_points is distinct from old.max_points
    or new.actor is distinct from old.actor
    or new.model is distinct from old.model
    or new.prompt_version is distinct from old.prompt_version
    or new.original_attempts is distinct from old.original_attempts
    or new.created_at is distinct from old.created_at
    or new.normalized_items is distinct from old.normalized_items
    or (old.status = 'applied' and (
      new.status is distinct from old.status
      or new.applied_by is distinct from old.applied_by
      or new.applied_at is distinct from old.applied_at
    ))
    or (old.status = 'previewed' and new.status not in ('previewed', 'applied'))
    or (old.status = 'previewed' and new.status = 'previewed' and (
      new.applied_by is distinct from old.applied_by
      or new.applied_at is distinct from old.applied_at
    ))
  then
    raise exception 'grade_normalization_runs audit fields are immutable';
  end if;
  if old.status = 'previewed' and new.status = 'applied'
    and (new.applied_by is null or new.applied_at is null or new.applied_by is distinct from old.actor) then
    raise exception 'applied normalization runs require the owning actor and timestamp';
  end if;
  return new;
end
$$;

drop trigger if exists grade_normalization_runs_immutable on grade_normalization_runs;
create trigger grade_normalization_runs_immutable
before update or delete on grade_normalization_runs
for each row execute function guard_normalization_run_mutation();
