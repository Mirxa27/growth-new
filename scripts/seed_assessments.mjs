import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const publicAssessments = [
  { title: 'Emotional Intelligence Assessment', description: 'Discover your emotional intelligence strengths and areas for growth.', type: 'quiz', visibility: 'public', ai_provider: 'openai', ai_model: 'gpt-4o-mini' },
  { title: 'Leadership Style Assessment', description: 'Identify your natural leadership approach and communication style.', type: 'personality', visibility: 'public', ai_provider: 'openai', ai_model: 'gpt-4o-mini' },
  { title: 'Stress Management Knowledge Quiz', description: 'Test your knowledge of effective stress management techniques.', type: 'quiz', visibility: 'public', ai_provider: 'openai', ai_model: 'gpt-4o-mini' },
  { title: 'Communication Patterns Assessment', description: 'Understand how you naturally communicate and connect with others.', type: 'personality', visibility: 'public', ai_provider: 'openai', ai_model: 'gpt-4o-mini' },
  { title: 'Personal Values Assessment', description: 'Explore your core values and decision drivers.', type: 'personality', visibility: 'public', ai_provider: 'openai', ai_model: 'gpt-4o-mini' },
  { title: 'Mindfulness & Wellbeing Quiz', description: 'Assess your mindfulness practices and wellbeing habits.', type: 'quiz', visibility: 'public', ai_provider: 'openai', ai_model: 'gpt-4o-mini' }
];

const privateAssessments = [
  'Career Clarity Assessment',
  'Professional Development Roadmap',
  'Work-Life Balance Assessment',
  'Leadership Potential Assessment',
  'Relationship Patterns Assessment',
  'Social Connection Style',
  'Conflict Resolution Style',
  'Communication in Relationships',
  'Personal Growth Readiness',
  'Self-Compassion Assessment',
  'Personal Boundaries Assessment',
  'Resilience & Recovery Assessment',
  'Life Satisfaction Assessment',
  'Productivity Style Assessment',
  'Time Management Style',
  'Goal Setting & Achievement',
  'Habit Formation Assessment',
  'Financial Mindset Assessment',
  'Decision Making Process',
  'Adaptability & Change Assessment',
  'Motivation Drivers Assessment',
  'Creativity & Innovation Style',
  'Learning Style Assessment',
  'Mental Health & Wellbeing Check',
  'Energy Management Assessment'
].slice(0, 20).map(title => ({
  title,
  description: title,
  type: 'personality',
  visibility: 'private',
  ai_provider: 'openai',
  ai_model: 'gpt-4o-mini'
}));

async function upsertAssessments(list) {
  for (const item of list) {
    const { error } = await supabase
      .from('assessments')
      .upsert(item, { onConflict: 'title' });
    if (error) {
      console.error('Upsert error:', item.title, error.message);
    } else {
      console.log('Upserted:', item.title);
    }
  }
}

async function run() {
  console.log('Seeding public assessments...');
  await upsertAssessments(publicAssessments);
  console.log('Seeding private assessments...');
  await upsertAssessments(privateAssessments);
  console.log('Done.');
}

run().catch(err => { console.error(err); process.exit(1); });

