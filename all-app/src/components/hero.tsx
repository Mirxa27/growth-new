import Link from 'next/link'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100 py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
            Discover Your Potential with <span className="text-blue-600">All-App</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto animate-slide-up">
            Take comprehensive assessments, explore personalized courses, and unlock your true capabilities
            with our AI-powered learning platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Link
              href="#assessments"
              className="btn-primary px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              Try Free Assessments
            </Link>
            <Link
              href="/auth/signup"
              className="btn-outline px-8 py-4 text-lg font-semibold rounded-lg"
            >
              Create Account
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">50+</div>
              <div className="text-sm text-gray-600">Assessments</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">100K+</div>
              <div className="text-sm text-gray-600">Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">AI</div>
              <div className="text-sm text-gray-600">Powered</div>
            </div>
          </div>
        </div>
      </div>
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
    </section>
  )
}