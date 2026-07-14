const { Pool } = require("pg");
require("dotenv").config();

let pool = null;

const createPool = async () => {
  if (pool) return pool;

  try {
    pool = new Pool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT),

      ssl:
        process.env.DB_SSL === "true"
          ? { rejectUnauthorized: false }
          : false,

      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Test the connection
    await pool.query("SELECT NOW()");

    console.log("Database connected successfully");

    return pool;
  } catch (error) {
    console.error("DATABASE CONNECTION ERROR");
    console.error(error);
    throw error;
  }
};

const getPool = async () => {
  if (!pool) {
    await createPool();
  }
  return pool;
};

module.exports = {
  createPool,
  getPool,
};