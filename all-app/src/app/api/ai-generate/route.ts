import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contentType, topic, description, difficulty, aiProvider } = body

    // Validate input
    if (!topic || !contentType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate prompt based on content type
    const prompt = generatePrompt(contentType, topic, description, difficulty)

    // Call AI provider
    let generatedContent
    switch (aiProvider) {
      case 'openai':
        generatedContent = await generateWithOpenAI(prompt, contentType)
        break
      case 'anthropic':
        // Implement Anthropic integration
        generatedContent = await generateWithOpenAI(prompt, contentType) // Fallback for now
        break
      case 'google':
        // Implement Google integration
        generatedContent = await generateWithOpenAI(prompt, contentType) // Fallback for now
        break
      default:
        throw new Error('Invalid AI provider')
    }

    return NextResponse.json({
      content: generatedContent,
      model: aiProvider === 'openai' ? 'gpt-4' : aiProvider,
    })
  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}

function generatePrompt(
  contentType: string,
  topic: string,
  description: string,
  difficulty: string
): string {
  const basePrompt = `Create a comprehensive ${contentType} about "${topic}".`
  
  const typeSpecificPrompts = {
    assessment: `
      Generate an assessment with the following structure:
      - Title: A clear, engaging title
      - Description: 2-3 sentences explaining what the assessment measures
      - Instructions: Clear instructions for taking the assessment
      - Questions: 15-20 questions appropriate for ${difficulty} difficulty
      
      For each question include:
      - Question text
      - Question type (multiple_choice, rating, or true_false)
      - Options (for multiple choice)
      - Correct answer or scoring guidance
      
      ${description ? `Additional requirements: ${description}` : ''}
      
      Return the response as a JSON object.
    `,
    course: `
      Generate a course outline with the following structure:
      - Title: An engaging course title
      - Description: Comprehensive course description
      - Learning objectives: 4-5 clear objectives
      - Duration: Estimated hours to complete
      - Modules: 6-8 modules with titles and descriptions
      - For each module, include 3-5 lessons
      
      Difficulty level: ${difficulty}
      ${description ? `Additional requirements: ${description}` : ''}
      
      Return the response as a JSON object.
    `,
    test: `
      Generate a test with the following structure:
      - Title: Clear test title
      - Description: What the test evaluates
      - Time limit: Suggested time in minutes
      - Passing score: Percentage required to pass
      - Questions: 20-30 questions for ${difficulty} difficulty
      
      Include various question types with clear correct answers.
      ${description ? `Additional requirements: ${description}` : ''}
      
      Return the response as a JSON object.
    `,
    exploration: `
      Generate an interactive exploration/learning experience about "${topic}":
      - Title: Engaging title
      - Description: What learners will explore
      - Sections: 5-7 interactive sections
      - Activities: Hands-on activities or experiments
      - Discussion prompts: Thought-provoking questions
      
      Make it ${difficulty} level appropriate.
      ${description ? `Additional requirements: ${description}` : ''}
      
      Return the response as a JSON object.
    `,
  }

  return basePrompt + (typeSpecificPrompts[contentType as keyof typeof typeSpecificPrompts] || '')
}

async function generateWithOpenAI(prompt: string, contentType: string) {
  const openAIApiKey = process.env.OPENAI_API_KEY
  
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational content creator. Generate high-quality, engaging educational content in JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  })

  if (!response.ok) {
    throw new Error('OpenAI API request failed')
  }

  const data = await response.json()
  const content = JSON.parse(data.choices[0].message.content)

  // Format the content based on type
  if (contentType === 'assessment') {
    return formatAssessment(content)
  } else if (contentType === 'course') {
    return formatCourse(content)
  }

  return content
}

function formatAssessment(content: any) {
  return {
    title: content.title || 'Untitled Assessment',
    description: content.description || '',
    instructions: content.instructions || 'Please answer all questions honestly.',
    questions: (content.questions || []).map((q: any, index: number) => ({
      id: `q${index + 1}`,
      text: q.question_text || q.text || q.question,
      type: q.question_type || q.type || 'multiple_choice',
      options: q.options || q.choices,
      correct_answer: q.correct_answer || q.answer,
      points: q.points || 1,
      explanation: q.explanation || '',
    })),
    category_id: null,
    time_limit: content.time_limit || 30,
    passing_score: content.passing_score || 70,
  }
}

function formatCourse(content: any) {
  return {
    title: content.title || 'Untitled Course',
    description: content.description || '',
    learning_objectives: content.learning_objectives || content.objectives || [],
    duration_hours: content.duration || content.duration_hours || 10,
    modules: (content.modules || []).map((module: any, index: number) => ({
      title: module.title || `Module ${index + 1}`,
      description: module.description || '',
      lessons: module.lessons || [],
      order_index: index,
    })),
    difficulty: content.difficulty || 'intermediate',
  }
}