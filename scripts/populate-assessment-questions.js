// Script to populate remaining questions for incomplete assessments
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Additional questions for Learning Style Assessment
const learningStyleQuestions = [
  {
    position: 3,
    question_text: 'I remember information better when I:',
    options: [
      { text: 'See pictures and diagrams related to it', style: 'visual', score: 4 },
      { text: 'Discuss it with others', style: 'auditory', score: 4 },
      { text: 'Write it down or read about it', style: 'reading', score: 4 },
      { text: 'Do it practically', style: 'kinesthetic', score: 4 }
    ]
  },
  {
    position: 4,
    question_text: 'I understand concepts best when I:',
    options: [
      { text: 'Visualize them in my mind', style: 'visual', score: 4 },
      { text: 'Hear someone explain them', style: 'auditory', score: 4 },
      { text: 'Read detailed descriptions', style: 'reading', score: 4 },
      { text: 'Try them out myself', style: 'kinesthetic', score: 4 }
    ]
  },
  {
    position: 5,
    question_text: 'When solving problems, I prefer to:',
    options: [
      { text: 'Draw diagrams or charts', style: 'visual', score: 4 },
      { text: 'Talk through the problem', style: 'auditory', score: 4 },
      { text: 'Read instructions carefully', style: 'reading', score: 4 },
      { text: 'Experiment with solutions', style: 'kinesthetic', score: 4 }
    ]
  },
  {
    position: 6,
    question_text: 'In a classroom, I learn best when the teacher:',
    options: [
      { text: 'Uses visual aids and presentations', style: 'visual', score: 4 },
      { text: 'Explains concepts verbally', style: 'auditory', score: 4 },
      { text: 'Provides handouts and readings', style: 'reading', score: 4 },
      { text: 'Conducts hands-on activities', style: 'kinesthetic', score: 4 }
    ]
  },
  {
    position: 7,
    question_text: 'When reading, I understand better when I:',
    options: [
      { text: 'Highlight and use colors', style: 'visual', score: 4 },
      { text: 'Read aloud or discuss the content', style: 'auditory', score: 4 },
      { text: 'Take detailed notes', style: 'reading', score: 4 },
      { text: 'Act out or demonstrate concepts', style: 'kinesthetic', score: 4 }
    ]
  },
  {
    position: 8,
    question_text: 'I concentrate best when:',
    options: [
      { text: 'My study space is visually organized', style: 'visual', score: 4 },
      { text: 'There is background music or silence', style: 'auditory', score: 4 },
      { text: 'I can read and write without distractions', style: 'reading', score: 4 },
      { text: 'I can move around or fidget', style: 'kinesthetic', score: 4 }
    ]
  },
  {
    position: 9,
    question_text: 'I learn most effectively when:',
    options: [
      { text: 'I can see the big picture first', style: 'visual', score: 4 },
      { text: 'I can ask questions and discuss', style: 'auditory', score: 4 },
      { text: 'I have written materials to study', style: 'reading', score: 4 },
      { text: 'I can learn by doing', style: 'kinesthetic', score: 4 }
    ]
  },
  {
    position: 10,
    question_text: 'When memorizing, I prefer to:',
    options: [
      { text: 'Use flashcards with images', style: 'visual', score: 4 },
      { text: 'Repeat information aloud', style: 'auditory', score: 4 },
      { text: 'Write information multiple times', style: 'reading', score: 4 },
      { text: 'Create physical movements or associations', style: 'kinesthetic', score: 4 }
    ]
  }
]

