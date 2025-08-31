import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Use Node-safe Supabase client (do NOT import browser client.ts - it requires localStorage/import.meta)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Note on schema compatibility:
// - assessments: we insert only known-safe columns: title, description, type, visibility
// - assessment_questions: columns: id, assessment_id, question_text, question_type, position, media_url, created_at
// - assessment_options: columns: id, question_id, option_text, is_correct, feedback, position, created_at, scoring_data
//   (score_value/explanation columns are NOT used to avoid schema mismatch errors)

// Free Assessments Data Structure (6 assessments per reference.md)
const freeAssessments = [
  {
    title: 'Core Personality Discovery',
    description:
      'Uncover your authentic personality type with this comprehensive assessment. Discover your natural tendencies, communication style, and core motivations to better understand yourself and others.',
    type: 'test',
    visibility: 'public',
    questions: [
      {
        text: 'When meeting new people at a social gathering, you typically:',
        type: 'multiple_choice',
        options: [
          { text: 'First take time to observe the people and environment', feedback: 'Shows thoughtful, observational approach' },
          { text: "Automatically know who you'll connect with and approach confidently", feedback: 'Indicates outgoing, socially intuitive nature' },
          { text: 'Start conversations immediately to build connections', feedback: 'Suggests confident, socially active personality' },
          { text: 'Maintain a comfortable distance while assessing the situation', feedback: 'Shows balanced, observant approach' }
        ]
      },
      {
        text: 'When facing a complex problem, your natural approach is to:',
        type: 'multiple_choice',
        options: [
          { text: 'Break it down into smaller, manageable parts systematically', feedback: 'Practical, analytical problem-solving style' },
          { text: 'Explore all possible solutions and their implications', feedback: 'Comprehensive, thoughtful approach' },
          { text: 'Trust your intuition and make a quick decision', feedback: 'Relies on instincts and experience' },
          { text: 'Consult others to gain different perspectives', feedback: 'Values collaboration and diverse input' }
        ]
      },
      {
        text: 'During your ideal weekend, you would most likely be:',
        type: 'multiple_choice',
        options: [
          { text: 'Planning my next week and organizing personal projects', feedback: 'Structured, productive nature' },
          { text: 'Reading, learning something new, or reflecting', feedback: 'Contemplative and growth-oriented' },
          { text: 'Being around friends and family, staying social', feedback: 'Sociable and relationship-focused' },
          { text: 'Trying new experiences or adventures', feedback: 'Adventurous and exploratory' }
        ]
      },
      {
        text: 'When processing new information, you tend to focus on:',
        type: 'multiple_choice',
        options: [
          { text: 'The big picture and future possibilities', feedback: 'Visionary, concept-oriented thinker' },
          { text: 'Practical details and concrete implementation', feedback: 'Focused on facts and action' },
          { text: 'The emotional aspects and how things impact others', feedback: 'Empathetic, relationship-minded' },
          { text: 'The logical connections and systematic reasoning', feedback: 'Analytical and systematic' }
        ]
      }
    ]
  },
  {
    title: 'Emotional Intelligence Profile',
    description:
      'Discover your emotional intelligence strengths and areas for growth. This assessment evaluates your self-awareness, empathy, emotional regulation, and social skills.',
    type: 'test',
    visibility: 'public',
    questions: [
      {
        text: 'When a colleague shows signs of frustration, your first response is usually:',
        type: 'multiple_choice',
        options: [
          { text: 'To become equally frustrated and defensive', feedback: "Matching others' emotions can reduce objectivity" },
          { text: 'To calmly suggest ways to address the underlying issue', feedback: 'Problem-solving orientation' },
          { text: 'To offer a listening ear and emotional support', feedback: 'High empathy and support skills' },
          { text: 'To distance yourself until things calm down', feedback: 'Prefers emotional distance to reset' }
        ]
      },
      {
        text: 'In emotionally charged situations, you typically:',
        type: 'multiple_choice',
        options: [
          { text: 'Become anxious and seek immediate resolution', feedback: 'Prefers quick closure under stress' },
          { text: 'Stay calm and help others work through their emotions', feedback: 'High emotional regulation' },
          { text: 'Experience the emotions deeply but process them healthily', feedback: 'High self-awareness' },
          { text: 'Push emotions aside to focus on logical solutions', feedback: 'Prioritizes logic over affect' }
        ]
      },
      {
        text: 'Other people often come to you for advice on matters involving:',
        type: 'multiple_choice',
        options: [
          { text: 'Strategic planning and decision-making', feedback: 'Analytical and structured' },
          { text: 'Emotional concerns and personal challenges', feedback: 'Trusted for emotional insight' },
          { text: 'Creative and innovative ideas', feedback: 'Imaginative and future-oriented' },
          { text: 'Technical matters', feedback: 'Expert knowledge' }
        ]
      }
    ]
  },
  {
    title: 'Communication Style Analysis',
    description:
      'Understand your natural communication patterns and learn how to adapt your style for better relationships and effectiveness.',
    type: 'test',
    visibility: 'public',
    questions: [
      {
        text: 'During conversations, you naturally tend to:',
        type: 'multiple_choice',
        options: [
          { text: 'Listen more than speak, letting others lead the conversation', feedback: 'Listener-oriented style' },
          { text: 'Provide facts, data, and logical analysis', feedback: 'Information-focused communicator' },
          { text: "Focus on understanding others' feelings and perspectives", feedback: 'Empathetic and relational' },
          { text: 'Express enthusiasm and generate excitement in others', feedback: 'Motivational and energetic' }
        ]
      },
      {
        text: 'When giving feedback, your approach typically is:',
        type: 'multiple_choice',
        options: [
          { text: 'Direct and to the point, focusing on bottom-line recommendations', feedback: 'Action-oriented' },
          { text: 'Gentle and supportive with positives and growth areas', feedback: 'Encouraging and constructive' },
          { text: 'Detailed and thorough, examining all aspects', feedback: 'Comprehensive and analytical' },
          { text: 'Technical and precise, focusing on specific details', feedback: 'Detail-oriented, expert approach' }
        ]
      }
    ]
  },
  {
    title: 'Stress Response Patterns',
    description: 'Discover how you naturally respond to stress and learn effective coping strategies tailored to your personality.',
    type: 'test',
    visibility: 'public',
    questions: [
      {
        text: 'When you feel overwhelmed, your first instinct is to:',
        type: 'multiple_choice',
        options: [
          { text: 'Create a to-do list and tackle tasks one by one', feedback: 'Structured coping approach' },
          { text: 'Talk to a friend or family member about it', feedback: 'Social support seeking' },
          { text: 'Withdraw and spend time alone', feedback: 'Solitary recharge and reflection' },
          { text: 'Engage in a physical activity like walking or exercise', feedback: 'Embodied stress release' }
        ]
      }
    ]
  },
  {
    title: 'Relationship Style Assessment',
    description:
      'Explore your attachment style and relationship patterns to build healthier, more fulfilling connections.',
    type: 'test',
    visibility: 'public',
    questions: [
      {
        text: 'In close relationships, you typically feel most secure when:',
        type: 'multiple_choice',
        options: [
          { text: 'You have consistent communication and reliability', feedback: 'Values stability and trust' },
          { text: 'There is space for independence alongside connection', feedback: 'Balances autonomy and intimacy' },
          { text: 'You receive regular reassurance and affirmation', feedback: 'Appreciates verbal/affectional signals' },
          { text: 'You avoid conflicts and keep interactions light', feedback: 'Prefers low-conflict environments' }
        ]
      }
    ]
  },
  {
    title: 'Life Purpose Alignment',
    description:
      'Discover what truly motivates you and aligns with your core values to find greater meaning and fulfillment.',
    type: 'test',
    visibility: 'public',
    questions: [
      {
        text: 'You feel most aligned with your purpose when:',
        type: 'multiple_choice',
        options: [
          { text: 'You help others grow or feel supported', feedback: 'Service- and growth-oriented purpose' },
          { text: 'You create something original or expressive', feedback: 'Creativity and expression-driven purpose' },
          { text: 'You solve complex problems with real impact', feedback: 'Problem-solving and impact focus' },
          { text: 'You build stable systems that improve lives', feedback: 'Systems and reliability motivation' }
        ]
      }
    ]
  }
];

