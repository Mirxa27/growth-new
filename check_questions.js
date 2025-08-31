import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQuestions() {
  try {
    console.log('Checking questions for personality assessments...');

    // Get the personality assessments
    const { data: assessments, error: assessmentsError } = await supabase
      .from('assessments')
      .select('id, title')
      .eq('type', 'personality')
      .order('created_at', { ascending: false })
      .limit(2);

    if (assessmentsError) {
      console.error('Error fetching assessments:', assessmentsError);
      return;
    }

    for (const assessment of assessments) {
      console.log(`\nAssessment: ${assessment.title}`);

      // Get questions for this assessment
      const { data: questions, error: questionsError } = await supabase
        .from('assessment_questions')
        .select('id, question_text, question_type, position')
        .eq('assessment_id', assessment.id)
        .order('position', { ascending: true });

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        continue;
      }

      console.log(`Questions (${questions.length}):`);
      questions.forEach(question => {
        console.log(`  ${question.position}. ${question.question_text} (${question.question_type})`);
      });

      // Get options for the first question
      if (questions.length > 0) {
        const firstQuestion = questions[0];
        const { data: options, error: optionsError } = await supabase
          .from('assessment_options')
          .select('option_text, position, scoring_data')
          .eq('question_id', firstQuestion.id)
          .order('position', { ascending: true });

        if (optionsError) {
          console.error('Error fetching options:', optionsError);
        } else {
          console.log(`  Options for question ${firstQuestion.position}:`);
          options.forEach(option => {
            console.log(`    ${option.position}. ${option.option_text} (scoring: ${option.scoring_data})`);
          });
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkQuestions();
