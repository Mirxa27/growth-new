import { Brain, Target, TrendingUp, Users, Zap, Shield } from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Insights',
    description: 'Get personalized recommendations and insights powered by advanced AI algorithms.',
  },
  {
    icon: Target,
    title: 'Tailored Assessments',
    description: 'Take assessments designed by experts to reveal your strengths and areas for growth.',
  },
  {
    icon: TrendingUp,
    title: 'Track Progress',
    description: 'Monitor your improvement over time with detailed analytics and progress tracking.',
  },
  {
    icon: Users,
    title: 'Community Learning',
    description: 'Connect with peers and mentors in our supportive learning community.',
  },
  {
    icon: Zap,
    title: 'Instant Results',
    description: 'Get immediate feedback and actionable insights from every assessment.',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your data is secure and private. We never share your personal information.',
  },
]

export function Features() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose All-App?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our platform combines cutting-edge technology with expert-designed content
            to help you achieve your personal and professional goals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}