import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sampleAssessments = [
  {
    title: "Personal Values Discovery",
    description: "Discover what truly matters to you and align your life with your core values.",
    category: "values",
    type: "exploration",
    estimated_duration: 15,
    is_public: true,
    created_by: null, // Will be set to admin user if available
    questions: [
      {
        text: "What motivates you most in your daily life?",
        type: "single",
        options: ["Personal growth", "Helping others", "Achievement", "Financial security"],
        required: true,
        order_index: 0
      },
      {
        text: "Which values are most important to you?",
        type: "multiple", 
        options: ["Honesty", "Creativity", "Stability", "Adventure", "Family", "Independence"],
        required: true,
        order_index: 1
      },
      {
        text: "How important is work-life balance to you?",
        type: "scale",
        scale: {
          min: 1,
          max: 10,
          labels: ["Not important", "Extremely important"]
        },
        required: true,
        order_index: 2
      },
      {
        text: "Describe a time when you felt most fulfilled:",
        type: "text",
        required: false,
        order_index: 3
      }
    ]
  },
  {
    title: "Leadership Style Assessment",
    description: "Understand your natural leadership tendencies and areas for growth.",
    category: "leadership",
    type: "quiz",
    estimated_duration: 20,
    is_public: true,
    created_by: null,
    questions: [
      {
        text: "How do you prefer to make decisions?",
        type: "single",
        options: ["Quickly and decisively", "After consulting others", "With careful analysis", "Collaboratively"],
        required: true,
        order_index: 0
      },
      {
        text: "What leadership qualities do you possess?",
        type: "multiple",
        options: ["Empathy", "Decisiveness", "Vision", "Communication", "Resilience", "Adaptability"],
        required: true,
        order_index: 1
      },
      {
        text: "How comfortable are you with conflict?",
        type: "scale",
        scale: {
          min: 1,
          max: 10,
          labels: ["Very uncomfortable", "Very comfortable"]
        },
        required: true,
        order_index: 2
      }
    ]
  },
  {
    title: "Emotional Intelligence Check-in",
    description: "Assess your emotional awareness and relationship skills.",
    category: "emotional-intelligence",
    type: "exploration",
    estimated_duration: 12,
    is_public: true,
    created_by: null,
    questions: [
      {
        text: "How well do you recognize your own emotions?",
        type: "scale",
        scale: {
          min: 1,
          max: 10,
          labels: ["Not well at all", "Extremely well"]
        },
        required: true,
        order_index: 0
      },
      {
        text: "Which emotions do you find most challenging to manage?",
        type: "multiple",
        options: ["Anger", "Sadness", "Anxiety", "Frustration", "Disappointment", "Fear"],
        required: true,
        order_index: 1
      },
      {
        text: "How do you typically respond to stress?",
        type: "single",
        options: ["Take time to reflect", "Talk to someone", "Stay busy", "Avoid the situation"],
        required: true,
        order_index: 2
      }
    ]
  }
];

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing test data (optional)
    console.log('Clearing existing test assessments...');
    await supabase
      .from('assessments')
      .delete()
      .ilike('title', '%Discovery%')
      .or('title.ilike.%Leadership%,title.ilike.%Emotional%');

    // Insert assessments
    for (const assessment of sampleAssessments) {
      console.log(`📝 Creating assessment: ${assessment.title}`);
      
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          title: assessment.title,
          description: assessment.description,
          category: assessment.category,
          type: assessment.type,
          visibility: assessment.is_public ? 'public' : 'private',
          created_by: assessment.created_by
        })
        .select()
        .single();

      if (assessmentError) {
        console.error(`❌ Error creating assessment ${assessment.title}:`, assessmentError);
        continue;
      }

      console.log(`✅ Created assessment: ${assessmentData.id}`);

      // Insert questions for this assessment
      for (const question of assessment.questions) {
        const { data: questionData, error: questionError } = await supabase
          .from('assessment_questions')
          .insert({
            assessment_id: assessmentData.id,
            question_text: question.text,
            question_type: question.type === 'single' ? 'multiple_choice' : 
                          question.type === 'text' ? 'free_text' : 'multiple_choice',
            position: question.order_index,
            points: 1
          })
          .select()
          .single();

        if (questionError) {
          console.error(`❌ Error creating question for ${assessment.title}:`, questionError);
          continue;
        }

        // Insert options for multiple choice questions
        if (question.options && (question.type === 'single' || question.type === 'multiple')) {
          for (let i = 0; i < question.options.length; i++) {
            const { error: optionError } = await supabase
              .from('assessment_options')
              .insert({
                question_id: questionData.id,
                option_text: question.options[i],
                is_correct: false, // For assessments, there might not be "correct" answers
                position: i
              });

            if (optionError) {
              console.error(`❌ Error creating option for question:`, optionError);
            }
          }
        }
      }

      console.log(`✅ Created ${assessment.questions.length} questions for ${assessment.title}`);
    }

    console.log('🎉 Database seeding completed successfully!');
    
    // Verify the data
    const { data: assessmentCount, error: countError } = await supabase
      .from('assessments')
      .select('id', { count: 'exact', head: true });

    if (!countError) {
      console.log(`📊 Total assessments in database: ${assessmentCount?.length || 0}`);
    }

  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding
seedDatabase();
