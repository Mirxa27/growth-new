/**
 * Database Seeding Script
 * Seeds the database with sample assessment data
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ufgqmqoykddaotdbwteg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjM2ODEsImV4cCI6MjA2NzYzOTY4MX0.GLz_6uDKKWkpO0SNwevp7oZc3CNOkv4Rr5p-ObWyX8M';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedAssessments() {
  console.log('🌱 Starting assessment seeding...');

  try {
    // Insert sample assessments
    const { data: assessments, error: assessmentError } = await supabase
      .from('assessments')
      .insert([
        {
          title: 'Personality Discovery Assessment',
          description: 'Discover your core personality traits and understand what makes you unique. This comprehensive assessment analyzes your behavior patterns, preferences, and tendencies.',
          visibility: 'public',
          type: 'exploration',
          difficulty: 'beginner',
          category: 'personality',
          ai_provider: 'openai',
          ai_model: 'gpt-4'
        },
        {
          title: 'Career Path Exploration',
          description: 'Find your ideal career path based on your interests, skills, and personality. This assessment helps you identify careers that align with your strengths.',
          visibility: 'public',
          type: 'exploration',
          difficulty: 'intermediate',
          category: 'career',
          ai_provider: 'openai',
          ai_model: 'gpt-4'
        },
        {
          title: 'Learning Style Assessment',
          description: 'Identify how you learn best and optimize your study strategies. Understand whether you are a visual, auditory, kinesthetic, or reading/writing learner.',
          visibility: 'public',
          type: 'quiz',
          difficulty: 'beginner',
          category: 'learning',
          ai_provider: 'openai',
          ai_model: 'gpt-4'
        },
        {
          title: 'Emotional Intelligence Test',
          description: 'Assess your emotional awareness and interpersonal skills. Understand your ability to recognize, understand, and manage emotions.',
          visibility: 'public',
          type: 'test',
          difficulty: 'intermediate',
          category: 'skills',
          ai_provider: 'openai',
          ai_model: 'gpt-4'
        },
        {
          title: 'Stress Management Evaluation',
          description: 'Evaluate your current stress levels and coping mechanisms. Learn about your stress triggers and effective management strategies.',
          visibility: 'public',
          type: 'exploration',
          difficulty: 'beginner',
          category: 'wellness',
          ai_provider: 'openai',
          ai_model: 'gpt-4'
        }
      ])
      .select();

    if (assessmentError) {
      throw assessmentError;
    }

    console.log('✅ Assessments inserted:', assessments?.length || 0);

    // Insert questions for the first assessment (Personality Discovery)
    if (assessments && assessments.length > 0) {
      const personalityAssessmentId = assessments[0].id;
      
      const { data: questions, error: questionError } = await supabase
        .from('assessment_questions')
        .insert([
          {
            assessment_id: personalityAssessmentId,
            question_text: 'In social situations, you tend to:',
            question_type: 'multiple_choice',
            position: 1,
            points: 1
          },
          {
            assessment_id: personalityAssessmentId,
            question_text: 'When making decisions, you primarily rely on:',
            question_type: 'multiple_choice',
            position: 2,
            points: 1
          },
          {
            assessment_id: personalityAssessmentId,
            question_text: 'Your ideal weekend involves:',
            question_type: 'multiple_choice',
            position: 3,
            points: 1
          },
          {
            assessment_id: personalityAssessmentId,
            question_text: 'When faced with unexpected changes, you:',
            question_type: 'multiple_choice',
            position: 4,
            points: 1
          },
          {
            assessment_id: personalityAssessmentId,
            question_text: 'In group projects, you naturally take on the role of:',
            question_type: 'multiple_choice',
            position: 5,
            points: 1
          }
        ])
        .select();

      if (questionError) {
        throw questionError;
      }

      console.log('✅ Questions inserted:', questions?.length || 0);

      // Insert options for the first question
      if (questions && questions.length > 0) {
        const firstQuestionId = questions[0].id;
        
        const { data: options, error: optionError } = await supabase
          .from('assessment_options')
          .insert([
            {
              question_id: firstQuestionId,
              option_text: 'Initiate conversations with new people',
              is_correct: false,
              position: 1,
              score_value: 4
            },
            {
              question_id: firstQuestionId,
              option_text: 'Wait for others to approach you',
              is_correct: false,
              position: 2,
              score_value: 1
            },
            {
              question_id: firstQuestionId,
              option_text: 'Prefer small groups over large gatherings',
              is_correct: false,
              position: 3,
              score_value: 2
            },
            {
              question_id: firstQuestionId,
              option_text: 'Avoid social situations when possible',
              is_correct: false,
              position: 4,
              score_value: 1
            }
          ])
          .select();

        if (optionError) {
          throw optionError;
        }

        console.log('✅ Options inserted:', options?.length || 0);
      }

      // Add options for second question
      if (questions && questions.length > 1) {
        const secondQuestionId = questions[1].id;
        
        await supabase
          .from('assessment_options')
          .insert([
            {
              question_id: secondQuestionId,
              option_text: 'Logic and objective analysis',
              is_correct: false,
              position: 1,
              score_value: 3
            },
            {
              question_id: secondQuestionId,
              option_text: 'Your gut feelings and intuition',
              is_correct: false,
              position: 2,
              score_value: 2
            },
            {
              question_id: secondQuestionId,
              option_text: 'Input from trusted friends/family',
              is_correct: false,
              position: 3,
              score_value: 2
            },
            {
              question_id: secondQuestionId,
              option_text: 'Practical considerations and past experiences',
              is_correct: false,
              position: 4,
              score_value: 3
            }
          ]);
      }

      // Add options for third question
      if (questions && questions.length > 2) {
        const thirdQuestionId = questions[2].id;
        
        await supabase
          .from('assessment_options')
          .insert([
            {
              question_id: thirdQuestionId,
              option_text: 'Adventure and new experiences',
              is_correct: false,
              position: 1,
              score_value: 4
            },
            {
              question_id: thirdQuestionId,
              option_text: 'Relaxation and quiet time',
              is_correct: false,
              position: 2,
              score_value: 1
            },
            {
              question_id: thirdQuestionId,
              option_text: 'Socializing with friends',
              is_correct: false,
              position: 3,
              score_value: 3
            },
            {
              question_id: thirdQuestionId,
              option_text: 'Productive activities and learning',
              is_correct: false,
              position: 4,
              score_value: 2
            }
          ]);
      }

      // Add options for fourth question
      if (questions && questions.length > 3) {
        const fourthQuestionId = questions[3].id;
        
        await supabase
          .from('assessment_options')
          .insert([
            {
              question_id: fourthQuestionId,
              option_text: 'Embrace the change enthusiastically',
              is_correct: false,
              position: 1,
              score_value: 4
            },
            {
              question_id: fourthQuestionId,
              option_text: 'Feel anxious but adapt quickly',
              is_correct: false,
              position: 2,
              score_value: 2
            },
            {
              question_id: fourthQuestionId,
              option_text: 'Need time to process and adjust',
              is_correct: false,
              position: 3,
              score_value: 1
            },
            {
              question_id: fourthQuestionId,
              option_text: 'Prefer to stick to original plans',
              is_correct: false,
              position: 4,
              score_value: 1
            }
          ]);
      }

      // Add options for fifth question
      if (questions && questions.length > 4) {
        const fifthQuestionId = questions[4].id;
        
        await supabase
          .from('assessment_options')
          .insert([
            {
              question_id: fifthQuestionId,
              option_text: 'The leader coordinating the team',
              is_correct: false,
              position: 1,
              score_value: 4
            },
            {
              question_id: fifthQuestionId,
              option_text: 'The creative contributor generating ideas',
              is_correct: false,
              position: 2,
              score_value: 3
            },
            {
              question_id: fifthQuestionId,
              option_text: 'The detail-oriented organizer',
              is_correct: false,
              position: 3,
              score_value: 2
            },
            {
              question_id: fifthQuestionId,
              option_text: 'The supportive mediator between team members',
              is_correct: false,
              position: 4,
              score_value: 2
            }
          ]);
      }

      console.log('✅ All options inserted for personality assessment');
    }

    console.log('🎉 Seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seeding function
seedAssessments()
  .then(() => {
    console.log('✅ Database seeded successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
