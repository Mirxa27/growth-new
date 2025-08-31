import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAssessments() {
  try {
    console.log('Checking assessments in database...');

    const { data, error } = await supabase
      .from('assessments')
      .select('id, title, type, visibility')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching assessments:', error);
      return;
    }

    console.log('Latest assessments:');
    data.forEach(assessment => {
      console.log(`- ${assessment.title} (${assessment.type}, ${assessment.visibility})`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

checkAssessments();
