import Link from 'next/link'
import { AssessmentCard } from '@/components/assessment-card'
import { Hero } from '@/components/hero'
import { Features } from '@/components/features'
import { VoiceAgent } from '@/components/voice-agent'

const freeAssessments = [
  {
    id: '1',
    title: 'Personality Assessment',
    description: 'Discover your personality type and understand your unique traits',
    category: 'personality',
    duration: 15,
    questions: 25,
    icon: '🧠',
  },
  {
    id: '2',
    title: 'Career Aptitude Test',
    description: 'Find careers that match your skills, interests, and values',
    category: 'career',
    duration: 20,
    questions: 30,
    icon: '💼',
  },
  {
    id: '3',
    title: 'Learning Style Assessment',
    description: 'Identify your preferred learning methods and study strategies',
    category: 'learning-style',
    duration: 10,
    questions: 20,
    icon: '📚',
  },
  {
    id: '4',
    title: 'Emotional Intelligence Test',
    description: 'Assess your EQ and emotional awareness capabilities',
    category: 'eq',
    duration: 15,
    questions: 25,
    icon: '❤️',
  },
  {
    id: '5',
    title: 'Stress Management Evaluation',
    description: 'Evaluate your stress levels and discover coping strategies',
    category: 'stress',
    duration: 12,
    questions: 20,
    icon: '🧘',
  },
  {
    id: '6',
    title: 'Communication Style Quiz',
    description: 'Understand your communication preferences and improve interactions',
    category: 'communication',
    duration: 10,
    questions: 15,
    icon: '💬',
  },
]

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <Hero />

      {/* Features Section */}
      <Features />

      {/* Free Assessments Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Free Assessments - No Sign Up Required
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover insights about yourself with our professionally designed assessments.
              Start any assessment below without creating an account.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {freeAssessments.map((assessment) => (
              <AssessmentCard key={assessment.id} assessment={assessment} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/auth/signup"
              className="btn-primary px-8 py-3 text-lg"
            >
              Sign Up for 20+ Premium Assessments
            </Link>
          </div>
        </div>
      </section>

      {/* Voice Agent Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              AI Voice Assistant
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get personalized guidance and support through our AI-powered voice assistant.
              Ask questions, get recommendations, and navigate assessments with ease.
            </p>
          </div>
          <VoiceAgent />
        </div>
      </section>
    </>
  )
}