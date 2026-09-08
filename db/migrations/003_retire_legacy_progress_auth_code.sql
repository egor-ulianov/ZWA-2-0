-- Legacy progress remains temporarily for the grading-route migration, but it
-- must never retain student plaintext access codes after 001 has copied fields.
alter table if exists progress drop column if exists auth_code;
