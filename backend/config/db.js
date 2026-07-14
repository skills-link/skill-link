const { Pool } = require('pg');

// PostgreSQL connection pool.
// Prefer a single DATABASE_URL (e.g. from Render/Heroku/Neon/Supabase), but
// fall back to discrete PG* / DB_* env vars for local development.
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl:
          process.env.DB_SSL === 'true'
            ? { rejectUnauthorized: false }
            : false
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jobboard',
        ssl:
          process.env.DB_SSL === 'true'
            ? { rejectUnauthorized: false }
            : false
      }
);

pool.on('error', (err) => {
  // Errors on idle clients shouldn't crash the process.
  console.error('Unexpected PostgreSQL pool error', err);
});

// Some controllers need a dedicated client for multi-statement transactions
// (BEGIN / COMMIT / ROLLBACK). Everyone else can just call pool.query(...)
// directly, since `pool` itself is exported below.
const getPool = async () => pool;

module.exports = pool;
module.exports.pool = pool;
module.exports.getPool = getPool;
