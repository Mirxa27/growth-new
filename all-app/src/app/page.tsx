import Link from 'next/link'
import { AssessmentCard } from '@/components/assessment-card'
import { Hero } from '@/components/hero'
import { Features } from '@/components/features'
import { VoiceAgent } from '@/components/voice-agent'
import { MobileNav } from '@/components/mobile-nav'

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
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white border-b backdrop-blur-lg bg-white/90">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-primary">
                All-App
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/assessments" className="text-gray-700 hover:text-primary transition">
                Assessments
              </Link>
              <Link href="/courses" className="text-gray-700 hover:text-primary transition">
                Courses
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-primary transition">
                About
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/auth/signin" className="btn-ghost px-4 py-2">
                Sign In
              </Link>
              <Link href="/auth/signup" className="btn-primary px-4 py-2">
                Get Started
              </Link>
            </div>
            <MobileNav />
          </div>
        </div>
      </nav>

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

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">All-App</h3>
              <p className="text-gray-400">
                Your comprehensive platform for assessments, learning, and personal growth.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/assessments" className="text-gray-400 hover:text-white">Assessments</Link></li>
                <li><Link href="/courses" className="text-gray-400 hover:text-white">Courses</Link></li>
                <li><Link href="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Connect</h4>
              <p className="text-gray-400 mb-4">
                Stay updated with our latest features and content.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-400">© 2024 All-App. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}