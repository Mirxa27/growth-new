-- Seed free visitor assessments (idempotent)
-- Created: 2025-09-01
-- Inserts 6 public assessments for visitor access. Uses ON CONFLICT DO NOTHING to be safe.

BEGIN;

-- Personality Discovery
INSERT INTO assessments (id, title, description, type, category, visibility, estimated_time, questions, scoring, results, created_at)
VALUES (
  'personality-basics',
  'Personality Discovery',
  'Discover your core personality traits and understand what makes you unique',
  'personality',
  'self-discovery',
  'public',
  5,
  '[
    {"id":"p1","text":"In social situations, you tend to:","type":"single","options":["Initiate conversations with new people","Wait for others to approach you","Prefer small groups over large gatherings","Avoid social situations when possible"]},
    {"id":"p2","text":"When making decisions, you primarily rely on:","type":"single","options":["Logic and objective analysis","Your gut feelings and intuition","Input from trusted friends/family","Practical considerations and past experiences"]},
    {"id":"p3","text":"Your ideal weekend involves:","type":"single","options":["Adventure and new experiences","Relaxation and quiet time","Socializing with friends","Productive activities and learning"]},
    {"id":"p4","text":"When faced with unexpected changes, you:","type":"single","options":["Embrace the change enthusiastically","Feel anxious but adapt quickly","Need time to process and adjust","Prefer to stick to original plans"]},
    {"id":"p5","text":"Rate your comfort with uncertainty:","type":"scale","scale":{"min":1,"max":5,"labels":["Very uncomfortable","Uncomfortable","Neutral","Comfortable","Very comfortable"]}}
  ]'::jsonb,
  '{
    "type":"personality",
    "categories":["Extraversion","Intuition","Feeling","Perceiving"],
    "interpretation": {
      "high-extraversion": "Energized by social interaction",
      "low-extraversion": "Prefer quiet, solitary activities"
    }
  }'::jsonb,
  '{
    "summary": "Your personality profile reveals your natural preferences in how you interact with the world, process information, make decisions, and organize your life.",
    "insights": ["Understanding your personality type helps you leverage your natural strengths", "Recognize situations where you thrive vs. where you need to adapt", "Improve communication by understanding different personality types"],
    "recommendations": ["Take our full 16-personality assessment for deeper insights", "Explore career paths aligned with your personality type", "Learn communication strategies for different personality types"]
  }'::jsonb,
  now()
) ON CONFLICT (id) DO NOTHING;

-- Stress Level Assessment
INSERT INTO assessments (id, title, description, type, category, visibility, estimated_time, questions, scoring, results, created_at)
VALUES (
  'stress-level-check',
  'Stress Level Assessment',
  'Quick check-in to understand your current stress levels and triggers',
  'wellness',
  'mental-health',
  'public',
  3,
  '[
    {"id":"s1","text":"Over the past week, how often have you felt overwhelmed?","type":"single","options":["Never","Rarely","Sometimes","Often","Daily"]},
    {"id":"s2","text":"Physical symptoms you\\'ve experienced recently:","type":"multiple","options":["Headaches","Sleep problems","Muscle tension","Fatigue","Digestive issues","None"]},
    {"id":"s3","text":"Rate your current ability to cope with daily challenges:","type":"scale","scale":{"min":1,"max":10,"labels":["Very poor","","","", "Average", "","","","", "Excellent"]}}
  ]'::jsonb,
  '{
    "type":"cumulative",
    "interpretation": {
      "0-5": "Low stress - Good coping mechanisms",
      "6-10": "Moderate stress - Some areas to address",
      "11-15": "High stress - Consider stress management strategies",
      "16+": "Very high stress - Professional support recommended"
    }
  }'::jsonb,
  '{
    "summary": "Your stress assessment provides insight into your current stress levels and helps identify specific areas that may need attention.",
    "insights": ["Physical symptoms often indicate stress before we mentally recognize it", "Stress affects both mental and physical health", "Early intervention prevents stress from becoming chronic"],
    "recommendations": ["Try our guided breathing exercises", "Explore stress management techniques", "Consider our full stress management course"]
  }'::jsonb,
  now()
) ON CONFLICT (id) DO NOTHING;