// User Assessments (toward 20 total). Insert as private tests; questions can be added later or via AI builder.
const userAssessments = [
  { title: 'Career Fulfillment Assessment', description: 'Does your career align with your values and strengths?', type: 'test', visibility: 'private' },
  { title: 'Relationship Dynamics Analyzer', description: 'Understand attachment and communication patterns.', type: 'test', visibility: 'private' },
  { title: 'Workplace Energy Patterns', description: 'Identify work-based energizers and drainers.', type: 'test', visibility: 'private' },
  { title: 'Personal Values Alignment', description: 'Clarify values and life alignment.', type: 'test', visibility: 'private' },
  { title: 'Stress Management Style', description: 'Your unique approach to stress handling.', type: 'test', visibility: 'private' },
  { title: 'Decision-Making Style Assessment', description: 'Logic, emotion, or integrated approaches.', type: 'test', visibility: 'private' },
  { title: 'Creativity Profile Assessment', description: 'Your creative thinking strengths.', type: 'test', visibility: 'private' },
  { title: 'Life Balance Assessment', description: 'Balance across work, relationships, growth.', type: 'test', visibility: 'private' },
  { title: 'Self-Confidence Assessment', description: 'Measure and build self-assurance.', type: 'test', visibility: 'private' },
  { title: 'Time Management Style', description: 'Natural time and task approach.', type: 'test', visibility: 'private' },
  { title: 'Social Connections Assessment', description: 'Patterns in building and maintaining support.', type: 'test', visibility: 'private' },
  { title: 'Learning Style Assessment', description: 'Optimize your learning strategies.', type: 'test', visibility: 'private' },
  { title: 'Conflict Resolution Style', description: 'Handle conflicts more effectively.', type: 'test', visibility: 'private' },
  { title: 'Motivation Pattern Assessment', description: 'What truly drives action for you.', type: 'test', visibility: 'private' },
  { title: 'Leadership Style Assessment', description: 'Lead in ways that suit your strengths.', type: 'test', visibility: 'private' },
  { title: 'Financial Mindset Assessment', description: 'Money habits and decision patterns.', type: 'test', visibility: 'private' },
  { title: 'Digital Communication Style', description: 'Your online communication tendencies.', type: 'test', visibility: 'private' },
  { title: 'Team Work Dynamics', description: 'How you function within teams.', type: 'test', visibility: 'private' },
  { title: 'Personal Growth Mindset', description: 'Your attitude toward growth.', type: 'test', visibility: 'private' },
];

