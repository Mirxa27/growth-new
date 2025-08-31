import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  try {
    console.log('Checking assessment_questions table structure...');

    // Get a sample row to see the structure
    const { data, error } = await supabase
      .from('assessment_questions')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error fetching table structure:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('Table columns:', Object.keys(data[0]));
    } else {
      console.log('No data found in assessment_questions table');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkTableStructure();
