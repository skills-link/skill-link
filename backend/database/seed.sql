-- =====================================================
-- Skills Link Uganda Seed Data (PostgreSQL)
-- Default password for all users: password123
-- =====================================================

-- =====================================================
-- USERS
-- =====================================================

INSERT INTO users (name, email, password, role, status) VALUES
('Admin User', 'admin@skill-link.com', '$2b$10$LNJPkbtC6ASk9j.E/35sIO7BILb7tzbSO1IoJCsL.ARCHLCSbcJQq', 'admin', 'active'),
('Amina Tech', 'employer1@skill-link.com', '$2b$10$LNJPkbtC6ASk9j.E/35sIO7BILb7tzbSO1IoJCsL.ARCHLCSbcJQq', 'employer', 'active'),
('Daniel Works', 'employer2@skill-link.com', '$2b$10$LNJPkbtC6ASk9j.E/35sIO7BILb7tzbSO1IoJCsL.ARCHLCSbcJQq', 'employer', 'active'),
('Sarah Namatovu', 'seeker1@skill-link.com', '$2b$10$LNJPkbtC6ASk9j.E/35sIO7BILb7tzbSO1IoJCsL.ARCHLCSbcJQq', 'job_seeker', 'active'),
('Brian Okello', 'seeker2@skill-link.com', '$2b$10$LNJPkbtC6ASk9j.E/35sIO7BILb7tzbSO1IoJCsL.ARCHLCSbcJQq', 'job_seeker', 'active'),
('Grace Atim', 'seeker3@skill-link.com', '$2b$10$LNJPkbtC6ASk9j.E/35sIO7BILb7tzbSO1IoJCsL.ARCHLCSbcJQq', 'job_seeker', 'active'),
('Peter Kato', 'seeker4@skill-link.com', '$2b$10$LNJPkbtC6ASk9j.E/35sIO7BILb7tzbSO1IoJCsL.ARCHLCSbcJQq', 'job_seeker', 'active'),
('Joan Akello', 'seeker5@skill-link.com', '$2b$10$LNJPkbtC6ASk9j.E/35sIO7BILb7tzbSO1IoJCsL.ARCHLCSbcJQq', 'job_seeker', 'active');

-- =====================================================
-- EMPLOYER PROFILES
-- =====================================================

INSERT INTO employer_profiles
(user_id, company_name, company_description, industry, location, phone, website)
VALUES
(2, 'BluePeak Software',
'A product engineering company building web platforms for growing businesses.',
'Technology',
'Kampala, Uganda',
'+256700111222',
'https://bluepeak.skill-link.com'),

(3, 'GreenHarvest Logistics',
'A regional logistics and supply chain company serving food and retail partners.',
'Logistics',
'Entebbe, Uganda',
'+256700333444',
'https://greenharvest.skill-link.com');

-- =====================================================
-- JOB SEEKER PROFILES
-- =====================================================

INSERT INTO job_seeker_profiles
(user_id, phone, location, skills, education, experience_level, cv_file)
VALUES
(4, '+256701000001', 'Kampala, Uganda',
'React, JavaScript, Bootstrap, REST APIs',
'BSc Computer Science',
'Mid level',
'sample-sarah-cv.pdf'),

(5, '+256701000002', 'Jinja, Uganda',
'Node.js, Express, PostgreSQL, API Testing',
'Diploma in Software Engineering',
'Junior',
'sample-brian-cv.pdf'),

(6, '+256701000003', 'Mbarara, Uganda',
'Customer Support, CRM, Reporting',
'BA Business Administration',
'Entry level',
'sample-grace-cv.pdf'),

(7, '+256701000004', 'Kampala, Uganda',
'Operations, Inventory, Dispatch Coordination',
'Diploma in Procurement',
'Mid level',
'sample-peter-cv.pdf'),

(8, '+256701000005', 'Gulu, Uganda',
'Digital Marketing, Content Writing, SEO',
'BA Mass Communication',
'Junior',
'sample-joan-cv.pdf');

-- =====================================================
-- JOBS
-- =====================================================

INSERT INTO jobs
(employer_id, title, description, requirements, responsibilities,
location, job_type, salary_range, deadline, status)
VALUES

(2, 'Accounting',
'Manage financial records, invoicing, and bookkeeping for the organization.',
'Accounting knowledge, Excel, bookkeeping experience.',
'Record transactions, prepare reports, reconcile accounts, maintain records.',
'Kampala, Uganda',
'Full-time',
'UGX 2.5M - 4M',
'2026-08-30',
'open'),

(2, 'Mopping',
'Maintain cleanliness and sanitation across office facilities.',
'Attention to detail, physical stamina, sanitation knowledge.',
'Clean floors, maintain supplies, report maintenance needs.',
'Remote',
'Part-time',
'UGX 500K - 800K',
'2026-09-15',
'open'),

(2, 'Carpentry',
'Build and repair wooden structures and furniture.',
'Woodworking skills and tool knowledge.',
'Construct furniture and repair wooden items.',
'Kampala, Uganda',
'Contract',
'UGX 1.5M - 2.5M',
'2026-07-25',
'open'),

(2, 'Pottery',
'Create ceramic products for commercial purposes.',
'Pottery experience and artistic ability.',
'Shape clay, glaze work and operate kilns.',
'Kampala, Uganda',
'Internship',
'UGX 600K - 1M',
'2026-08-10',
'open'),

(3, 'Slashing',
'Clear vegetation for agricultural projects.',
'Land clearing experience.',
'Prepare land and maintain safety.',
'Entebbe, Uganda',
'Full-time',
'UGX 1M - 1.8M',
'2026-08-20',
'open'),

(3, 'Babysitting',
'Provide childcare services.',
'Childcare experience and patience.',
'Supervise children and organize activities.',
'Kampala, Uganda',
'Part-time',
'UGX 600K - 1.2M',
'2026-09-05',
'open'),

(3, 'Librarian',
'Manage library resources and assist patrons.',
'Library management experience.',
'Maintain collections and support users.',
'Jinja, Uganda',
'Full-time',
'UGX 1.5M - 2.2M',
'2026-07-31',
'open');

-- =====================================================
-- APPLICATIONS
-- =====================================================

INSERT INTO applications
(job_id, job_seeker_id, cover_letter, cv_file, status)
VALUES

(1, 4,
'I have accounting experience and strong attention to detail.',
'sample-sarah-cv.pdf',
'Shortlisted'),

(2, 5,
'I am reliable and committed to maintaining clean facilities.',
'sample-brian-cv.pdf',
'Pending'),

(3, 7,
'I have carpentry skills and experience with woodworking projects.',
'sample-peter-cv.pdf',
'Pending'),

(6, 6,
'I love working with children and have childcare experience.',
'sample-grace-cv.pdf',
'Hired'),

(4, 8,
'I am passionate about pottery and have experience with clay work.',
'sample-joan-cv.pdf',
'Rejected');