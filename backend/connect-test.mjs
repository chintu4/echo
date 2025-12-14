import 'dotenv/config';
import { createConnection } from 'mysql2/promise';

(async () => {
  try {
    const conn = await createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT || 3306),
      connectTimeout: 10000
    });
    console.log('Node mysql2 connection successful');
    await conn.end();
  } catch (err) {
    console.error('Node mysql2 connection failed:', err);
  }
})();
