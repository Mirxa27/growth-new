import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function combineMigrations() {
  console.log('📦 Generating combined migration file...');

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const outputFile = path.join(__dirname, '..', 'COMPLETE_MIGRATION.sql');

  try {
    const allFiles = await fs.readdir(migrationsDir);
    const migrationFiles = allFiles
      .filter(file => file.endsWith('.sql'))
      .sort();

    let combinedSql = '-- Combined Migrations for Production Deployment\n';
    combinedSql += '-- Generated on ' + new Date().toISOString() + '\n\n';

    for (const file of migrationFiles) {
      const sqlContent = await fs.readFile(path.join(migrationsDir, file), 'utf8');
      combinedSql += `-- =====================================\n`;
      combinedSql += `-- Migration: ${file}\n`;
      combinedSql += `-- =====================================\n\n`;
      combinedSql += sqlContent;
      combinedSql += '\n\n';
    }

    await fs.writeFile(outputFile, combinedSql);
    console.log(`✅ Combined migration file created: ${outputFile}`);
    console.log('📋 Please execute the contents of this file in your Supabase SQL editor to apply all migrations.');
  } catch (error) {
    console.error('❌ Error generating combined migration file:', error.message);
  }
}

combineMigrations();