import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

async function executeSql() {
  const supabase = createClient(
    'https://ufgqmqoykddaotdbwteg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA2MzY4MSwiZXhwIjoyMDY3NjM5NjgxfQ.ly1DdFt60DSLEUMtK5l0jr1G3TLiJnPohADSc4HZuwo'
  );

  try {
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', '20250904073000_fix_community_posts_view.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');

    // Split the SQL into individual statements
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());

    console.log('Executing SQL statements...');
    
    // Execute each statement
    for (const stmt of statements) {
      const { error } = await supabase.rpc('exec_sql', { sql: stmt.trim() });
      if (error) throw error;
    }
    
    console.log('SQL executed successfully!');
  } catch (error) {
    console.error('Error executing SQL:', error);
    process.exit(1);
  }
}

executeSql();
