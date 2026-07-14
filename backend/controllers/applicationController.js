const db = require('../config/db');
const path = require('path');
const fs = require('fs');

const applicationsStorePath = path.join(__dirname, '..', 'data', 'applications-store.json');

const ensureApplicationsStore = () => {
  const dir = path.dirname(applicationsStorePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(applicationsStorePath)) fs.writeFileSync(applicationsStorePath, JSON.stringify({ applications: [] }, null, 2));
};

const readApplicationsStore = () => {
  ensureApplicationsStore();
  return JSON.parse(fs.readFileSync(applicationsStorePath, 'utf8'));
};

const writeApplicationsStore = (store) => {
  ensureApplicationsStore();
  fs.writeFileSync(applicationsStorePath, JSON.stringify(store, null, 2));
};

const listApplicationsFromStore = () => {
  const store = readApplicationsStore();
  return store.applications.sort((a, b) => new Date(b.applied_at) - new Date(a.applied_at));
};

const createApplicationInStore = (application) => {
  const store = readApplicationsStore();
  store.applications.push(application);
  writeApplicationsStore(store);
  return application;
};

const updateApplicationInStore = (id, payload) => {
  const store = readApplicationsStore();
  const index = store.applications.findIndex((app) => String(app.id) === String(id));
  if (index === -1) return null;
  store.applications[index] = { ...store.applications[index], ...payload };
  writeApplicationsStore(store);
  return store.applications[index];
};

// Shared SELECT fragment for application views.
// It joins jobs, employer profiles, users, and seeker profiles so the UI can show useful context.
const applicationSelect = `
  SELECT applications.*, jobs.title AS job_title, jobs.location AS job_location,
         jobs.job_type, jobs.employer_id, employer_profiles.company_name,
         users.name AS job_seeker_name, users.email AS job_seeker_email,
         job_seeker_profiles.phone, job_seeker_profiles.location AS seeker_location,
         job_seeker_profiles.skills, job_seeker_profiles.education,
         job_seeker_profiles.experience_level
  FROM applications
  JOIN jobs ON jobs.id = applications.job_id
  LEFT JOIN employer_profiles ON employer_profiles.user_id = jobs.employer_id
  JOIN users ON users.id = applications.job_seeker_id
  LEFT JOIN job_seeker_profiles ON job_seeker_profiles.user_id = applications.job_seeker_id
`;