// Additional questions for Communication Style Assessment
const communicationQuestions = [
  {
    position: 3,
    question_text: 'When listening to others, I focus on:',
    options: [
      { text: 'The facts and details', style: 'analytical', score: 4 },
      { text: 'Their emotions and feelings', style: 'supportive', score: 4 },
      { text: 'The main ideas and concepts', style: 'direct', score: 4 },
      { text: 'The stories and examples', style: 'expressive', score: 4 }
    ]
  },
  {
    position: 4,
    question_text: 'In conflicts, I typically:',
    options: [
      { text: 'Analyze the situation logically', style: 'analytical', score: 4 },
      { text: 'Try to maintain harmony', style: 'supportive', score: 4 },
      { text: 'Address the issue directly', style: 'direct', score: 4 },
      { text: 'Express my feelings openly', style: 'expressive', score: 4 }
    ]
  },
  {
    position: 5,
    question_text: 'My emails are usually:',
    options: [
      { text: 'Detailed and data-focused', style: 'analytical', score: 4 },
      { text: 'Warm and relationship-focused', style: 'supportive', score: 4 },
      { text: 'Concise and to the point', style: 'direct', score: 4 },
      { text: 'Engaging and story-like', style: 'expressive', score: 4 }
    ]
  },
  {
    position: 6,
    question_text: 'When making decisions, I:',
    options: [
      { text: 'Need all the facts first', style: 'analytical', score: 4 },
      { text: 'Consider how it affects others', style: 'supportive', score: 4 },
      { text: 'Make quick decisions', style: 'direct', score: 4 },
      { text: 'Trust my intuition', style: 'expressive', score: 4 }
    ]
  },
  {
    position: 7,
    question_text: 'In presentations, I:',
    options: [
      { text: 'Focus on data and analysis', style: 'analytical', score: 4 },
      { text: 'Connect with the audience emotionally', style: 'supportive', score: 4 },
      { text: 'Get straight to the point', style: 'direct', score: 4 },
      { text: 'Use stories and humor', style: 'expressive', score: 4 }
    ]
  },
  {
    position: 8,
    question_text: 'When someone is upset with me, I:',
    options: [
      { text: 'Want to understand the specific issue', style: 'analytical', score: 4 },
      { text: 'Focus on repairing the relationship', style: 'supportive', score: 4 },
      { text: 'Address it immediately', style: 'direct', score: 4 },
      { text: 'Share my own feelings', style: 'expressive', score: 4 }
    ]
  },
  {
    position: 9,
    question_text: 'I express my emotions by:',
    options: [
      { text: 'Analyzing why I feel that way', style: 'analytical', score: 4 },
      { text: 'Being careful not to upset others', style: 'supportive', score: 4 },
      { text: 'Stating them clearly and directly', style: 'direct', score: 4 },
      { text: 'Being animated and expressive', style: 'expressive', score: 4 }
    ]
  },
  {
    position: 10,
    question_text: 'I prefer communication that is:',
    options: [
      { text: 'Logical and well-structured', style: 'analytical', score: 4 },
      { text: 'Supportive and encouraging', style: 'supportive', score: 4 },
      { text: 'Clear and straightforward', style: 'direct', score: 4 },
      { text: 'Inspiring and engaging', style: 'expressive', score: 4 }
    ]
  }
]

async function populateAssessmentQuestions() {
  try {
    console.log('Starting to populate assessment questions...')

    // Get assessment IDs
    const { data: assessments } = await supabase
      .from('assessments')
      .select('id, title')
      .in('title', [
        'Learning Style Discovery',
        'Communication Style Profile'
      ])

    if (!assessments) {
      console.log('No assessments found')
      return
    }

    for (const assessment of assessments) {
      console.log(`Processing assessment: ${assessment.title}`)

      if (assessment.title === 'Learning Style Discovery') {
        for (const question of learningStyleQuestions) {
          // Insert question
          const { data: questionData, error: questionError } = await supabase
            .from('assessment_questions')
            .insert({
              assessment_id: assessment.id,
              question_text: question.question_text,
              question_type: 'multiple_choice',
              position: question.position,
              points: 1,
              required: true
            })
            .select()
            .single()

          if (questionError) {
            console.error('Error inserting question:', questionError)
            continue
          }

          // Insert options
          for (const option of question.options) {
            await supabase
              .from('assessment_options')
              .insert({
                question_id: questionData.id,
                option_text: option.text,
                position: question.options.indexOf(option) + 1,
                score_value: option.score,
                metadata: { learning_style: option.style }
              })
          }
        }
      }

      if (assessment.title === 'Communication Style Profile') {
        for (const question of communicationQuestions) {
          // Insert question
          const { data: questionData, error: questionError } = await supabase
            .from('assessment_questions')
            .insert({
              assessment_id: assessment.id,
              question_text: question.question_text,
              question_type: 'multiple_choice',
              position: question.position,
              points: 1,
              required: true
            })
            .select()
            .single()

          if (questionError) {
            console.error('Error inserting question:', questionError)
            continue
          }

          // Insert options
          for (const option of question.options) {
            await supabase
              .from('assessment_options')
              .insert({
                question_id: questionData.id,
                option_text: option.text,
                position: question.options.indexOf(option) + 1,
                score_value: option.score,
                metadata: { comm_style: option.style }
              })
          }
        }
      }
    }

    console.log('Assessment questions populated successfully!')
  } catch (error) {
    console.error('Error populating assessment questions:', error)
  }
}

populateAssessmentQuestions()