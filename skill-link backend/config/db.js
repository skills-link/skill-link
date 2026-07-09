const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

const createPool = async () => {
  if (pool) return pool;

  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'jobconnect',
      port: Number(process.env.DB_PORT || 3306),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return pool;
  } catch (error) {
    console.warn('Database unavailable, using local auth fallback:', error.message);
    return null;
  }
};

const query = async (...args) => {
  const activePool = await createPool();
  if (!activePool) {
    throw new Error('Database unavailable');
  }
  return activePool.query(...args);
};

const getConnection = async () => {
  const activePool = await createPool();
  if (!activePool) {
    throw new Error('Database unavailable');
  }
  return activePool.getConnection();
};

module.exports = { query, getConnection, createPool };
