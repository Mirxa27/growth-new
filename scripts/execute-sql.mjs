import pg from 'pg';
import fs from 'fs/promises';
import path from 'path';

const { Pool } = pg;

async function executeSql() {
  // Configure SSL settings
  const ssl = {
    rejectUnauthorized: false,
    ca: process.env.SSL_CERT
  };

  // Create connection pool with SSL
  const pool = new Pool({
    user: 'postgres',
    password: 'Mirxa420$',
    host: 'db.ufgqmqoykddaotdbwteg.supabase.co',
    port: 5432,
    database: 'postgres',
    ssl: ssl,
    family: 4 // Force IPv4
  });

  try {
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', '20250904073000_fix_community_posts_view.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');

    // Execute the SQL
    console.log('Executing SQL...');
    await pool.query(sqlContent);
    console.log('SQL executed successfully!');
  } catch (error) {
    console.error('Error executing SQL:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

executeSql();
