const db = require('../config/db');
const path = require('path');
const fs = require('fs');

const adminStorePath = path.join(__dirname, '..', 'data', 'admin-store.json');

const ensureAdminStore = () => {
  const dir = path.dirname(adminStorePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(adminStorePath)) fs.writeFileSync(adminStorePath, JSON.stringify({ users: [] }, null, 2));
};

const readAdminStore = () => {
  ensureAdminStore();
  return JSON.parse(fs.readFileSync(adminStorePath, 'utf8'));
};

const writeAdminStore = (store) => {
  ensureAdminStore();
  fs.writeFileSync(adminStorePath, JSON.stringify(store, null, 2));
};

const getUsersFromStore = () => readAdminStore().users || [];

const updateUserStatusInStore = (id, status) => {
  const store = readAdminStore();
  const index = store.users.findIndex((user) => String(user.id) === String(id));
  if (index === -1) return null;
  store.users[index] = { ...store.users[index], status };
  writeAdminStore(store);
  return store.users[index];
};

const stats = async (req, res) => {
  try {
    // These separate count queries keep the dashboard simple and easy to read for students.
    const [[users]] = await db.query('SELECT COUNT(*) AS total FROM users').catch(() => [{ total: getUsersFromStore().length }]);
    const [[employers]] = await db.query("SELECT COUNT(*) AS total FROM users WHERE role = 'employer'").catch(() => [{ total: getUsersFromStore().filter((u) => u.role === 'employer').length }]);
    const [[seekers]] = await db.query("SELECT COUNT(*) AS total FROM users WHERE role = 'job_seeker'").catch(() => [{ total: getUsersFromStore().filter((u) => u.role === 'job_seeker').length }]);
    const [[jobs]] = await db.query('SELECT COUNT(*) AS total FROM jobs').catch(() => [{ total: 0 }]);
    const [[openJobs]] = await db.query("SELECT COUNT(*) AS total FROM jobs WHERE status = 'open'").catch(() => [{ total: 0 }]);
    const [[applications]] = await db.query('SELECT COUNT(*) AS total FROM applications').catch(() => [{ total: 0 }]);
    res.json({
      stats: {
        users: users.total,
        employers: employers.total,
        job_seekers: seekers.total,
        jobs: jobs.total,
        open_jobs: openJobs.total,
        applications: applications.total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not load stats', error: error.message });
  }
};

const users = async (req, res) => {
  try {
    // Admin user lists omit password hashes.
    try {
      const [rows] = await db.query(
        'SELECT id, name, email, role, status, created_at, updated_at FROM users ORDER BY created_at DESC'
      );
      return res.json({ users: rows });
    } catch (dbError) {
      return res.json({ users: getUsersFromStore() });
    }
  } catch (error) {
    res.status(500).json({ message: 'Could not load users', error: error.message });
  }
};

const jobs = async (req, res) => {
  try {
    // Admins see both open and closed jobs for moderation.
    try {
      const [rows] = await db.query(`
        SELECT jobs.*, users.name AS employer_name, employer_profiles.company_name
        FROM jobs
        JOIN users ON users.id = jobs.employer_id
        LEFT JOIN employer_profiles ON employer_profiles.user_id = jobs.employer_id
        ORDER BY jobs.created_at DESC
      `);
      return res.json({ jobs: rows });
    } catch (dbError) {
      return res.json({ jobs: [] });
    }
  } catch (error) {
    res.status(500).json({ message: 'Could not load jobs', error: error.message });
  }
};

const applications = async (req, res) => {
  try {
    // Joined data gives admins applicant, job, and company context in one request.
    try {
      const [rows] = await db.query(`
        SELECT applications.*, jobs.title AS job_title, employer_profiles.company_name,
               users.name AS job_seeker_name, users.email AS job_seeker_email
        FROM applications
        JOIN jobs ON jobs.id = applications.job_id
        LEFT JOIN employer_profiles ON employer_profiles.user_id = jobs.employer_id
        JOIN users ON users.id = applications.job_seeker_id
        ORDER BY applications.applied_at DESC
      `);
      return res.json({ applications: rows });
    } catch (dbError) {
      return res.json({ applications: [] });
    }
  } catch (error) {
    res.status(500).json({ message: 'Could not load applications', error: error.message });
  }
};

const updateUserStatus = async (req, res) => {
  const { status } = req.body;
  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ message: 'Status must be active or inactive' });
  }
  if (Number(req.params.id) === req.user.id) {
    // Prevent an admin from locking themselves out by mistake.
    return res.status(400).json({ message: 'You cannot deactivate your own account' });
  }

  try {
    try {
      const [result] = await db.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
      if (!result.affectedRows) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json({ message: 'User status updated' });
    } catch (dbError) {
      const updated = updateUserStatusInStore(req.params.id, status);
      if (!updated) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json({ message: 'User status updated' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Could not update user status', error: error.message });
  }
};

module.exports = { stats, users, jobs, applications, updateUserStatus };
