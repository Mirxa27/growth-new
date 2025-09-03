'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { freeAssessments, type Question } from '@/data/assessments'
import { toast } from 'sonner'

export default function FreeAssessmentPage() {
  const params = useParams()
  const router = useRouter()
  const category = params.category as string
  const assessment = freeAssessments[category]

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [showResults, setShowResults] = useState(false)

  if (!assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Assessment Not Found</h1>
          <button
            onClick={() => router.push('/')}
            className="btn-primary px-6 py-2"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers({ ...answers, [questionId]: answer })
  }

  const handleNext = () => {
    const currentQ = assessment.questions[currentQuestion]
    if (!answers[currentQ.id]) {
      toast.error('Please answer the current question')
      return
    }

    if (currentQuestion < assessment.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      calculateResults()
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const calculateResults = () => {
    // Save attempt to localStorage (for free assessments)
    const attempt = {
      assessmentId: assessment.id,
      category: assessment.category,
      answers,
      completedAt: new Date().toISOString(),
    }
    
    const attempts = JSON.parse(localStorage.getItem('assessmentAttempts') || '[]')
    attempts.push(attempt)
    localStorage.setItem('assessmentAttempts', JSON.stringify(attempts))
    
    setShowResults(true)
    toast.success('Assessment completed!')
  }

  const progress = ((currentQuestion + 1) / assessment.questions.length) * 100

  if (showResults) {
    return <ResultsView assessment={assessment} answers={answers} />
  }

  const question = assessment.questions[currentQuestion]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{assessment.title}</h1>
          <p className="text-gray-600 mt-2">{assessment.description}</p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Question {currentQuestion + 1} of {assessment.questions.length}
            </span>
            <span className="text-sm text-gray-600">{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{question.text}</h2>
          
          <QuestionInput
            question={question}
            value={answers[question.id]}
            onChange={(value) => handleAnswer(question.id, value)}
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="btn-outline px-6 py-2 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </button>
          <button
            onClick={handleNext}
            className="btn-primary px-6 py-2"
          >
            {currentQuestion === assessment.questions.length - 1 ? 'Complete' : 'Next'}
            <ChevronRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  )
}

function QuestionInput({ question, value, onChange }: {
  question: Question
  value: any
  onChange: (value: any) => void
}) {
  switch (question.type) {
    case 'multiple_choice':
      return (
        <div className="space-y-3">
          {question.options?.map((option, index) => (
            <label
              key={index}
              className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition"
            >
              <input
                type="radio"
                name={question.id}
                value={option}
                checked={value === option}
                onChange={(e) => onChange(e.target.value)}
                className="mr-3"
              />
              <span className="text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      )

    case 'rating':
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            {question.scale?.labels?.map((label, index) => (
              <label
                key={index}
                className="flex flex-col items-center cursor-pointer"
              >
                <input
                  type="radio"
                  name={question.id}
                  value={index + 1}
                  checked={value === index + 1}
                  onChange={(e) => onChange(parseInt(e.target.value))}
                  className="mb-2"
                />
                <span className="text-sm text-gray-600 text-center">{label}</span>
              </label>
            ))}
          </div>
        </div>
      )

    case 'true_false':
      return (
        <div className="flex gap-4">
          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition flex-1">
            <input
              type="radio"
              name={question.id}
              value="true"
              checked={value === true}
              onChange={() => onChange(true)}
              className="mr-3"
            />
            <span className="text-gray-700">True</span>
          </label>
          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition flex-1">
            <input
              type="radio"
              name={question.id}
              value="false"
              checked={value === false}
              onChange={() => onChange(false)}
              className="mr-3"
            />
            <span className="text-gray-700">False</span>
          </label>
        </div>
      )

    default:
      return null
  }
}

function ResultsView({ assessment, answers }: {
  assessment: any
  answers: Record<string, any>
}) {
  const router = useRouter()

  // Simple scoring logic - this would be more sophisticated in production
  const getScore = () => {
    let total = 0
    let maxScore = 0
    
    assessment.questions.forEach((q: Question) => {
      if (q.type === 'rating' && q.scale) {
        maxScore += q.scale.max
        total += answers[q.id] || 0
      } else {
        maxScore += 1
        total += answers[q.id] ? 1 : 0
      }
    })
    
    return Math.round((total / maxScore) * 100)
  }

  const score = getScore()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Assessment Complete!
            </h1>
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-xl text-gray-600">
              Thank you for completing the {assessment.title}
            </p>
          </div>

          <div className="bg-primary-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Results</h2>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{score}%</div>
              <p className="text-gray-600">Overall Score</p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <p className="text-gray-700">
                  You've completed all {assessment.questions.length} questions
                </p>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <p className="text-gray-700">
                  Your responses have been saved for future reference
                </p>
              </div>
              <div className="flex items-start">
                <span className="text-blue-500 mr-2">💡</span>
                <p className="text-gray-700">
                  Sign up for a free account to access detailed analysis and personalized recommendations
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/auth/signup')}
              className="btn-primary px-8 py-3"
            >
              Sign Up for Detailed Results
            </button>
            <button
              onClick={() => router.push('/')}
              className="btn-outline px-8 py-3"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}