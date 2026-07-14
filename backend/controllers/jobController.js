const db = require('../config/db');
const path = require('path');
const fs = require('fs');

const jobsStorePath = path.join(__dirname, '..', 'data', 'jobs-store.json');

const ensureJobsStore = () => {
  const dir = path.dirname(jobsStorePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(jobsStorePath)) fs.writeFileSync(jobsStorePath, JSON.stringify({ jobs: [] }, null, 2));
};

const readJobsStore = () => {
  ensureJobsStore();
  return JSON.parse(fs.readFileSync(jobsStorePath, 'utf8'));
};

const writeJobsStore = (store) => {
  ensureJobsStore();
  fs.writeFileSync(jobsStorePath, JSON.stringify(store, null, 2));
};

const listJobsFromStore = () => {
  const store = readJobsStore();
  return store.jobs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

const getJobFromStore = (id) => {
  const store = readJobsStore();
  return store.jobs.find((job) => String(job.id) === String(id)) || null;
};

const createJobInStore = (job) => {
  const store = readJobsStore();
  store.jobs.push(job);
  writeJobsStore(store);
  return job;
};

const updateJobInStore = (id, payload) => {
  const store = readJobsStore();
  const index = store.jobs.findIndex((job) => String(job.id) === String(id));
  if (index === -1) return null;
  store.jobs[index] = { ...store.jobs[index], ...payload };
  writeJobsStore(store);
  return store.jobs[index];
};

const deleteJobInStore = (id) => {
  const store = readJobsStore();
  const before = store.jobs.length;
  store.jobs = store.jobs.filter((job) => String(job.id) !== String(id));
  writeJobsStore(store);
  return store.jobs.length !== before;
};

// Shared SELECT fragment so job list and detail endpoints return consistent fields.
const jobSelect = `
  SELECT jobs.*, users.name AS employer_name, employer_profiles.company_name,
         employer_profiles.industry, employer_profiles.website
  FROM jobs
  JOIN users ON users.id = jobs.employer_id
  LEFT JOIN employer_profiles ON employer_profiles.user_id = jobs.employer_id
`;

const listJobs = async (req, res) => {
  const { search, title, company, location, job_type, status } = req.query;
  const filters = [];
  const params = [];

  // Small helper to keep $1, $2, ... indices in sync with the params array
  // as filters are added conditionally.
  const addParam = (value) => {
    params.push(value);
    return params.length;
  };

  if (req.user && req.user.role === 'admin' && status) {
    // Admins can filter by status when using this controller through authenticated clients.
    filters.push(`jobs.status = $${addParam(status)}`);
  } else {
    // Public browsing should show only open jobs.
    filters.push("jobs.status = 'open'");
  }

  if (search) {
    // A broad keyword search checks common fields job seekers expect.
    // Postgres LIKE is case-sensitive (unlike MySQL's default collation), so
    // ILIKE is used to preserve the original case-insensitive behavior.
    // The same placeholder can be referenced multiple times in Postgres, so
    // only one param is needed even though it's used six times.
    const idx = addParam(`%${search}%`);
    filters.push(`(
      jobs.title ILIKE $${idx} OR employer_profiles.company_name ILIKE $${idx} OR jobs.location ILIKE $${idx}
      OR jobs.job_type ILIKE $${idx} OR jobs.description ILIKE $${idx} OR jobs.requirements ILIKE $${idx}
    )`);
  }

  if (title) {
    filters.push(`jobs.title ILIKE $${addParam(`%${title}%`)}`);
  }
  if (company) {
    filters.push(`employer_profiles.company_name ILIKE $${addParam(`%${company}%`)}`);
  }
  if (location) {
    filters.push(`jobs.location ILIKE $${addParam(`%${location}%`)}`);
  }
  if (job_type) {
    filters.push(`jobs.job_type = $${addParam(job_type)}`);
  }

  try {
    try {
      const result = await db.query(
        `${jobSelect} WHERE ${filters.join(' AND ')} ORDER BY jobs.created_at DESC`,
        params
      );
      return res.json({ jobs: result.rows });
    } catch (dbError) {
      const jobs = listJobsFromStore().filter((job) => job.status === 'open');
      return res.json({ jobs });
    }
  } catch (error) {
    res.status(500).json({ message: 'Could not load jobs', error: error.message });
  }
};

const getJob = async (req, res) => {
  try {
    try {
      const result = await db.query(`${jobSelect} WHERE jobs.id = $1 LIMIT 1`, [req.params.id]);
      if (result.rows.length) {
        return res.json({ job: result.rows[0] });
      }
    } catch (dbError) {
      const job = getJobFromStore(req.params.id);
      if (job) {
        return res.json({ job });
      }
    }
    return res.status(404).json({ message: 'Job not found' });
  } catch (error) {
    res.status(500).json({ message: 'Could not load job', error: error.message });
  }
};

const createJob = async (req, res) => {
  const {
    title,
    description,
    requirements,
    responsibilities,
    location,
    job_type,
    salary_range,
    deadline
  } = req.body;

  if (!title || !description || !location || !job_type || !deadline) {
    return res.status(400).json({
      message: 'Title, description, location, job type, and deadline are required'
    });
  }

  try {
    const inserted = await db.query(
      `INSERT INTO jobs
        (employer_id, title, description, requirements, responsibilities, location, job_type, salary_range, deadline, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'open')
       RETURNING id`,
      [
        req.user.id,
        title,
        description,
        requirements || '',
        responsibilities || '',
        location,
        job_type,
        salary_range || '',
        deadline
      ]
    );
    const result = await db.query(`${jobSelect} WHERE jobs.id = $1 LIMIT 1`, [inserted.rows[0].id]);
    return res.status(201).json({ message: 'Job posted', job: result.rows[0] });
  } catch (error) {
    const fallbackJob = createJobInStore({
      id: Date.now(),
      employer_id: req.user.id,
      employer_name: req.user.name,
      company_name: req.user.name,
      industry: null,
      website: null,
      title,
      description,
      requirements: requirements || '',
      responsibilities: responsibilities || '',
      location,
      job_type,
      salary_range: salary_range || '',
      deadline,
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    return res.status(201).json({ message: 'Job posted', job: fallbackJob });
  }
};

const employerJobs = async (req, res) => {
  try {
    // Employers can list only jobs where they are the owner.
    try {
      const result = await db.query(
        `${jobSelect} WHERE jobs.employer_id = $1 ORDER BY jobs.created_at DESC`,
        [req.user.id]
      );
      return res.json({ jobs: result.rows });
    } catch (dbError) {
      return res.json({ jobs: listJobsFromStore().filter((job) => String(job.employer_id) === String(req.user.id)) });
    }
  } catch (error) {
    res.status(500).json({ message: 'Could not load employer jobs', error: error.message });
  }
};

const updateJob = async (req, res) => {
  const id = req.params.id;
  const fields = [
    'title',
    'description',
    'requirements',
    'responsibilities',
    'location',
    'job_type',
    'salary_range',
    'deadline',
    'status'
  ];
  const payload = {};
  fields.forEach((field) => {
    // Only fields in the allow-list can be updated.
    if (req.body[field] !== undefined) payload[field] = req.body[field];
  });

  if (!Object.keys(payload).length) {
    return res.status(400).json({ message: 'No job fields provided' });
  }

  if (payload.status && !['open', 'closed'].includes(payload.status)) {
    return res.status(400).json({ message: 'Job status must be open or closed' });
  }

  try {
    const existing = await db
      .query('SELECT * FROM jobs WHERE id = $1 LIMIT 1', [id])
      .catch(() => ({ rows: [] }));
    if (!existing.rows.length) {
      return res.status(404).json({ message: 'Job not found' });
    }
    // Admins can moderate any job; employers can edit only their own jobs.
    if (req.user.role !== 'admin' && existing.rows[0].employer_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own jobs' });
    }

    // Build the SET clause from the validated allow-list above.
    const assignments = Object.keys(payload).map((field, i) => `${field} = $${i + 1}`);
    const idPlaceholder = Object.keys(payload).length + 1;
    // Fixed: this previously called an undefined `pool` variable (a leftover
    // from an earlier version of the code) instead of `db`.
    await db.query(`UPDATE jobs SET ${assignments.join(', ')} WHERE id = $${idPlaceholder}`, [
      ...Object.values(payload),
      id
    ]);

    try {
      const result = await db.query(`${jobSelect} WHERE jobs.id = $1 LIMIT 1`, [id]);
      return res.json({ message: 'Job updated', job: result.rows[0] });
    } catch (dbError) {
      const updated = updateJobInStore(id, payload);
      return res.json({ message: 'Job updated', job: updated });
    }
  } catch (error) {
    res.status(500).json({ message: 'Could not update job', error: error.message });
  }
};

const deleteJob = async (req, res) => {
  try {
    const existing = await db
      .query('SELECT * FROM jobs WHERE id = $1 LIMIT 1', [req.params.id])
      .catch(() => ({ rows: [] }));
    if (!existing.rows.length) {
      return res.status(404).json({ message: 'Job not found' });
    }
    // Ownership check mirrors updateJob.
    if (req.user.role !== 'admin' && existing.rows[0].employer_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own jobs' });
    }

    try {
      await db.query('DELETE FROM jobs WHERE id = $1', [req.params.id]);
    } catch (dbError) {
      deleteJobInStore(req.params.id);
    }
    return res.json({ message: 'Job deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Could not delete job', error: error.message });
  }
};

module.exports = { listJobs, getJob, createJob, employerJobs, updateJob, deleteJob };
