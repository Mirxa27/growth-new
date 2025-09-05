import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://ufgqmqoykddaotdbwteg.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA2MzY4MSwiZXhwIjoyMDY3NjM2NjgxfQ.ly1DdFt60DSLEUMtK5l0jr1G3TLiJnPohADSc4HZuwo'
);

async function addMissingOptions() {
  console.log('🔧 Adding missing options for Life Purpose Explorer assessment...');
  
  try {
    // Options for Question 6: "When you imagine your ideal life 5 years from now, what aspect excites you most?"
    const question6Options = [
      {
        question_id: 6,
        option_text: 'The meaningful impact I\'ll have on others',
        position: 1,
        score_value: 3
      },
      {
        question_id: 6,
        option_text: 'The creative projects I\'ll have completed',
        position: 2,
        score_value: 2
      },
      {
        question_id: 6,
        option_text: 'The personal growth and wisdom I\'ll have gained',
        position: 3,
        score_value: 4
      },
      {
        question_id: 6,
        option_text: 'The financial freedom and stability I\'ll enjoy',
        position: 4,
        score_value: 1
      }
    ];
    
    // Options for Question 7: "What activities make you lose track of time because you enjoy them so much?"
    const question7Options = [
      {
        question_id: 7,
        option_text: 'Learning new skills or exploring ideas',
        position: 1,
        score_value: 2
      },
      {
        question_id: 7,
        option_text: 'Creating art, writing, or other creative work',
        position: 2,
        score_value: 4
      },
      {
        question_id: 7,
        option_text: 'Helping others solve problems or feel better',
        position: 3,
        score_value: 3
      },
      {
        question_id: 7,
        option_text: 'Building or organizing systems and processes',
        position: 4,
        score_value: 1
      }
    ];
    
    // Insert options for question 6
    const { data: q6Results, error: q6Error } = await supabase
      .from('assessment_options')
      .insert(question6Options);
    
    if (q6Error) {
      console.error('❌ Error inserting options for question 6:', q6Error.message);
    } else {
      console.log('✅ Added 4 options for question 6');
    }
    
    // Insert options for question 7
    const { data: q7Results, error: q7Error } = await supabase
      .from('assessment_options')
      .insert(question7Options);
    
    if (q7Error) {
      console.error('❌ Error inserting options for question 7:', q7Error.message);
    } else {
      console.log('✅ Added 4 options for question 7');
    }
    
    console.log('🎉 Successfully added missing options for Life Purpose Explorer assessment!');
    
  } catch (error) {
    console.error('❌ Error adding options:', error.message);
  }
}

addMissingOptions();
