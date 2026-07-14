const createPool = async () => {
  if (pool) return pool;

  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT),

      ssl: {
        rejectUnauthorized: true
      },

      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    console.log("Database connected successfully");

    return pool;

  } catch (error) {
    console.error("DATABASE CONNECTION ERROR");
    console.error(error);
    throw error;
  }
};