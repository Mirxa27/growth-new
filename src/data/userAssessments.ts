/*
  User Assessments Data
  This file exports an array of assessments available to registered users.
  Each assessment contains an id, title, description, and a list of questions.
  Each assessment includes 10 questions with multiple choice options.
*/

export interface Question {
  question: string;
  options: string[];
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

export const userAssessments: Assessment[] = [
  {
    id: 'user-1',
    title: 'Career Path Finder',
    description: 'Discover the career path that suits your skills and interests.',
    questions: [
      { question: 'Do you enjoy problem solving?', options: ['Yes', 'No', 'Sometimes', 'Not sure'] },
      { question: 'Do you prefer working in teams?', options: ['Always', 'Often', 'Rarely', 'Never'] },
      { question: 'Are you creative in your approach to work?', options: ['Yes', 'No', 'Sometimes', 'Often'] },
      { question: 'Do you like taking risks?', options: ['Yes', 'No', 'Sometimes', 'Rarely'] },
      { question: 'Is stability important for you in a job?', options: ['Very important', 'Somewhat important', 'Not important', 'Undecided'] },
      { question: 'Do you prefer structured tasks over open-ended challenges?', options: ['Yes', 'No', 'Depends', 'Sometimes'] },
      { question: 'Are you comfortable with public speaking?', options: ['Yes', 'No', 'Sometimes', 'Rarely'] },
      { question: 'Do you enjoy working with technology?', options: ['Yes', 'No', 'Somewhat', 'Not at all'] },
      { question: 'Do you consider yourself detail-oriented?', options: ['Strongly agree', 'Agree', 'Disagree', 'Strongly disagree'] },
      { question: 'Do you often seek leadership roles?', options: ['Yes', 'No', 'Sometimes', 'Rarely'] }
    ]
  },
  {
    id: 'user-2',
    title: 'Personality Compass',
    description: 'Uncover the nuances of your personality and understand your intrinsic traits.',
    questions: [
      { question: 'Do you prefer solitude or social interactions?', options: ['Solitude', 'Social', 'Mix of both', 'Depends on mood'] },
      { question: 'Are you more intuitive or logical?', options: ['Intuitive', 'Logical', 'Both equally', 'Not sure'] },
      { question: 'Do you take decisions quickly?', options: ['Yes', 'No', 'Sometimes', 'Depends'] },
      { question: 'Is emotional expression easy for you?', options: ['Very easy', 'Somewhat easy', 'Not easy', 'I prefer to keep emotions private'] },
      { question: 'Do you enjoy planning or spontaneity?', options: ['Planning', 'Spontaneity', 'Both equally', 'Not sure'] },
      { question: 'Do you prefer working alone or in a group?', options: ['Alone', 'Group', 'Mix of both', 'No preference'] },
      { question: 'Are you open to new experiences?', options: ['Very open', 'Somewhat open', 'Not open', 'Depends'] },
      { question: 'Do you value tradition over innovation?', options: ['Tradition', 'Innovation', 'Both equally', 'Neither'] },
      { question: 'Do you handle stress well?', options: ['Very well', 'Moderately well', 'Poorly', 'Not sure'] },
      { question: 'Are you a risk-taker?', options: ['Yes', 'No', 'Sometimes', 'Depends'] }
    ]
  },
  {
    id: 'user-3',
    title: 'Life Purpose Quiz',
    description: 'Dive deep into your values and discover what drives you in life.',
    questions: [
      { question: 'Do you have a clear sense of purpose?', options: ['Yes', 'No', 'Somewhat', 'Unsure'] },
      { question: 'Do you set long-term goals for yourself?', options: ['Always', 'Often', 'Rarely', 'Never'] },
      { question: 'Is personal growth a priority in your daily life?', options: ['Absolutely', 'Somewhat', 'Not really', 'Not at all'] },
      { question: 'Do you reflect on your achievements regularly?', options: ['Yes', 'No', 'Sometimes', 'Occasionally'] },
      { question: 'Is making a positive impact important to you?', options: ['Very important', 'Somewhat important', 'Neutral', 'Unimportant'] },
      { question: 'Do you follow your intuition in making decisions?', options: ['Always', 'Often', 'Sometimes', 'Never'] },
      { question: 'Do you seek feedback for improvement?', options: ['Regularly', 'Occasionally', 'Rarely', 'Never'] },
      { question: 'Is creativity central to your life?', options: ['Yes', 'No', 'A bit', 'Not at all'] },
      { question: 'Do you feel connected to a larger purpose?', options: ['Strongly', 'Moderately', 'Slightly', 'Not at all'] },
      { question: 'Do you find joy in small achievements?', options: ['Yes', 'No', 'Sometimes', 'Rarely'] }
    ]
  },
  {
    id: 'user-4',
    title: 'Wellness Journey',
    description: 'Assess your physical and mental wellness and uncover areas for improvement.',
    questions: [
      { question: 'How often do you exercise?', options: ['Daily', 'Several times a week', 'Once a week', 'Rarely'] },
      { question: 'Do you follow a balanced diet?', options: ['Yes', 'Sometimes', 'Rarely', 'No'] },
      { question: 'Do you get enough sleep?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] },
      { question: 'How do you rate your mental health?', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
      { question: 'Do you practice mindfulness or meditation?', options: ['Regularly', 'Occasionally', 'Rarely', 'Never'] },
      { question: 'Do you take time for self-reflection?', options: ['Daily', 'Weekly', 'Monthly', 'Rarely'] },
      { question: 'How often do you experience stress?', options: ['Rarely', 'Sometimes', 'Often', 'Almost always'] },
      { question: 'Do you have a support system in place?', options: ['Yes', 'No', 'Sometimes', 'Not sure'] },
      { question: 'How balanced is your work-life routine?', options: ['Very balanced', 'Somewhat balanced', 'Unbalanced', 'Not balanced'] },
      { question: 'Do you set health-related goals?', options: ['Always', 'Sometimes', 'Rarely', 'Never'] }
    ]
  },
  {
    id: 'user-5',
    title: 'Mindfulness Depth',
    description: 'Explore your mindfulness habits and learn how deeply you engage in the present moment.',
    questions: [
      { question: 'How frequently do you practice mindfulness?', options: ['Daily', 'Weekly', 'Monthly', 'Rarely'] },
      { question: 'Do you engage in meditation practices?', options: ['Regularly', 'Occasionally', 'Rarely', 'Never'] },
      { question: 'Are you aware of your thoughts during stress?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] },
      { question: 'Do you take time to breathe deeply during your day?', options: ['Frequently', 'Sometimes', 'Rarely', 'Never'] },
      { question: 'How often do you check in with your emotions?', options: ['Daily', 'Weekly', 'Monthly', 'Rarely'] },
      { question: 'Do you find it easy to stay present?', options: ['Yes', 'No', 'Sometimes', 'Not sure'] },
      { question: 'How regularly do you disconnect from distractions?', options: ['Regularly', 'Occasionally', 'Rarely', 'Never'] },
      { question: 'Do you practice gratitude regularly?', options: ['Yes', 'No', 'Sometimes', 'Rarely'] },
      { question: 'Is self-awareness a key part of your routine?', options: ['Absolutely', 'Somewhat', 'Not really', 'Not at all'] },
      { question: 'Do you feel centered and calm most days?', options: ['Yes', 'Often', 'Sometimes', 'Rarely'] }
    ]
  },
  {
    id: 'user-6',
    title: 'Creativity Booster',
    description: 'Evaluate your creative skills and identify ways to further enhance your innovative potential.',
    questions: [
      { question: 'How often do you engage in creative projects?', options: ['Daily', 'Weekly', 'Monthly', 'Rarely'] },
      { question: 'Do you seek inspiration from art and literature?', options: ['Always', 'Often', 'Sometimes', 'Never'] },
      { question: 'How comfortable are you with brainstorming sessions?', options: ['Very comfortable', 'Comfortable', 'Neutral', 'Uncomfortable'] },
      { question: 'Do you experiment with new ideas frequently?', options: ['Yes', 'No', 'Sometimes', 'Occasionally'] },
      { question: 'Do you overcome creative blocks effectively?', options: ['Yes', 'No', 'Sometimes', 'With difficulty'] },
      { question: 'How do you rate your ability to think outside the box?', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
      { question: 'Do you often collaborate on creative projects?', options: ['Regularly', 'Sometimes', 'Rarely', 'Never'] },
      { question: 'Are you open to unconventional ideas?', options: ['Yes', 'No', 'Sometimes', 'Depends'] },
      { question: 'Does creativity play a major role in your work?', options: ['Absolutely', 'Moderately', 'A little', 'Not at all'] },
      { question: 'Do you keep a journal for creative ideas?', options: ['Yes', 'Occasionally', 'Rarely', 'Never'] }
    ]
  },
  {
    id: 'user-7',
    title: 'Relationship Realities',
    description: 'Assess your relationship dynamics and communication patterns in close relationships.',
    questions: [
      { question: 'Do you feel heard in your relationships?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] },
      { question: 'How do you resolve conflicts?', options: ['Open discussion', 'Avoidance', 'Compromise', 'Confrontation'] },
      { question: 'Are you comfortable sharing your feelings?', options: ['Yes', 'No', 'Sometimes', 'Depends'] },
      { question: 'Do you communicate effectively with loved ones?', options: ['Yes', 'No', 'Sometimes', 'Not sure'] },
      { question: 'How well do you manage misunderstandings?', options: ['Very well', 'Moderately well', 'Poorly', 'Not at all'] },
      { question: 'Do you express appreciation regularly?', options: ['Yes', 'No', 'Occasionally', 'Rarely'] },
      { question: 'Are you empathetic towards others?', options: ['Very empathetic', 'Somewhat', 'Neutral', 'Not empathetic'] },
      { question: 'Do you feel your needs are met?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] },
      { question: 'How balanced are your relationships?', options: ['Very balanced', 'Moderately balanced', 'Somewhat imbalanced', 'Imbalanced'] },
      { question: 'Do you invest time in maintaining relationships?', options: ['Yes', 'No', 'Sometimes', 'Rarely'] }
    ]
  },
  {
    id: 'user-8',
    title: 'Stress Resilience',
    description: 'Discover how well you bounce back from stress and adversity.',
    questions: [
      { question: 'How quickly do you recover from setbacks?', options: ['Very quickly', 'Quickly', 'Slowly', 'Very slowly'] },
      { question: 'Do you have coping mechanisms for stress?', options: ['Yes', 'No', 'Some', 'Not sure'] },
      { question: 'Do you maintain a positive outlook during tough times?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] },
      { question: 'How do you manage unexpected changes?', options: ['Adapt easily', 'Adapt with difficulty', 'Struggle', 'Avoid changes'] },
      { question: 'Do you seek support when stressed?', options: ['Always', 'Often', 'Sometimes', 'Never'] },
      { question: 'Is stress a motivator for you sometimes?', options: ['Yes', 'No', 'Occasionally', 'Rarely'] },
      { question: 'Do you plan ahead for potential issues?', options: ['Always', 'Sometimes', 'Rarely', 'Never'] },
      { question: 'How do you view challenges?', options: ['Opportunities', 'Obstacles', 'Both', 'Neither'] },
      { question: 'Are you able to maintain focus under pressure?', options: ['Yes', 'No', 'Sometimes', 'Not usually'] },
      { question: 'Do you use relaxation techniques during stress?', options: ['Regularly', 'Sometimes', 'Rarely', 'Never'] }
    ]
  },
  {
    id: 'user-9',
    title: 'Emotional Balance',
    description: 'Evaluate the equilibrium between your emotional responses and rational thinking.',
    questions: [
      { question: 'Do you maintain calm in heated situations?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] },
      { question: 'Are you able to separate emotion from logic?', options: ['Yes', 'No', 'Sometimes', 'Not sure'] },
      { question: 'Do you experience extreme mood swings?', options: ['Rarely', 'Sometimes', 'Often', 'Always'] },
      { question: 'Do you acknowledge your emotions objectively?', options: ['Yes', 'Mostly', 'Rarely', 'Never'] },
      { question: 'Do you practice self-reflection to achieve balance?', options: ['Regularly', 'Sometimes', 'Rarely', 'Never'] },
      { question: 'Is emotional stability important to you?', options: ['Yes', 'No', 'Somewhat', 'Not at all'] },
      { question: 'Do you seek balance in your daily routine?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] },
      { question: 'How well do you communicate your needs?', options: ['Very well', 'Well', 'Poorly', 'Not at all'] },
      { question: 'Do you find it easy to forgive?', options: ['Yes', 'No', 'Sometimes', 'Rarely'] },
      { question: 'Do you feel in control of your emotions?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] }
    ]
  },
  {
    id: 'user-10',
    title: 'Leadership Navigator',
    description: 'Explore your natural leadership abilities and areas for development.',
    questions: [
      { question: 'Do you feel confident leading a team?', options: ['Yes', 'No', 'Sometimes', 'Depends'] },
      { question: 'Are you comfortable with making tough decisions?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] },
      { question: 'Do you inspire others to follow your lead?', options: ['Yes', 'No', 'Sometimes', 'Occasionally'] },
      { question: 'How do you approach delegation?', options: ['Easily', 'With hesitation', 'Rarely delegate', 'Not sure'] },
      { question: 'Are you open to feedback about your leadership style?', options: ['Always', 'Often', 'Sometimes', 'Never'] },
      { question: 'Do you take responsibility for team outcomes?', options: ['Yes', 'No', 'Sometimes', 'Rarely'] },
      { question: 'Can you handle criticism gracefully?', options: ['Yes', 'No', 'Sometimes', 'Depends'] },
      { question: 'Do you encourage innovation among your team?', options: ['Yes', 'No', 'Sometimes', 'Not really'] },
      { question: 'Are you decisive in critical situations?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] },
      { question: 'Do you mentor others in your organization?', options: ['Regularly', 'Occasionally', 'Rarely', 'Never'] }
    ]
  },
  {
    id: 'user-11',
    title: 'Decision Making Analyzer',
    description: 'Investigate your decision-making styles and techniques under various circumstances.',
    questions: [
      { question: 'Do you rely on data when making decisions?', options: ['Always', 'Often', 'Sometimes', 'Never'] },
      { question: 'Do you trust your instincts?', options: ['Yes', 'No', 'Sometimes', 'Not sure'] },
      { question: 'Do you consider multiple perspectives before deciding?', options: ['Yes', 'No', 'Sometimes', 'Rarely'] },
      { question: 'Are you decisive under pressure?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] },
      { question: 'Do you reflect on past decisions?', options: ['Regularly', 'Sometimes', 'Rarely', 'Never'] },
      { question: 'Do you involve others in important decisions?', options: ['Yes', 'No', 'Sometimes', 'Only when needed'] },
      { question: 'How comfortable are you with ambiguity?', options: ['Very comfortable', 'Comfortable', 'Uncomfortable', 'Very uncomfortable'] },
      { question: 'Do you have a systematic approach to decision making?', options: ['Yes', 'No', 'Sometimes', 'Not sure'] },
      { question: 'Are you open to changing your mind?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] },
      { question: 'Do you evaluate the outcomes of your decisions?', options: ['Regularly', 'Sometimes', 'Rarely', 'Never'] }
    ]
  },
  {
    id: 'user-12',
    title: 'Conflict Resolution Dynamics',
    description: 'Evaluate how you manage conflicts and resolve disputes in various settings.',
    questions: [
      { question: 'Do you address conflicts head-on?', options: ['Always', 'Often', 'Sometimes', 'Never'] },
      { question: 'Are you a good listener during conflicts?', options: ['Yes', 'No', 'Sometimes', 'Not sure'] },
      { question: 'Do you seek compromise during disagreements?', options: ['Yes', 'No', 'Sometimes', 'Rarely'] },
      { question: 'Do you remain calm in heated situations?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] },
      { question: 'Do you take time to understand all sides?', options: ['Always', 'Often', 'Sometimes', 'Never'] },
      { question: 'Do you prefer mediation over confrontation?', options: ['Yes', 'No', 'Sometimes', 'Not sure'] },
      { question: 'Are you effective in de-escalating conflicts?', options: ['Yes', 'No', 'Sometimes', 'Rarely'] },
      { question: 'Do you learn from past conflicts?', options: ['Always', 'Often', 'Sometimes', 'Never'] },
      { question: 'Can you separate personal feelings from professional issues?', options: ['Yes', 'No', 'Sometimes', 'Not sure'] },
      { question: 'Do you maintain respect even during disputes?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] }
    ]
  },
  {
    id: 'user-13',
    title: 'Time Management Mastery',
    description: 'Analyze your time management skills and uncover strategies for better productivity.',
    questions: [
      { question: 'Do you plan your day in advance?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] },
      { question: 'Do you set priorities for your tasks?', options: ['Yes', 'No', 'Sometimes', 'Not sure'] },
      { question: 'Are you punctual for meetings and deadlines?', options: ['Yes', 'No', 'Sometimes', 'Rarely'] },
      { question: 'Do you avoid procrastination effectively?', options: ['Always', 'Often', 'Sometimes', 'Never'] },
      { question: 'Do you break tasks into manageable chunks?', options: ['Yes', 'No', 'Sometimes', 'Not sure'] },
      { question: 'Are you able to multitask efficiently?', options: ['Yes', 'No', 'Sometimes', 'Rarely'] },
      { question: 'Do you allocate time for breaks?', options: ['Always', 'Often', 'Sometimes', 'Never'] },
      { question: 'Do you use tools to track your time?', options: ['Yes', 'No', 'Sometimes', 'Not sure'] },
      { question: 'Do you delegate tasks when necessary?', options: ['Yes', 'No', 'Sometimes', 'Rarely'] },
      { question: 'Do you review your day and adjust plans accordingly?', options: ['Regularly', 'Occasionally', 'Rarely', 'Never'] }
    ]
  },
  {
    id: 'user-14',
    title: 'Financial Wellness Check',
    description: 'Assess your financial habits, budgeting skills, and overall financial wellness.',
    questions: [
      { question: 'Do you track your expenses regularly?', options: ['Yes', 'No', 'Sometimes', 'Never'] },
      { question: 'Do you set financial goals?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] },
      { question: 'Are you disciplined with your budget?', options: ['Yes', 'No', 'Sometimes', 'Not sure'] },
      { question: 'Do you save a portion of your income monthly?', options: ['Yes', 'No', 'Sometimes', 'Rarely'] },
      { question: 'Do you invest your savings?', options: ['Yes', 'No', 'Considering', 'Not sure'] },
      { question: 'Are you aware of your spending habits?', options: ['Very aware', 'Somewhat aware', 'Not very aware', 'Not aware'] },
      { question: 'Do you avoid unnecessary debts?', options: ['Yes', 'No', 'Sometimes', 'Rarely'] },
      { question: 'Do you review your financial plans periodically?', options: ['Yes', 'No', 'Sometimes', 'Never'] },
      { question: 'Do you feel secure about your financial future?', options: ['Yes', 'No', 'Sometimes', 'Uncertain'] },
      { question: 'Do you seek advice for financial planning?', options: ['Regularly', 'Occasionally', 'Rarely', 'Never'] }
    ]
  },
  {
    id: 'user-15',
    title: 'Spiritual Alignment',
    description: 'Measure your sense of spiritual connection and alignment with your inner self.',
    questions: [
      { question: 'Do you engage in spiritual practices?', options: ['Regularly', 'Occasionally', 'Rarely', 'Never'] },
      { question: 'Do you feel connected to something greater than yourself?', options: ['Yes', 'No', 'Sometimes', 'Unsure'] },
      { question: 'Do you meditate or pray?', options: ['Yes', 'No', 'Sometimes', 'Occasionally'] },
      { question: 'Is spiritual growth a priority for you?', options: ['Yes', 'No', 'Somewhat', 'Not at all'] },
      { question: 'Do you seek meaning in everyday events?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] },
      { question: 'Do you explore different spiritual philosophies?', options: ['Yes', 'No', 'Sometimes', 'Not really'] },
      { question: 'Do you feel inner peace?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] },
      { question: 'Do you attend spiritual or religious gatherings?', options: ['Regularly', 'Occasionally', 'Rarely', 'Never'] },
      { question: 'Do you read spiritual literature?', options: ['Yes', 'No', 'Sometimes', 'Rarely'] },
      { question: 'Do you feel guided by a higher purpose?', options: ['Yes', 'No', 'Sometimes', 'Not sure'] }
    ]
  },
  {
    id: 'user-16',
    title: 'Communication Effectiveness',
    description: 'Discover how effective your communication skills are in personal and professional settings.',
    questions: [
      { question: 'Do you articulate your thoughts clearly?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] },
      { question: 'Are you a good listener?', options: ['Yes', 'No', 'Sometimes', 'Not sure'] },
      { question: 'Do you adapt your communication style to your audience?', options: ['Yes', 'No', 'Sometimes', 'Not sure'] },
      { question: 'Do you practice active listening?', options: ['Regularly', 'Sometimes', 'Rarely', 'Never'] },
      { question: 'Do you ask questions to clarify understanding?', options: ['Yes', 'No', 'Sometimes', 'Rarely'] },
      { question: 'Do you provide constructive feedback?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] },
      { question: 'Do you follow up on conversations adequately?', options: ['Yes', 'No', 'Sometimes', 'Not sure'] },
      { question: 'Do you express empathy during discussions?', options: ['Yes', 'No', 'Sometimes', 'Rarely'] },
      { question: 'Do you use non-verbal cues effectively?', options: ['Yes', 'No', 'Sometimes', 'Not sure'] },
      { question: 'Do you tailor your message for clarity?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] }
    ]
  },
  {
    id: 'user-17',
    title: 'Self-Discovery Expedition',
    description: 'Embark on a journey of self-discovery by exploring your beliefs, values, and aspirations.',
    questions: [
      { question: 'Do you spend time reflecting on your life choices?', options: ['Regularly', 'Occasionally', 'Rarely', 'Never'] },
      { question: 'Do you set personal goals?', options: ['Yes', 'No', 'Sometimes', 'Not sure'] },
      { question: 'Do you seek to understand your emotions?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] },
      { question: 'Do you explore new hobbies and interests?', options: ['Yes', 'No', 'Sometimes', 'Rarely'] },
      { question: 'Do you write or journal your thoughts?', options: ['Regularly', 'Occasionally', 'Rarely', 'Never'] },
      { question: 'Are you curious about your personality?', options: ['Very curious', 'Somewhat curious', 'Not very curious', 'Not at all'] },
      { question: 'Do you seek feedback on your strengths and weaknesses?', options: ['Yes', 'No', 'Sometimes', 'Rarely'] },
      { question: 'Do you challenge your own beliefs?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] },
      { question: 'Do you adapt based on self-reflection?', options: ['Yes', 'No', 'Sometimes', 'Rarely'] },
      { question: 'Do you feel more connected after self-exploration?', options: ['Yes', 'No', 'Sometimes', 'Not sure'] }
    ]
  },
  {
    id: 'user-18',
    title: 'Goal Setting Strategy',
    description: 'Assess how effectively you set and pursue personal and professional goals.',
    questions: [
      { question: 'Do you set measurable goals?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] },
      { question: 'Do you create actionable plans to reach your goals?', options: ['Yes', 'No', 'Sometimes', 'Not sure'] },
      { question: 'Do you track your progress regularly?', options: ['Yes', 'No', 'Sometimes', 'Rarely'] },
      { question: 'Are your goals aligned with your values?', options: ['Yes', 'No', 'Somewhat', 'Not sure'] },
      { question: 'Do you revise your goals when necessary?', options: ['Regularly', 'Occasionally', 'Rarely', 'Never'] },
      { question: 'Do you celebrate small milestones?', options: ['Yes', 'No', 'Sometimes', 'Rarely'] },
      { question: 'Do you receive support for your goals?', options: ['Yes', 'No', 'Sometimes', 'Not sure'] },
      { question: 'Do you feel motivated to achieve your targets?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] },
      { question: 'Do you find goal setting rewarding?', options: ['Yes', 'No', 'Sometimes', 'Not sure'] },
      { question: 'Do you learn from goals that weren\'t met?', options: ['Always', 'Sometimes', 'Rarely', 'Never'] }
    ]
  },
  {
    id: 'user-19',
    title: 'Work-Life Harmony',
    description: 'Examine how well you balance your work commitments with your personal life.',
    questions: [
      { question: 'Do you maintain clear boundaries between work and home?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] },
      { question: 'Do you schedule regular downtime?', options: ['Yes', 'No', 'Sometimes', 'Not sure'] },
      { question: 'Do you feel stressed by work demands?', options: ['Never', 'Rarely', 'Sometimes', 'Often'] },
      { question: 'Do you take vacations to recharge?', options: ['Yes', 'No', 'Sometimes', 'Rarely'] },
      { question: 'Do you invest time in personal relationships?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] },
      { question: 'Do you set aside time for hobbies?', options: ['Regularly', 'Occasionally', 'Rarely', 'Never'] },
      { question: 'Do you disconnect from work during off-hours?', options: ['Always', 'Often', 'Sometimes', 'Never'] },
      { question: 'Do you feel balanced at the end of the day?', options: ['Yes', 'No', 'Sometimes', 'Not sure'] },
      { question: 'Do you plan leisure activities in advance?', options: ['Yes', 'No', 'Sometimes', 'Rarely'] },
      { question: 'Do you feel satisfied with your personal time?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] }
    ]
  },
  {
    id: 'user-20',
    title: 'Innovation Mindset',
    description: 'Gauge your ability to think innovatively and adapt to new challenges in dynamic environments.',
    questions: [
      { question: 'Do you actively seek out new ideas?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] },
      { question: 'Do you embrace change in your work or life?', options: ['Yes', 'No', 'Sometimes', 'Occasionally'] },
      { question: 'Do you challenge conventional methods?', options: ['Yes', 'No', 'Sometimes', 'Rarely'] },
      { question: 'Are you curious about emerging trends?', options: ['Very curious', 'Somewhat curious', 'Not very curious', 'Not curious'] },
      { question: 'Do you learn from failures quickly?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] },
      { question: 'Do you experiment with new approaches?', options: ['Yes', 'No', 'Sometimes', 'Rarely'] },
      { question: 'Do you foster an environment of innovation?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] },
      { question: 'Do you stay updated with industry developments?', options: ['Yes', 'No', 'Sometimes', 'Not sure'] },
      { question: 'Do you encourage creative thinking in your team?', options: ['Yes', 'No', 'Sometimes', 'Rarely'] },
      { question: 'Do you feel driven to innovate?', options: ['Always', 'Often', 'Sometimes', 'Rarely'] }
    ]
  }
];
