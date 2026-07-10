USE jobconnect;

-- All seeded users use the bcrypt hash for password123.
-- In a real system, each user chooses their own password during registration.
INSERT INTO users (id, name, email, password, role, status) VALUES
(1, 'Admin User', 'admin@jobconnect.com', '$2b$10$LNJPkbtC6ASk9j.E/35sIO7BILb7tzbSO1IoJCsL.ARCHLCSbcJQq', 'admin', 'active'),
(2, 'Amina Tech', 'employer1@jobconnect.com', '$2b$10$LNJPkbtC6ASk9j.E/35sIO7BILb7tzbSO1IoJCsL.ARCHLCSbcJQq', 'employer', 'active'),
(3, 'Daniel Works', 'employer2@jobconnect.com', '$2b$10$LNJPkbtC6ASk9j.E/35sIO7BILb7tzbSO1IoJCsL.ARCHLCSbcJQq', 'employer', 'active'),
(4, 'Sarah Namatovu', 'seeker1@jobconnect.com', '$2b$10$LNJPkbtC6ASk9j.E/35sIO7BILb7tzbSO1IoJCsL.ARCHLCSbcJQq', 'job_seeker', 'active'),
(5, 'Brian Okello', 'seeker2@jobconnect.com', '$2b$10$LNJPkbtC6ASk9j.E/35sIO7BILb7tzbSO1IoJCsL.ARCHLCSbcJQq', 'job_seeker', 'active'),
(6, 'Grace Atim', 'seeker3@jobconnect.com', '$2b$10$LNJPkbtC6ASk9j.E/35sIO7BILb7tzbSO1IoJCsL.ARCHLCSbcJQq', 'job_seeker', 'active'),
(7, 'Peter Kato', 'seeker4@jobconnect.com', '$2b$10$LNJPkbtC6ASk9j.E/35sIO7BILb7tzbSO1IoJCsL.ARCHLCSbcJQq', 'job_seeker', 'active'),
(8, 'Joan Akello', 'seeker5@jobconnect.com', '$2b$10$LNJPkbtC6ASk9j.E/35sIO7BILb7tzbSO1IoJCsL.ARCHLCSbcJQq', 'job_seeker', 'active');

-- Two sample employers with company profile data.
INSERT INTO employer_profiles (user_id, company_name, company_description, industry, location, phone, website) VALUES
(2, 'BluePeak Software', 'A product engineering company building web platforms for growing businesses.', 'Technology', 'Kampala, Uganda', '+256700111222', 'https://bluepeak.example.com'),
(3, 'GreenHarvest Logistics', 'A regional logistics and supply chain company serving food and retail partners.', 'Logistics', 'Entebbe, Uganda', '+256700333444', 'https://greenharvest.example.com');

-- Five sample job seekers. The CV filenames are examples that match the upload filename pattern.
INSERT INTO job_seeker_profiles (user_id, phone, location, skills, education, experience_level, cv_file) VALUES
(4, '+256701000001', 'Kampala, Uganda', 'React, JavaScript, Bootstrap, REST APIs', 'BSc Computer Science', 'Mid level', 'sample-sarah-cv.pdf'),
(5, '+256701000002', 'Jinja, Uganda', 'Node.js, Express, MySQL, API testing', 'Diploma in Software Engineering', 'Junior', 'sample-brian-cv.pdf'),
(6, '+256701000003', 'Mbarara, Uganda', 'Customer support, CRM, reporting', 'BA Business Administration', 'Entry level', 'sample-grace-cv.pdf'),
(7, '+256701000004', 'Kampala, Uganda', 'Operations, inventory, dispatch coordination', 'Diploma in Procurement', 'Mid level', 'sample-peter-cv.pdf'),
(8, '+256701000005', 'Gulu, Uganda', 'Digital marketing, content writing, SEO', 'BA Mass Communication', 'Junior', 'sample-joan-cv.pdf');

-- Seven sample jobs across both employers. Open jobs appear in public browsing.
INSERT INTO jobs (id, employer_id, title, description, requirements, responsibilities, location, job_type, salary_range, deadline, status) VALUES
(1, 2, 'Accounting', 'Manage financial records, invoicing, and bookkeeping for the organization.', 'Accounting knowledge, Excel, bookkeeping experience.', 'Record transactions, prepare reports, reconcile accounts, maintain records.', 'Kampala, Uganda', 'Full-time', 'UGX 2.5M - 4M', '2026-08-30', 'open'),
(2, 2, 'Mopping', 'Maintain cleanliness and sanitation across office and warehouse facilities.', 'Attention to detail, physical stamina, sanitation knowledge.', 'Clean floors, maintain supplies, report maintenance needs, follow health standards.', 'Remote', 'Part-time', 'UGX 500K - 800K', '2026-09-15', 'open'),
(3, 2, 'Carpentry', 'Build and repair wooden structures and furniture for client projects.', 'Woodworking skills, carpentry tools knowledge, design basics.', 'Construct furniture, repair wooden items, measure and cut materials, finish work.', 'Kampala, Uganda', 'Contract', 'UGX 1.5M - 2.5M', '2026-07-25', 'open'),
(4, 2, 'Pottery', 'Create ceramic and pottery items for art and commercial purposes.', 'Pottery wheel experience, clay handling, artistic skills.', 'Shape clay, use potter wheel, glaze work, fire kiln, create designs.', 'Kampala, Uganda', 'Internship', 'UGX 600K - 1M', '2026-08-10', 'open'),
(5, 3, 'Slashing', 'Clear vegetation and prepare land for construction or agricultural projects.', 'Land clearing experience, cutlass/machete skills, stamina.', 'Clear bush, trim vegetation, prepare land, maintain safety standards.', 'Entebbe, Uganda', 'Full-time', 'UGX 1M - 1.8M', '2026-08-20', 'open'),
(6, 3, 'Babysitting', 'Provide childcare and supervision services for families in the community.', 'Childcare experience, patience, reliability, first aid knowledge.', 'Supervise children, organize activities, prepare meals, maintain safety.', 'Kampala, Uganda', 'Part-time', 'UGX 600K - 1.2M', '2026-09-05', 'open'),
(7, 3, 'Librarian', 'Organize, catalog, and manage library resources and patron services.', 'Library management, cataloging experience, customer service.', 'Manage collections, assist patrons, organize events, maintain records.', 'Jinja, Uganda', 'Full-time', 'UGX 1.5M - 2.2M', '2026-07-31', 'open');

-- Sample applications demonstrate the four status values used by employers.
INSERT INTO applications (job_id, job_seeker_id, cover_letter, cv_file, status) VALUES
(1, 4, 'I have accounting experience and strong attention to detail.', 'sample-sarah-cv.pdf', 'Shortlisted'),
(2, 5, 'I am reliable and committed to maintaining clean facilities.', 'sample-brian-cv.pdf', 'Pending'),
(3, 7, 'I have carpentry skills and experience with woodworking projects.', 'sample-peter-cv.pdf', 'Pending'),
(6, 6, 'I love working with children and have childcare experience.', 'sample-grace-cv.pdf', 'Hired'),
(4, 8, 'I am passionate about pottery and have experience with clay work.', 'sample-joan-cv.pdf', 'Rejected');
