import { Client } from 'pg';
import fs from 'fs/promises';
import path from 'path';

const DATABASE_URL = process.env.SUPABASE_DB_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';

async function run() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const migrationsDir = path.resolve(process.cwd(), 'supabase', 'migrations');
  const files = (await fs.readdir(migrationsDir)).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
    process.stdout.write(`\nApplying ${file}...\n`);
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      process.stdout.write(`OK ${file}\n`);
    } catch (e) {
      await client.query('ROLLBACK');
      process.stdout.write(`FAILED ${file}: ${e.message}\n`);
    }
  }
  await client.end();
}

run().catch(err => { console.error(err); process.exit(1); });