-- Relationship Attachment Style
INSERT INTO assessments (id, title, description, type, category, visibility, estimated_time, questions, scoring, results, created_at)
VALUES (
  'relationship-style',
  'Relationship Attachment Style',
  'Understand your patterns in relationships and how you connect with others',
  'relationships',
  'relationships',
  'public',
  4,
  '[
    {"id":"r1","text":"When your partner needs space, you tend to:","type":"single","options":["Feel relieved and enjoy the independence","Feel anxious and worry about the relationship","Respect their needs while staying connected","Get angry or try to change their mind"]},
    {"id":"r2","text":"In arguments, you typically:","type":"single","options":["Withdraw and need time alone","Pursue resolution immediately","Seek compromise and understanding","Escalate the conflict"]},
    {"id":"r3","text":"Your biggest relationship fear is:","type":"single","options":["Losing your independence","Being abandoned or rejected","Conflict and disharmony","Not being good enough"]}
  ]'::jsonb,
  '{
    "type":"categorical",
    "categories":["Secure","Anxious","Avoidant","Disorganized"],
    "interpretation": {
      "Secure": "Comfortable with intimacy and independence",
      "Anxious": "Preoccupied with relationships and fear abandonment",
      "Avoidant": "Value independence and uncomfortable with closeness",
      "Disorganized": "Mixed feelings about intimacy and relationships"
    }
  }'::jsonb,
  '{
    "summary": "Your attachment style influences how you form and maintain relationships, affecting your communication patterns, conflict resolution, and emotional needs.",
    "insights": ["Attachment styles develop early but can evolve with awareness", "Understanding your style helps you choose compatible partners", "Different styles can complement each other with understanding"],
    "recommendations": ["Take our full relationship compatibility assessment", "Explore communication strategies for your attachment style", "Learn about healthy boundaries and relationship skills"]
  }'::jsonb,
  now()
) ON CONFLICT (id) DO NOTHING;

-- Life Balance Assessment
INSERT INTO assessments (id, title, description, type, category, visibility, estimated_time, questions, scoring, results, created_at)
VALUES (
  'life-balance-check',
  'Life Balance Assessment',
  'Evaluate your current life balance across key areas',
  'lifestyle',
  'well-being',
  'public',
  4,
  '[
    {"id":"l1","text":"Rate your satisfaction with your career/professional life:","type":"scale","scale":{"min":1,"max":10,"labels":["Very dissatisfied","","","", "Neutral", "","","","", "Very satisfied"]}},
    {"id":"l2","text":"How would you rate your physical health and fitness?","type":"scale","scale":{"min":1,"max":10,"labels":["Very poor","","","", "Average", "","","","", "Excellent"]}},
    {"id":"l3","text":"Rate the quality of your relationships:","type":"scale","scale":{"min":1,"max":10,"labels":["Very poor","","","", "Average", "","","","", "Excellent"]}},
    {"id":"l4","text":"How fulfilled do you feel personally/spiritually?","type":"scale","scale":{"min":1,"max":10,"labels":["Very unfulfilled","","","", "Neutral", "","","","", "Very fulfilled"]}}
  ]'::jsonb,
  '{
    "type":"categorical",
    "categories":["Career","Health","Relationships","Personal Growth"],
    "interpretation": {
      "high-balance": "Well-balanced across life areas",
      "career-focus": "Strong in career, may need attention elsewhere",
      "health-focus": "Good health habits, consider other areas",
      "relationship-focus": "Strong relationships, balance other areas",
      "growth-focus": "Personal development focus, consider practical areas"
    }
  }'::jsonb,
  '{
    "summary": "Your life balance assessment reveals which areas are thriving and which may need more attention to create a more fulfilling life.",
    "insights": ["Imbalance in one area often affects other areas", "Small improvements in low-scoring areas create significant impact", "Balance doesn\\'t mean equal time, but appropriate attention"],
    "recommendations": ["Focus on your lowest-scoring area with small daily actions", "Explore our goal-setting and habit formation tools", "Consider our life coaching programs"]
  }'::jsonb,
  now()
) ON CONFLICT (id) DO NOTHING;

