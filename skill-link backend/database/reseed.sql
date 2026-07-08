USE jobconnect;

-- Clear existing data from tables (in reverse dependency order)
TRUNCATE TABLE applications;
TRUNCATE TABLE jobs;
TRUNCATE TABLE employer_profiles;
TRUNCATE TABLE job_seeker_profiles;
TRUNCATE TABLE users;

-- Now run the seed data
source database/seed.sql;
