const db = require('../config/db');
const path = require('path');
const fs = require('fs');

const profilesStorePath = path.join(__dirname, '..', 'data', 'profiles-store.json');

const ensureProfilesStore = () => {
  const dir = path.dirname(profilesStorePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(profilesStorePath)) fs.writeFileSync(profilesStorePath, JSON.stringify({ profiles: [] }, null, 2));
};

const readProfilesStore = () => {
  ensureProfilesStore();
  return JSON.parse(fs.readFileSync(profilesStorePath, 'utf8'));
};

const writeProfilesStore = (store) => {
  ensureProfilesStore();
  fs.writeFileSync(profilesStorePath, JSON.stringify(store, null, 2));
};

const getProfileFromStore = (userId) => {
  const store = readProfilesStore();
  return store.profiles.find((profile) => String(profile.user_id) === String(userId)) || null;
};

const upsertProfileInStore = (userId, profile) => {
  const store = readProfilesStore();
  const existing = store.profiles.findIndex((item) => String(item.user_id) === String(userId));
  const nextProfile = { user_id: userId, ...profile };
  if (existing >= 0) {
    store.profiles[existing] = nextProfile;
  } else {
    store.profiles.push(nextProfile);
  }
  writeProfilesStore(store);
  return nextProfile;
};

// Phone validation regex: +256 followed by 9 digits
const phoneRegex = /^\+256[0-9]{9}$/;

const getProfile = async (req, res) => {
  try {
    // The same endpoint returns the correct profile table for the logged-in role.
    if (req.user.role === 'employer') {
      try {
        const result = await db.query('SELECT * FROM employer_profiles WHERE user_id = $1 LIMIT 1', [req.user.id]);
        return res.json({ profile: result.rows[0] || null });
      } catch (dbError) {
        return res.json({ profile: getProfileFromStore(req.user.id) });
      }
    }

    if (req.user.role === 'job_seeker') {
      try {
        const result = await db.query('SELECT * FROM job_seeker_profiles WHERE user_id = $1 LIMIT 1', [req.user.id]);
        return res.json({ profile: result.rows[0] || null });
      } catch (dbError) {
        return res.json({ profile: getProfileFromStore(req.user.id) });
      }
    }

    res.json({ profile: null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load profile', error: error.message });
  }
};

const upsertEmployerProfile = async (req, res) => {
  const { company_name, company_description, industry, location, phone, website } = req.body;

  if (!company_name) {
    return res.status(400).json({ message: 'Company name is required' });
  }

  if (phone && !phoneRegex.test(phone)) {
    return res.status(400).json({ message: 'Phone must be in format +256XXXXXXXXX (e.g., +256701234567)' });
  }

  try {
    // ON CONFLICT works because employer_profiles.user_id is UNIQUE.
    // It lets one endpoint handle both "create profile" and "update profile"
    // (the Postgres equivalent of MySQL's ON DUPLICATE KEY UPDATE).
    try {
      await db.query(
        `INSERT INTO employer_profiles
          (user_id, company_name, company_description, industry, location, phone, website)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id) DO UPDATE SET
          company_name = EXCLUDED.company_name,
          company_description = EXCLUDED.company_description,
          industry = EXCLUDED.industry,
          location = EXCLUDED.location,
          phone = EXCLUDED.phone,
          website = EXCLUDED.website`,
        [
          req.user.id,
          company_name,
          company_description || null,
          industry || null,
          location || null,
          phone || null,
          website || null
        ]
      );

      const result = await db.query('SELECT * FROM employer_profiles WHERE user_id = $1 LIMIT 1', [req.user.id]);
      return res.json({ message: 'Employer profile saved', profile: result.rows[0] });
    } catch (dbError) {
      const profile = upsertProfileInStore(req.user.id, {
        role: 'employer',
        company_name,
        company_description: company_description || null,
        industry: industry || null,
        location: location || null,
        phone: phone || null,
        website: website || null
      });
      return res.json({ message: 'Employer profile saved', profile });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not save employer profile', error: error.message });
  }
};

const upsertJobSeekerProfile = async (req, res) => {
  const { phone, location, skills, education, experience_level } = req.body;
  // Multer adds req.file when a new CV was uploaded.
  const cvFile = req.file ? req.file.filename : req.body.existing_cv_file || null;

  if (phone && !phoneRegex.test(phone)) {
    return res.status(400).json({ message: 'Phone must be in format +256XXXXXXXXX (e.g., +256701234567)' });
  }

  try {
    try {
      const existing = await db.query('SELECT cv_file FROM job_seeker_profiles WHERE user_id = $1 LIMIT 1', [req.user.id]);
      const nextCvFile = cvFile || (existing.rows[0] && existing.rows[0].cv_file) || null;

      await db.query(
        `INSERT INTO job_seeker_profiles
          (user_id, phone, location, skills, education, experience_level, cv_file)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id) DO UPDATE SET
          phone = EXCLUDED.phone,
          location = EXCLUDED.location,
          skills = EXCLUDED.skills,
          education = EXCLUDED.education,
          experience_level = EXCLUDED.experience_level,
          cv_file = EXCLUDED.cv_file`,
        [
          req.user.id,
          phone || null,
          location || null,
          skills || null,
          education || null,
          experience_level || null,
          nextCvFile
        ]
      );

      const result = await db.query('SELECT * FROM job_seeker_profiles WHERE user_id = $1 LIMIT 1', [req.user.id]);
      return res.json({ message: 'Job seeker profile saved', profile: result.rows[0] });
    } catch (dbError) {
      const nextCvFile = cvFile || getProfileFromStore(req.user.id)?.cv_file || null;
      const profile = upsertProfileInStore(req.user.id, {
        role: 'job_seeker',
        phone: phone || null,
        location: location || null,
        skills: skills || null,
        education: education || null,
        experience_level: experience_level || null,
        cv_file: nextCvFile
      });
      return res.json({ message: 'Job seeker profile saved', profile });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not save job seeker profile', error: error.message });
  }
};

module.exports = { getProfile, upsertEmployerProfile, upsertJobSeekerProfile };
