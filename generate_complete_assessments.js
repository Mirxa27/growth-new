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

// Enhanced Free Assessments with 10-15+ questions each
const freeAssessments = [
  {
    title: 'Personalty Discovery',
    description: 'Discover your core personality traits and understand what makes you unique. Explore your natural tendencies, communication style, and motivations.',
    type: 'personality',
    visibility: 'public',
    questions: [
      {
        text: 'In social situations, you tend to:',
        type: 'multiple_choice',
        options: [
          { text: 'Initiate conversations with new people', feedback: 'Shows outgoing and confident social personality' },
          { text: 'Wait for others to approach you', feedback: 'Indicates thoughtful and observant nature' },
          { text: 'Prefer small groups over large gatherings', feedback: 'Suggests preference for intimate connections' },
          { text: 'Avoid social situations when possible', feedback: 'Points to introverted preference for solitude' }
        ]
      },
      {
        text: 'When making decisions, you primarily rely on:',
        type: 'multiple_choice',
        options: [
          { text: 'Logic and objective analysis', feedback: 'Analytical and methodical decision-maker' },
          { text: 'Your gut feelings and intuition', feedback: 'Relies on instinctive and emotional responses' },
          { text: 'Input from trusted friends/family', feedback: 'Values collaborative input in decisions' },
          { text: 'Practical considerations and past experiences', feedback: 'Grounded in practical experience and facts' }
        ]
      },
      {
        text: 'Your ideal weekend involves:',
        type: 'multiple_choice',
        options: [
          { text: 'Adventure and new experiences', feedback: 'Thrives on excitement and novelty' },
          { text: 'Relaxation and quiet time', feedback: 'Needs time for reflection and recharge' },
          { text: 'Socializing with friends', feedback: 'Energized by social interactions' },
          { text: 'Productive activities and learning', feedback: 'Driven by growth and achievement' }
        ]
      },
      {
        text: 'When facing unexpected changes, you:',
        type: 'multiple_choice',
        options: [
          { text: 'Embrace the change enthusiastically', feedback: 'Highly adaptable and flexible personality' },
          { text: 'Feel anxious but adapt quickly', feedback: 'Adaptive but initially reactive to change' },
          { text: 'Need time to process and adjust', feedback: 'Methodical adjuster who needs time to adapt' },
          { text: 'Prefer to stick to original plans', feedback: 'Values stability and consistency strongly' }
        ]
      },
      {
        text: 'In group projects, you naturally take on the role of:',
        type: 'multiple_choice',
        options: [
          { text: 'The leader coordinating the team', feedback: 'Natural leadership and organizational skills' },
          { text: 'The creative contributor generating ideas', feedback: 'Strong creative and innovative thinking' },
          { text: 'The detail-oriented organizer', feedback: 'Attention to detail and systematic approach' },
          { text: 'The supportive mediator between team members', feedback: 'Empathetic and relationship-focused role' }
        ]
      },
      {
        text: 'When learning something new, you prefer to:',
        type: 'multiple_choice',
        options: [
          { text: 'Read about it thoroughly first', feedback: 'Learns best through theoretical study' },
          { text: 'Jump in and figure it out hands-on', feedback: 'Experiential and practical learner' },
          { text: 'Listen to explanations and ask questions', feedback: 'Interactive auditory learning style' },
          { text: 'Watch others demonstrate and then copy', feedback: 'Visual and observational learning approach' }
        ]
      },
      {
        text: 'Your workspace is typically:',
        type: 'multiple_choice',
        options: [
          { text: 'Highly organized and structured', feedback: 'Strong organizational and structural preferences' },
          { text: 'Cluttered but you know where everything is', feedback: 'Creative chaos with personal system' },
          { text: 'Minimalist and clean', feedback: 'Values clarity and minimal distraction' },
          { text: 'Personalized with many personal touches', feedback: 'Expresses personality through environment' }
        ]
      },
      {
        text: 'When giving feedback, you focus on:',
        type: 'multiple_choice',
        options: [
          { text: 'Constructive criticism to improve performance', feedback: 'Direct and performance-improvement focused' },
          { text: 'Encouragement and positive reinforcement', feedback: 'Supportive and motivation-oriented approach' },
          { text: 'Fair and balanced assessment', feedback: 'Objective and impartial perspective' },
          { text: 'Specific facts and evidence', feedback: 'Data-driven and analytical feedback style' }
        ]
      },
      {
        text: 'In arguments, you react by:',
        type: 'multiple_choice',
        options: [
          { text: 'Staying calm and addressing issues logically', feedback: 'Analytical and composed during conflict' },
          { text: 'Becoming emotional and defending your position', feedback: 'Passionate and emotionally engaged' },
          { text: "Trying to understand others' viewpoint", feedback: 'Empathetic and relationship-minded' },
          { text: 'Avoiding confrontation if possible', feedback: 'Conflict-averse and harmony-seeking' }
        ]
      },
      {
        text: 'Your approach to planning is:',
        type: 'multiple_choice',
        options: [
          { text: 'Detailed planning well in advance', feedback: 'Thorough and strategic planner' },
          { text: 'Flexible planning with room for changes', feedback: 'Adaptive and flexible approach' },
          { text: 'Minimal planning, preferring spontaneity', feedback: 'Intuitive and spontaneous style' },
          { text: 'Planning only the essential elements', feedback: 'Essential-focused and streamlined planning' }
        ]
      },
      {
        text: 'Rate your comfort with uncertainty:',
        type: 'scale',
        scale: { min: 1, max: 5, labels: ['Very uncomfortable', 'Uncomfortable', 'Neutral', 'Comfortable', 'Very comfortable'] }
      },
      {
        text: 'When you complete a task, you feel most satisfied by:',
        type: 'multiple_choice',
        options: [
          { text: 'The process and learning experience', feedback: 'Values growth and development aspect' },
          { text: 'Achieving the results and meeting goals', feedback: 'Outcome and achievement oriented' },
          { text: 'Helping others who benefit from your work', feedback: 'Service and impact-motivated' },
          { text: 'Creating something innovative or different', feedback: 'Innovation and creativity driven' }
        ]
      },
      {
        text: 'In your relationships, you tend to be:',
        type: 'multiple_choice',
        options: [
          { text: 'Loyal and committed to long-term connections', feedback: 'Deeply committed and loyal friend' },
          { text: 'Flexible and open to new friendships easily', feedback: 'Socially adaptable and open' },
          { text: 'Selective and careful about who you let in', feedback: 'Choosy and discerning in relationships' },
          { text: 'Warm and inclusive with most people you meet', feedback: 'Friendly and approachable personality' }
        ]
      },
      {
        text: 'When faced with criticism, your first reaction is:',
        type: 'multiple_choice',
        options: [
          { text: 'To defend yourself and explain your position', feedback: 'Defensive and explanatory style' },
          { text: 'To feel hurt and withdraw for a time', feedback: 'Sensitive and withdrawal response' },
          { text: 'To analyze what you might learn from it', feedback: 'Reflective and growth-oriented response' },
          { text: 'To discuss it openly to understand all perspectives', feedback: 'Open and collaborative approach' }
        ]
      },
      {
        text: 'Your attitude toward rules and procedures is:',
        type: 'multiple_choice',
        options: [
          { text: 'I appreciate structure and clear guidelines', feedback: 'Values organization and certainty' },
          { text: 'I often question rules and look for better ways', feedback: 'Skeptic and improvement-focused' },
          { text: 'I follow rules when they make sense', feedback: 'Pragmatic and conditional compliance' },
          { text: 'I prefer freedom and dislike rigid procedures', feedback: 'Independent and flexible approach' }
        ]
      }
    ]
  },
  {
    title: 'Stress Level Assessment',
    description: 'Understand your current stress levels and identify effective coping strategies tailored to your personality.',
    type: 'wellness',
    visibility: 'public',
    questions: [
      {
        text: 'Over the past week, how often have you felt overwhelmed?',
        type: 'multiple_choice',
        options: [
          { text: 'Never', feedback: 'Good stress management baseline' },
          { text: 'Rarely', feedback: 'Minimal ongoing stress' },
          { text: 'Sometimes', feedback: 'Moderate stress patterns' },
          { text: 'Often', feedback: 'High frequency stress' },
          { text: 'Daily', feedback: 'Chronic stress levels' }
        ]
      },
      {
        text: 'Physical symptoms of stress you\'ve experienced recently:',
        type: 'multiple_choice',
        options: [
          { text: 'Headaches', feedback: 'Common stress-related symptom' },
          { text: 'Sleep problems', feedback: 'Impact on rest and recovery' },
          { text: 'Muscle tension', feedback: 'Physical manifestation of stress' },
          { text: 'Fatigue', feedback: 'Energy depletion from stress' },
          { text: 'Digestive issues', feedback: 'Gut-brain connection stress indicator' },
          { text: 'None of these', feedback: 'Good coping mechanism presence' }
        ]
      },
      {
        text: 'When under stress, which coping strategy do you use most?',
        type: 'multiple_choice',
        options: [
          { text: 'Deep breathing or meditation', feedback: 'Mindfulness approach' },
          { text: 'Exercise or physical activity', feedback: 'Physical stress relief' },
          { text: 'Talking to friends/family about it', feedback: 'Social support network' },
          { text: 'Forcing yourself to work through it', feedback: 'Productivity-focused response' },
          { text: 'Taking time alone to process', feedback: 'Solitary processing style' },
          { text: 'Eating or other comfort behaviors', feedback: 'Comfort-seeking pattern' }
        ]
      },
      {
        text: 'How often do you experience racing thoughts?',
        type: 'multiple_choice',
        options: [
          { text: 'Never', feedback: 'Good mental clarity' },
          { text: 'Rarely', feedback: 'Minimal cognitive stress' },
          { text: 'Sometimes', feedback: 'Occasional mental overload' },
          { text: 'Often', feedback: 'Frequent mental restlessness' },
          { text: 'Most of the time', feedback: 'Chronic rumination pattern' }
        ]
      },
      {
        text: 'Rate your usual sleep quality when stressed:',
        type: 'scale',
        scale: { min: 1, max: 5, labels: ['Very poor', 'Poor', 'Fair', 'Good', 'Excellent'] }
      },
      {
        text: 'How do you typically react to unexpected challenges?',
        type: 'multiple_choice',
        options: [
          { text: 'Address them immediately and systematically', feedback: 'Proactive problem-solving style' },
          { text: 'Feel overwhelmed but eventually handle them', feedback: 'Delayed adaptation pattern' },
          { text: 'Ask others for help or advice', feedback: 'Collaborative support system' },
          { text: 'Avoid dealing with them as long as possible', feedback: 'Avoidant coping mechanism' },
          { text: 'Feel anxious but stay focused on solutions', feedback: 'Anxiety-driven motivation' }
        ]
      },
      {
        text: 'Rate your ability to relax and unwind after a stressful day:',
        type: 'scale',
        scale: { min: 1, max: 5, labels: ['Very poor', 'Poor', 'Fair', 'Good', 'Excellent'] }
      },
      {
        text: 'Which environment feels most stressful to you?',
        type: 'multiple_choice',
        options: [
          { text: 'Work or professional settings', feedback: 'Career-related stress triggers' },
          { text: 'Social situations or parties', feedback: 'Social anxiety indicators' },
          { text: 'Public speaking or presentations', feedback: 'Performance anxiety pattern' },
          { text: 'Family conflicts or expectations', feedback: 'Relationship stress triggers' },
          { text: 'Personal health or relationship concerns', feedback: 'Personal worry patterns' }
        ]
      },
      {
        text: 'How often do you practice stress management activities?',
        type: 'multiple_choice',
        options: [
          { text: 'Daily', feedback: 'Strong self-care routine' },
          { text: 'A few times a week', feedback: 'Regular stress management' },
          { text: 'Once a week', feedback: 'Periodic stress relief' },
          { text: 'Rarely', feedback: 'Limited stress management tools' },
          { text: 'Never', feedback: 'Need for stress management skills' }
        ]
      },
      {
        text: 'Rate your current ability to cope with daily challenges:',
        type: 'scale',
        scale: { min: 1, max: 10, labels: ['Very poor', '', '', '', 'Average', '', '', '', '', 'Excellent'] }
      }
    ]
  },
  {
    title: 'Relationship Attachment Style',
    description: 'Understand your attachment patterns and how they influence your relationships. Discover your secure, anxious, or avoidant tendencies.',
    type: 'relationships',
    visibility: 'public',
    questions: [
      {
        text: 'When your partner needs space, you tend to:',
        type: 'multiple_choice',
        options: [
          { text: 'Feel relieved and enjoy the independence', feedback: 'Secure independence recognition' },
          { text: 'Feel anxious and worry about the relationship', feedback: 'Anxious attachment pattern' },
          { text: 'Respect their needs while staying connected', feedback: 'Secure relationship balance' },
          { text: 'Get angry or try to change their mind', feedback: 'Anxious resistance to separation' }
        ]
      },
      {
        text: 'In arguments, you typically:',
        type: 'multiple_choice',
        options: [
          { text: 'Withdraw and need time alone', feedback: 'Avoidant withdrawal tendency' },
          { text: 'Pursue resolution immediately', feedback: 'Anxious need for immediate resolution' },
          { text: 'Seek compromise and understanding', feedback: 'Secure conflict resolution approach' },
          { text: 'Escalate the conflict', feedback: 'Emotional flooding in conflict' }
        ]
      },
      {
        text: 'Your biggest relationship fear is:',
        type: 'multiple_choice',
        options: [
          { text: 'Losing your independence', feedback: 'Avoidant autonomy concern' },
          { text: 'Being abandoned or rejected', feedback: 'Anxious abandonment fear' },
          { text: 'Conflict and disharmony', feedback: 'Secure harmony preservation' },
          { text: 'Not being good enough', feedback: 'Low self-esteem indicator' }
        ]
      },
      {
        text: 'How do you show affection?',
        type: 'multiple_choice',
        options: [
          { text: 'Through words of affirmation and verbal appreciation', feedback: 'Love language: affirmation' },
          { text: 'Through acts of service and doing things for others', feedback: 'Love language: service' },
          { text: 'Through quality time and focused attention', feedback: 'Love language: quality time' },
          { text: 'Through physical touch and closeness', feedback: 'Love language: touch' }
        ]
      },
      {
        text: 'When you feel hurt by your partner, you:',
        type: 'multiple_choice',
        options: [
          { text: 'Express it clearly and discuss it calmly', feedback: 'Secure emotional expression pattern' },
          { text: 'Withdraw and process it internally', feedback: 'Avoidant internal processing' },
          { text: 'Seek reassurance through frequent communication', feedback: 'Anxious reassurance seeking' },
          { text: 'Become defensive and counter-attack', feedback: 'Preemptive self-protection' }
        ]
      },
      {
        text: 'Your ideal balance in a relationship is:',
        type: 'multiple_choice',
        options: [
          { text: 'High independence with occasional connection', feedback: 'Avoidant independence preference' },
          { text: 'Deep intimacy and constant closeness', feedback: 'Anxious intimacy ideal' },
          { text: 'Balanced interdependence with healthy boundaries', feedback: 'Secure healthy boundaries' },
          { text: 'Flexible based on the situation', feedback: 'Adaptive relationship style' }
        ]
      },
      {
        text: 'When making important relationship decisions, you:',
        type: 'multiple_choice',
        options: [
          { text: 'Decide independently and seek agreement', feedback: 'Autonomous decision-making style' },
          { text: 'Discuss thoroughly and decide together', feedback: 'Collaborative relationship approach' },
          { text: 'Base decisions on maintaining harmony', feedback: 'Conflict-avoidant pattern' },
          { text: 'Move forward confidently explaining your reasoning', feedback: 'Self-assured decision style' }
        ]
      },
      {
        text: 'Rate your trust in relationship partners:',
        type: 'scale',
        scale: { min: 1, max: 5, labels: ['Very cautious about trust', 'Slow to trust', 'Neutral', 'Generally trusting', 'Very trusting'] }
      },
      {
        text: 'How do you respond to a partner\'s success?',
        type: 'multiple_choice',
        options: [
          { text: 'Genuine happiness and celebration', feedback: 'Secure capacity for mutual joy' },
          { text: 'Feel happy but slightly envious', feedback: 'Ambivalent success response' },
          { text: 'Neutral or disinterested', feedback: 'Avoidant disconnection pattern' },
          { text: 'Use it as motivation for myself', feedback: 'Competitive response pattern' }
        ]
      },
      {
        text: 'Your approach to relationship conflict is:',
        type: 'multiple_choice',
        options: [
          { text: 'Avoid conflict at all costs', feedback: 'High conflict aversion' },
          { text: 'Address issues immediately when they arise', feedback: 'Direct conflict engagement' },
          { text: 'Save conflicts for important matters only', feedback: 'Selective conflict approach' },
          { text: 'See conflict as opportunities for growth', feedback: 'Growth-oriented conflict view' }
        ]
      },
      {
        text: 'In terms of relationship values, you prioritize:',
        type: 'multiple_choice',
        options: [
          { text: 'Personal freedom and autonomy', feedback: 'Independence value system' },
          { text: 'Deep emotional connection and intimacy', feedback: 'Intimacy value orientation' },
          { text: 'Mutual respect and shared responsibility', feedback: 'Mutual respect foundation' },
          { text: 'Adventure and growth together', feedback: 'Shared growth focus' }
        ]
      },
      {
        text: 'When you\'re stressed, you need from your partner:',
        type: 'multiple_choice',
        options: [
          { text: 'Space to process alone', feedback: 'Stress solitude preference' },
          { text: 'Emotional support and reassurance', feedback: 'Stress support preference' },
          { text: 'Practical help with tasks', feedback: 'Stress assistance preference' },
          { text: 'Distraction and fun activities', feedback: 'Stress distraction preference' }
        ]
      },
      {
        text: 'Your ideal relationship communication style is:',
        type: 'multiple_choice',
        options: [
          { text: 'Direct and to the point', feedback: 'Clear direct communication' },
          { text: 'Gentle and diplomatic', feedback: 'Soft skill communication' },
          { text: 'Deep and emotional', feedback: 'Emotional depth communication' },
          { text: 'Practical and solution-focused', feedback: 'Problem-solving communication' }
        ]
      },
      {
        text: 'Rate your comfort with vulnerability in relationships:',
        type: 'scale',
        scale: { min: 1, max: 5, labels: ['Very uncomfortable', 'Uncomfortable', 'Sometimes comfortable', 'Generally comfortable', 'Very comfortable'] }
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
