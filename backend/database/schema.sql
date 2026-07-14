-- =====================================================
-- Skills Link Uganda Database Schema (PostgreSQL)
-- =====================================================

-- Drop tables (children first)
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS job_seeker_profiles CASCADE;
DROP TABLE IF EXISTS employer_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop enum types if they already exist
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS job_type_enum CASCADE;
DROP TYPE IF EXISTS job_status CASCADE;
DROP TYPE IF EXISTS application_status CASCADE;

-- =====================================================
-- ENUM TYPES
-- =====================================================

CREATE TYPE user_role AS ENUM (
    'admin',
    'employer',
    'job_seeker'
);

CREATE TYPE user_status AS ENUM (
    'active',
    'inactive'
);

CREATE TYPE job_type_enum AS ENUM (
    'Full-time',
    'Part-time',
    'Contract',
    'Internship',
    'Remote'
);

CREATE TYPE job_status AS ENUM (
    'open',
    'closed'
);

CREATE TYPE application_status AS ENUM (
    'Pending',
    'Shortlisted',
    'Rejected',
    'Hired'
);

-- =====================================================
-- USERS
-- =====================================================

CREATE TABLE users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    name VARCHAR(120) NOT NULL,

    email VARCHAR(160) UNIQUE NOT NULL,

    password VARCHAR(255) NOT NULL,

    role user_role NOT NULL,

    status user_status DEFAULT 'active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT check_email_format
        CHECK (
            email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
        )
);

-- =====================================================
-- EMPLOYER PROFILES
-- =====================================================

CREATE TABLE employer_profiles (

    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id INTEGER UNIQUE NOT NULL,

    company_name VARCHAR(160) NOT NULL,

    company_description TEXT,

    industry VARCHAR(120),

    location VARCHAR(160),

    phone VARCHAR(40),

    website VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_employer_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT check_employer_phone_format
        CHECK (
            phone IS NULL
            OR phone ~ '^\+256[0-9]{9}$'
        )
);

-- =====================================================
-- JOB SEEKER PROFILES
-- =====================================================

CREATE TABLE job_seeker_profiles (

    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id INTEGER UNIQUE NOT NULL,

    phone VARCHAR(40),

    location VARCHAR(160),

    skills TEXT,

    education TEXT,

    experience_level VARCHAR(80),

    cv_file VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_job_seeker_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT check_seeker_phone_format
        CHECK (
            phone IS NULL
            OR phone ~ '^\+256[0-9]{9}$'
        )
);

-- =====================================================
-- JOBS
-- =====================================================

CREATE TABLE jobs (

    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    employer_id INTEGER NOT NULL,

    title VARCHAR(180) NOT NULL,

    description TEXT NOT NULL,

    requirements TEXT,

    responsibilities TEXT,

    location VARCHAR(160) NOT NULL,

    job_type job_type_enum NOT NULL,

    salary_range VARCHAR(100),

    deadline DATE NOT NULL,

    status job_status DEFAULT 'open',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_jobs_employer
        FOREIGN KEY (employer_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =====================================================
-- APPLICATIONS
-- =====================================================

CREATE TABLE applications (

    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    job_id INTEGER NOT NULL,

    job_seeker_id INTEGER NOT NULL,

    cover_letter TEXT NOT NULL,

    cv_file VARCHAR(255) NOT NULL,

    status application_status DEFAULT 'Pending',

    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_applications_job
        FOREIGN KEY (job_id)
        REFERENCES jobs(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_applications_seeker
        FOREIGN KEY (job_seeker_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_job_application
        UNIQUE(job_id, job_seeker_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_jobs_search
ON jobs(title, location, job_type, status);

CREATE INDEX idx_applications_status
ON applications(status);

-- =====================================================
-- AUTOMATIC UPDATED_AT TRIGGERS
-- =====================================================

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Users
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Employer Profiles
CREATE TRIGGER trg_employer_profiles_updated_at
BEFORE UPDATE ON employer_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Job Seeker Profiles
CREATE TRIGGER trg_job_seeker_profiles_updated_at
BEFORE UPDATE ON job_seeker_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Jobs
CREATE TRIGGER trg_jobs_updated_at
BEFORE UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Applications
CREATE TRIGGER trg_applications_updated_at
BEFORE UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