-- Decision Making Style
INSERT INTO assessments (id, title, description, type, category, visibility, estimated_time, questions, scoring, results, created_at)
VALUES (
  'decision-making-style',
  'Decision Making Style',
  'Discover how you make decisions and where you can improve',
  'cognitive',
  'personal-development',
  'public',
  3,
  '[
    {"id":"d1","text":"When faced with a major decision, you first:","type":"single","options":["Research all options thoroughly","Trust your initial gut feeling","Seek advice from others","Delay deciding as long as possible"]},
    {"id":"d2","text":"Your biggest decision-making challenge is:","type":"single","options":["Overthinking and analysis paralysis","Making impulsive choices","Being overly influenced by others","Avoiding decisions entirely"]},
    {"id":"d3","text":"After making a decision, you typically:","type":"single","options":["Feel confident and move forward","Second-guess yourself constantly","Seek validation from others","Worry about potential negative outcomes"]}
  ]'::jsonb,
  '{
    "type":"categorical",
    "categories":["Analytical","Intuitive","Dependent","Avoidant"],
    "interpretation": {
      "Analytical": "Thorough and logical but may overthink",
      "Intuitive": "Quick and confident but may miss details",
      "Dependent": "Values input but may lack confidence",
      "Avoidant": "Struggles with decision-making pressure"
    }
  }'::jsonb,
  '{
    "summary": "Your decision-making style affects your confidence, speed, and satisfaction with choices across all areas of life.",
    "insights": ["No style is inherently better - each has strengths and challenges", "Awareness of your style helps you compensate for blind spots", "Different situations may call for different approaches"],
    "recommendations": ["Learn decision-making frameworks for your style", "Practice with low-stakes decisions to build confidence", "Explore our critical thinking and decision-making courses"]
  }'::jsonb,
  now()
) ON CONFLICT (id) DO NOTHING;

-- Communication Style Assessment
INSERT INTO assessments (id, title, description, type, category, visibility, estimated_time, questions, scoring, results, created_at)
VALUES (
  'communication-style',
  'Communication Style Assessment',
  'Understand how you communicate and connect with others',
  'communication',
  'social-skills',
  'public',
  4,
  '[
    {"id":"c1","text":"When explaining something complex, you:","type":"single","options":["Use detailed explanations and examples","Focus on the big picture and key points","Ask questions to ensure understanding","Prefer to show rather than tell"]},
    {"id":"c2","text":"During conflicts, you tend to:","type":"single","options":["Address issues directly and immediately","Avoid confrontation and hope it resolves","Seek to understand all perspectives","Use humor to defuse tension"]},
    {"id":"c3","text":"Your listening style is best described as:","type":"single","options":["Active listener who asks clarifying questions","Listener who connects everything to personal experiences","Listener who focuses on solutions","Selective listener who filters for key information"]}
  ]'::jsonb,
  '{
    "type":"categorical",
    "categories":["Analytical","Driver","Expressive","Amiable"],
    "interpretation": {
      "Analytical": "Detailed, systematic, and logical communicator",
      "Driver": "Direct, results-focused, and decisive",
      "Expressive": "Enthusiastic, emotional, and people-focused",
      "Amiable": "Supportive, relationship-focused, and cooperative"
    }
  }'::jsonb,
  '{
    "summary": "Your communication style influences how effectively you connect with others, resolve conflicts, and share ideas.",
    "insights": ["Different situations and people require different communication approaches", "Flexibility in style improves relationship quality", "Understanding others\\' styles helps prevent miscommunication"],
    "recommendations": ["Learn to adapt your style for different audiences", "Explore active listening and empathy skills", "Take our advanced communication skills course"]
  }'::jsonb,
  now()
) ON CONFLICT (id) DO NOTHING;

COMMIT;
