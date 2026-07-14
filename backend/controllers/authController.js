const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getPool } = require("../config/db");
const {
  createUser,
  getUserByEmail,
  getUserById,
} = require("../config/authStore");

// Public registration intentionally allows only normal users.
// Admin users should be created by seed data or a trusted database/admin process.
const allowedRoles = new Set(["employer", "job_seeker"]);

// Email validation regex
const emailRegex =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// JWTs store only the minimum identity required.
const signToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );

// Never expose password hashes.
const publicUserFields = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  created_at: user.created_at,
  updated_at: user.updated_at,
});

const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({
      message: "Name, email, password, and role are required",
    });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message:
        "Email must be a valid email format (e.g., user@example.com)",
    });
  }

  if (!allowedRoles.has(role)) {
    return res.status(400).json({
      message:
        "Registration role must be employer or job_seeker",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message:
        "Password must be at least 6 characters",
    });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    try {
      const pool = await getPool();
      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        // Check if the email already exists.
        const existing = await client.query(
          "SELECT id FROM users WHERE email = $1 LIMIT 1",
          [email]
        );

        if (existing.rows.length > 0) {
          await client.query("ROLLBACK");
          client.release();

          return res.status(409).json({
            message: "Email is already registered",
          });
        }

        // Create the user.
        const result = await client.query(
          `
          INSERT INTO users
          (name, email, password, role, status)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
          `,
          [
            name,
            email,
            hash,
            role,
            "active",
          ]
        );

        const userId = result.rows[0].id;
        // Create the corresponding profile based on the user's role.
        if (role === "employer") {
          await client.query(
            `
            INSERT INTO employer_profiles
            (
              user_id,
              company_name,
              company_description,
              industry,
              location,
              phone,
              website
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            `,
            [
              userId,
              `${name}'s Company`,
              null,
              null,
              null,
              null,
              null,
            ]
          );
        } else {
          await client.query(
            `
            INSERT INTO job_seeker_profiles
            (
              user_id,
              phone,
              location,
              skills,
              education,
              experience_level,
              cv_file
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            `,
            [
              userId,
              null,
              null,
              null,
              null,
              null,
              null,
            ]
          );
        }

        // Retrieve the newly created user.
        const userResult = await client.query(
          `
          SELECT
            id,
            name,
            email,
            role,
            status,
            created_at,
            updated_at
          FROM users
          WHERE id = $1
          `,
          [userId]
        );

        await client.query("COMMIT");

        client.release();

        return res.status(201).json({
          user: publicUserFields(userResult.rows[0]),
          token: signToken(userResult.rows[0]),
        });
      } catch (transactionError) {
        await client.query("ROLLBACK");
        client.release();
        throw transactionError;
      }
    } catch (dbError) {
      // Fallback to JSON store if the database is unavailable.
      const fallbackUser = createUser({
        name,
        email,
        passwordHash: hash,
        role,
        status: "active",
      });

      if (!fallbackUser) {
        return res.status(409).json({
          message: "Email is already registered",
        });
      }

      return res.status(201).json({
        user: publicUserFields(fallbackUser),
        token: signToken(fallbackUser),
      });
    }
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  try {
    try {
      const pool = await getPool();

      const result = await pool.query(
        "SELECT * FROM users WHERE email = $1 LIMIT 1",
        [email]
      );

      const user = result.rows[0];
      if (!user) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      const passwordMatch = await bcrypt.compare(
        password,
        user.password
      );

      if (!passwordMatch) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      if (user.status !== "active") {
        return res.status(403).json({
          message: "User account is inactive",
        });
      }

      return res.json({
        user: publicUserFields(user),
        token: signToken(user),
      });
    } catch (dbError) {
      // Fallback to JSON store if the database is unavailable.
      const fallbackUser = getUserByEmail(email);

      if (!fallbackUser) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      const passwordMatch = await bcrypt.compare(
        password,
        fallbackUser.password
      );

      if (!passwordMatch) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      if (fallbackUser.status !== "active") {
        return res.status(403).json({
          message: "User account is inactive",
        });
      }

      return res.json({
        user: publicUserFields(fallbackUser),
        token: signToken(fallbackUser),
      });
    }
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
};

const me = async (req, res) => {
  // req.user is populated by the authentication middleware.
  res.json({
    user: req.user,
  });
};

module.exports = {
  register,
  login,
  me,
};
