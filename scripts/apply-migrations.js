import pg from 'pg';
const { Pool } = pg;

const dbUrl = 'postgresql://postgres:Mirxa420$@db.ufgqmqoykddaotdbwteg.supabase.co:5432/postgres';

async function applyMigrations() {
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    family: 4 // Force IPv4
  });

  try {
    // Read and execute the migration for community posts relationship
    const migration = `
      -- Add foreign key relationship between community_posts and profiles
      ALTER TABLE IF EXISTS public.community_posts
      ADD CONSTRAINT IF NOT EXISTS fk_community_posts_user
      FOREIGN KEY (user_id) 
      REFERENCES auth.users(id)
      ON DELETE CASCADE;

      -- Create a view that joins community posts with profiles
      CREATE OR REPLACE VIEW public.community_posts_with_profiles AS
      SELECT 
        cp.*,
        p.display_name,
        p.avatar_url
      FROM public.community_posts cp
      LEFT JOIN public.profiles p ON cp.user_id = p.id;

      -- Grant access to the view
      GRANT SELECT ON public.community_posts_with_profiles TO authenticated;
      GRANT SELECT ON public.community_posts_with_profiles TO anon;

      -- Update RLS policy for the view
      DROP POLICY IF EXISTS "Anyone can view approved public posts with profiles" ON public.community_posts_with_profiles;
      CREATE POLICY "Anyone can view approved public posts with profiles"
      ON public.community_posts_with_profiles
      FOR SELECT
      USING (is_approved = true AND visibility = 'public');
    `;

    await pool.query(migration);
    console.log('Migration applied successfully!');
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyMigrations();