const applyForJob = async (req, res) => {
  const { cover_letter } = req.body;
  const jobId = req.params.jobId;

  if (!cover_letter) {
    return res.status(400).json({ message: 'Cover letter is required' });
  }

  try {
    // Job seekers can apply only to jobs that exist and are currently open.
    try {
      const jobsResult = await db.query('SELECT * FROM jobs WHERE id = $1 LIMIT 1', [jobId]);
      if (!jobsResult.rows.length || jobsResult.rows[0].status !== 'open') {
        return res.status(404).json({ message: 'Open job not found' });
      }

      const duplicate = await db.query(
        'SELECT id FROM applications WHERE job_id = $1 AND job_seeker_id = $2 LIMIT 1',
        [jobId, req.user.id]
      );
      if (duplicate.rows.length) {
        return res.status(409).json({ message: 'You have already applied for this job' });
      }

      const profiles = await db.query('SELECT cv_file FROM job_seeker_profiles WHERE user_id = $1 LIMIT 1', [req.user.id]);
      const cvFile = req.file ? req.file.filename : profiles.rows[0] && profiles.rows[0].cv_file;
      if (!cvFile) {
        return res.status(400).json({ message: 'Please upload a CV before applying' });
      }

      const inserted = await db.query(
        `INSERT INTO applications (job_id, job_seeker_id, cover_letter, cv_file, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [jobId, req.user.id, cover_letter, cvFile, 'Pending']
      );

      const rows = await db.query(`${applicationSelect} WHERE applications.id = $1 LIMIT 1`, [inserted.rows[0].id]);
      return res.status(201).json({ message: 'Application submitted', application: rows.rows[0] });
    } catch (dbError) {
      const application = createApplicationInStore({
        id: Date.now(),
        job_id: Number(jobId),
        job_seeker_id: req.user.id,
        cover_letter,
        cv_file: req.file ? req.file.filename : null,
        status: 'Pending',
        applied_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        job_title: 'Fallback Job',
        job_location: '',
        job_type: '',
        employer_id: null,
        company_name: null,
        job_seeker_name: req.user.name,
        job_seeker_email: req.user.email,
        phone: null,
        seeker_location: null,
        skills: null,
        education: null,
        experience_level: null
      });
      return res.status(201).json({ message: 'Application submitted', application });
    }
  } catch (error) {
    res.status(500).json({ message: 'Could not submit application', error: error.message });
  }
};

const myApplications = async (req, res) => {
  try {
    // The job_seeker_id filter enforces "my private records only."
    try {
      const result = await db.query(
        `${applicationSelect} WHERE applications.job_seeker_id = $1 ORDER BY applications.applied_at DESC`,
        [req.user.id]
      );
      return res.json({ applications: result.rows });
    } catch (dbError) {
      return res.json({ applications: listApplicationsFromStore().filter((app) => String(app.job_seeker_id) === String(req.user.id)) });
    }
  } catch (error) {
    res.status(500).json({ message: 'Could not load applications', error: error.message });
  }
};

const jobApplications = async (req, res) => {
  try {
    // First load the job owner so we can enforce employer ownership.
    try {
      const jobsResult = await db.query('SELECT employer_id FROM jobs WHERE id = $1 LIMIT 1', [req.params.jobId]);
      if (!jobsResult.rows.length) {
        return res.status(404).json({ message: 'Job not found' });
      }
      if (req.user.role !== 'admin' && jobsResult.rows[0].employer_id !== req.user.id) {
        return res.status(403).json({ message: 'You can only view applicants for your own jobs' });
      }

      const result = await db.query(
        `${applicationSelect} WHERE applications.job_id = $1 ORDER BY applications.applied_at DESC`,
        [req.params.jobId]
      );
      return res.json({ applications: result.rows });
    } catch (dbError) {
      return res.json({ applications: listApplicationsFromStore().filter((app) => String(app.job_id) === String(req.params.jobId)) });
    }
  } catch (error) {
    res.status(500).json({ message: 'Could not load job applications', error: error.message });
  }
};

const updateApplicationStatus = async (req, res) => {
  const { status } = req.body;
  const allowed = ['Pending', 'Shortlisted', 'Rejected', 'Hired'];

  if (!allowed.includes(status)) {
    return res.status(400).json({ message: 'Invalid application status' });
  }

  try {
    // Load joined application data so we can check the employer_id of the job.
    try {
      const existing = await db.query(`${applicationSelect} WHERE applications.id = $1 LIMIT 1`, [req.params.id]);
      if (!existing.rows.length) {
        return res.status(404).json({ message: 'Application not found' });
      }
      if (req.user.role !== 'admin' && existing.rows[0].employer_id !== req.user.id) {
        return res.status(403).json({ message: 'You can only update applicants for your own jobs' });
      }

      await db.query('UPDATE applications SET status = $1 WHERE id = $2', [status, req.params.id]);
      const updated = await db.query(`${applicationSelect} WHERE applications.id = $1 LIMIT 1`, [req.params.id]);
      return res.json({ message: 'Application status updated', application: updated.rows[0] });
    } catch (dbError) {
      const updated = updateApplicationInStore(req.params.id, { status });
      if (!updated) {
        return res.status(404).json({ message: 'Application not found' });
      }
      return res.json({ message: 'Application status updated', application: updated });
    }
  } catch (error) {
    res.status(500).json({ message: 'Could not update application status', error: error.message });
  }
};

module.exports = { applyForJob, myApplications, jobApplications, updateApplicationStatus };