async function createAssessment(assessmentData) {
  const { data, error } = await supabase
    .from('assessments')
    .insert({
      title: assessmentData.title,
      description: assessmentData.description,
      type: assessmentData.type || 'test',
      visibility: assessmentData.visibility || 'private'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`createAssessment failed (${assessmentData.title}): ${error.message}`);
  }
  return data;
}

async function createQuestion(assessmentId, question, positionBase = 0, idx = 0) {
  const { data, error } = await supabase
    .from('assessment_questions')
    .insert({
      assessment_id: assessmentId,
      question_text: question.text,
      question_type: question.type || 'multiple_choice',
      position: positionBase + idx + 1
    })
    .select()
    .single();

  if (error) {
    throw new Error(`createQuestion failed: ${error.message}`);
  }
  return data;
}

async function createOptions(questionId, question, traitHint = 'general') {
  if (!question.options || !Array.isArray(question.options)) return;

  const rows = question.options.map((opt, i) => ({
    question_id: questionId,
    option_text: opt.text,
    is_correct: false,
    position: i + 1,
    feedback: opt.feedback || '',
    scoring_data: JSON.stringify({
      trait: traitHint,
      note: opt.feedback || ''
    })
  }));

  const { error } = await supabase.from('assessment_options').insert(rows);
  if (error) {
    throw new Error(`createOptions failed: ${error.message}`);
  }
}

