const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { createUser, getUserByEmail, getUserById } = require('../config/authStore');

// Public registration intentionally allows only normal users.
// Admin users should be created by seed data or a trusted database/admin process.
const allowedRoles = new Set(['employer', 'job_seeker']);

// Email validation regex: standard email format
const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// JWTs store the minimum identity needed by the API: user id and role.
const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

// Never return the password hash to the frontend.
const publicUserFields = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  created_at: user.created_at,
  updated_at: user.updated_at
});

const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  // Basic backend validation protects the API even if a user bypasses the React form.
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Name, email, password, and role are required' });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Email must be a valid email format (e.g., user@example.com)' });
  }

  if (!allowedRoles.has(role)) {
    return res.status(400).json({ message: 'Registration role must be employer or job_seeker' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    try {
      const connection = await db.getConnection();
      await connection.beginTransaction();

      const [existing] = await connection.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
      if (existing.length) {
        await connection.rollback();
        connection.release();
        return res.status(409).json({ message: 'Email is already registered' });
      }

      const [result] = await connection.query(
        'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
        [name, email, hash, role, 'active']
      );

      if (role === 'employer') {
        await connection.query(
          'INSERT INTO employer_profiles (user_id, company_name, company_description, industry, location, phone, website) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [result.insertId, `${name}'s Company`, null, null, null, null, null]
        );
      } else {
        await connection.query(
          'INSERT INTO job_seeker_profiles (user_id, phone, location, skills, education, experience_level, cv_file) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [result.insertId, null, null, null, null, null, null]
        );
      }

      const [users] = await connection.query(
        'SELECT id, name, email, role, status, created_at, updated_at FROM users WHERE id = ?',
        [result.insertId]
      );

      await connection.commit();
      connection.release();
      return res.status(201).json({ user: publicUserFields(users[0]), token: signToken(users[0]) });
    } catch (dbError) {
      const fallbackUser = createUser({
        name,
        email,
        passwordHash: hash,
        role,
        status: 'active'
      });

      if (!fallbackUser) {
        return res.status(409).json({ message: 'Email is already registered' });
      }

      return res.status(201).json({ user: publicUserFields(fallbackUser), token: signToken(fallbackUser) });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    try {
      const [users] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
      const user = users[0];
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      if (user.status !== 'active') {
        return res.status(403).json({ message: 'User account is inactive' });
      }

      return res.json({ user: publicUserFields(user), token: signToken(user) });
    } catch (dbError) {
      const fallbackUser = getUserByEmail(email);
      if (!fallbackUser || !(await bcrypt.compare(password, fallbackUser.password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      if (fallbackUser.status !== 'active') {
        return res.status(403).json({ message: 'User account is inactive' });
      }

      return res.json({ user: publicUserFields(fallbackUser), token: signToken(fallbackUser) });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

const me = async (req, res) => {
  // req.user was loaded by the protect middleware.
  res.json({ user: req.user });
};

module.exports = { register, login, me };
