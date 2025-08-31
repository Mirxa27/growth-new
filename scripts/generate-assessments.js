#!/usr/bin/env node

/**
 * Script to generate assessments using the Supabase Edge Function
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Public assessments to generate (free, no signup required)
const publicAssessments = [
  {
    topic: 'Emotional Intelligence',
    type: 'personality',
    visibility: 'public',
    questions: 15,
    description: 'Discover your emotional intelligence strengths and areas for growth'
  },
  {
    topic: 'Leadership Style',
    type: 'personality', 
    visibility: 'public',
    questions: 12,
    description: 'Identify your natural leadership approach and communication style'
  },
  {
    topic: 'Stress Management',
    type: 'quiz',
    visibility: 'public',
    questions: 10,
    description: 'Test your knowledge of effective stress management techniques'
  },
  {
    topic: 'Communication Patterns',
    type: 'personality',
    visibility: 'public',
    questions: 14,
    description: 'Understand how you naturally communicate and connect with others'
  },
  {
    topic: 'Personal Values Assessment',
    type: 'personality',
    visibility: 'public',
    questions: 16,
    description: 'Explore your core values and what drives your decisions'
  },
  {
    topic: 'Mindfulness & Wellbeing',
    type: 'quiz',
    visibility: 'public',
    questions: 12,
    description: 'Assess your current mindfulness practices and wellbeing habits'
  }
];

// User assessments to generate (require login)
const userAssessments = [
  { topic: 'Career Clarity', type: 'personality', visibility: 'private', questions: 18 },
  { topic: 'Relationship Patterns', type: 'personality', visibility: 'private', questions: 16 },
  { topic: 'Financial Mindset', type: 'personality', visibility: 'private', questions: 14 },
  { topic: 'Creativity & Innovation', type: 'personality', visibility: 'private', questions: 15 },
  { topic: 'Time Management Style', type: 'personality', visibility: 'private', questions: 13 },
  { topic: 'Conflict Resolution', type: 'quiz', visibility: 'private', questions: 12 },
  { topic: 'Personal Growth Readiness', type: 'personality', visibility: 'private', questions: 17 },
  { topic: 'Social Connection Style', type: 'personality', visibility: 'private', questions: 15 },
  { topic: 'Decision Making Process', type: 'personality', visibility: 'private', questions: 14 },
  { topic: 'Life Satisfaction', type: 'personality', visibility: 'private', questions: 16 },
  { topic: 'Goal Setting & Achievement', type: 'quiz', visibility: 'private', questions: 13 },
  { topic: 'Learning Style', type: 'personality', visibility: 'private', questions: 12 },
  { topic: 'Adaptability & Change', type: 'personality', visibility: 'private', questions: 15 },
  { topic: 'Self-Compassion', type: 'personality', visibility: 'private', questions: 14 },
  { topic: 'Productivity Habits', type: 'quiz', visibility: 'private', questions: 11 },
  { topic: 'Motivation Drivers', type: 'personality', visibility: 'private', questions: 16 },
  { topic: 'Communication in Relationships', type: 'personality', visibility: 'private', questions: 17 },
  { topic: 'Work-Life Balance', type: 'personality', visibility: 'private', questions: 15 },
  { topic: 'Personal Boundaries', type: 'personality', visibility: 'private', questions: 13 },
  { topic: 'Resilience & Recovery', type: 'personality', visibility: 'private', questions: 18 }
];

async function generateAssessment(assessmentConfig) {
  try {
    console.log(`Generating: ${assessmentConfig.topic}...`);
    
    const { data, error } = await supabase.functions.invoke('create-assessment', {
      body: {
        topic: assessmentConfig.topic,
        type: 'test', // Use 'test' for generation
        provider: 'openai',
        model: 'gpt-4o-mini',
        questionCount: assessmentConfig.questions,
        customPrompt: assessmentConfig.type === 'personality'
          ? `Generate ${assessmentConfig.questions} questions for a personality assessment about ${assessmentConfig.topic}. Each question should have 4 options that reflect different personality traits or approaches. Options should not have a "correct" answer but represent different valid perspectives or styles. Include a mix of scenario-based and preference-based questions.`
          : `Generate ${assessmentConfig.questions} quiz questions about ${assessmentConfig.topic}. Each question should have 4 options with one clearly correct answer. Include practical knowledge, tips, and evidence-based information. Make the questions educational and actionable.`
      }
    });

    if (error) {
      console.error(`Error generating ${assessmentConfig.topic}:`, error);
      return null;
    }

    // Save the generated assessment to the database
    const { error: saveError } = await supabase.rpc('create_assessment_with_questions', {
      _title: data.generated_content.title,
      _description: assessmentConfig.description || data.generated_content.description,
      _type: assessmentConfig.type,
      _visibility: assessmentConfig.visibility,
      _ai_provider: 'openai',
      _ai_model: 'gpt-4o-mini',
      _ai_prompt: `Generated assessment on the topic: ${assessmentConfig.topic}`,
      _questions: data.generated_content.questions
    });

    if (saveError) {
      console.error(`Error saving ${assessmentConfig.topic}:`, saveError);
      return null;
    }

    console.log(`✓ Successfully generated: ${assessmentConfig.topic}`);
    return data;
  } catch (error) {
    console.error(`Error with ${assessmentConfig.topic}:`, error);
    return null;
  }
}

async function generateAllAssessments() {
  console.log('🚀 Starting assessment generation...');
  console.log(`📊 Generating ${publicAssessments.length} public assessments...`);
  
  // Generate public assessments
  for (const assessment of publicAssessments) {
    await generateAssessment(assessment);
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`🔒 Generating ${userAssessments.length} user assessments...`);
  
  // Generate user assessments
  for (const assessment of userAssessments) {
    await generateAssessment(assessment);
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('✨ Assessment generation complete!');
  console.log(`📈 Total generated: ${publicAssessments.length + userAssessments.length} assessments`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateAllAssessments().catch(console.error);
}

export { generateAllAssessments, generateAssessment };