async function createAssessmentWithQuestions(assessmentData, traitHint = 'general') {
  const assessment = await createAssessment(assessmentData);

  if (assessmentData.questions && Array.isArray(assessmentData.questions)) {
    for (let i = 0; i < assessmentData.questions.length; i++) {
      const q = assessmentData.questions[i];
      const questionRow = await createQuestion(assessment.id, q, 0, i);
      if (q.type === 'multiple_choice') {
        await createOptions(questionRow.id, q, traitHint);
      }
    }
  }

  return assessment;
}

async function updateExistingAssessments() {
  console.log('Updating existing assessments with a few additional questions (where present)...');

  const titles = ["Discover Your Communication Style", "What's Your Stress Profile?"];
  const { data: existing, error } = await supabase
    .from('assessments')
    .select('id, title, type')
    .in('title', titles);

  if (error) {
    console.warn('Skipping updateExistingAssessments (fetch error):', error.message);
    return;
  }
  if (!existing || existing.length === 0) {
    console.log('No existing target assessments found to update.');
    return;
  }

  for (const a of existing) {
    let extra = [];
    if (a.title.includes('Communication')) {
      extra = [
        {
          text: 'In group discussions, you typically prefer to play the role of:',
          type: 'multiple_choice',
          options: [
            { text: 'Facilitator who keeps discussion on track', feedback: 'Leadership and coordination skills' },
            { text: "Supporter who helps validate others' ideas", feedback: 'High empathy and emotional intelligence' },
            { text: 'Expert who provides facts and data', feedback: 'Analytical and knowledge-driven' },
            { text: 'Innovator who suggests creative solutions', feedback: 'Creative and future-oriented thinking' }
          ]
        }
      ];
    } else if (a.title.includes('Stress')) {
      extra = [
        {
          text: 'During stressful periods, your energy levels tend to:',
          type: 'multiple_choice',
          options: [
            { text: 'Increase as you become more motivated and focused', feedback: 'Performs better under pressure' },
            { text: 'Remain steady and consistent throughout', feedback: 'Stable and consistent energy' },
            { text: 'Decrease requiring time to recharge and regroup', feedback: 'Needs recovery time during stress' },
            { text: 'Fluctuate depending on the stressors', feedback: 'Responsive to different types of stress' }
          ]
        }
      ];
    }

    // Find current max position for the assessment to append after
    const { data: qs, error: qErr } = await supabase
      .from('assessment_questions')
      .select('position')
      .eq('assessment_id', a.id)
      .order('position', { ascending: false })
      .limit(1);

    if (qErr) {
      console.warn(`Skipping extra questions for "${a.title}" due to fetch error:`, qErr.message);
      continue;
    }

    const startPos = qs && qs.length > 0 ? qs[0].position : 0;
    for (let i = 0; i < extra.length; i++) {
      const q = extra[i];
      const questionRow = await createQuestion(a.id, q, startPos, i);
      if (q.type === 'multiple_choice') {
        await createOptions(questionRow.id, q, 'update');
      }
    }

    console.log(`✅ Updated assessment: ${a.title}`);
  }
}

async function seedFreeAssessments() {
  console.log('Seeding 6 free public assessments...');
  let created = 0;
  for (const a of freeAssessments) {
    try {
      await createAssessmentWithQuestions(a, a.title);
      console.log(`✅ Created free assessment: ${a.title}`);
      created++;
    } catch (e) {
      console.error(`❌ Failed free assessment "${a.title}":`, e.message);
    }
  }
  console.log(`Free assessments created: ${created}/${freeAssessments.length}`);
}

async function seedUserAssessments() {
  console.log('Seeding private user assessments to reach target counts...');
  let created = 0;
  for (const a of userAssessments) {
    try {
      await createAssessment(a);
      console.log(`✅ Created user assessment: ${a.title}`);
      created++;
    } catch (e) {
      console.error(`❌ Failed user assessment "${a.title}":`, e.message);
    }
  }
  console.log(`User assessments created: ${created}/${userAssessments.length}`);
}

async function main() {
  console.log('🚀 Starting comprehensive assessment data generation...');
  try {
    await updateExistingAssessments();
    await seedFreeAssessments();
    await seedUserAssessments();
    console.log('🎉 Assessment data generation completed.');
  } catch (e) {
    console.error('❌ Fatal error in generation:', e);
    process.exit(1);
  }
}

main();
