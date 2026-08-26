-- Run once against an existing database.
-- The live database uses VARCHAR and historical title values, so normalize
-- them directly to the application role values.
UPDATE users SET designation = 'campus_manager'
WHERE LOWER(TRIM(designation)) IN ('admin', 'campus manager', 'campus_manager');

UPDATE users SET designation = 'hod'
WHERE LOWER(TRIM(designation)) IN ('hod', 'head of department');

UPDATE users SET designation = 'principal'
WHERE LOWER(TRIM(designation)) = 'principal';

UPDATE users SET designation = 'ap'
WHERE LOWER(TRIM(designation)) IN (
  'ap', 'assistant professor', 'assoc. prof.', 'prof.', 'prof. audit', 'counselor', 'intern'
);