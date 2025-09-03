import Link from 'next/link'
import { Clock, FileText } from 'lucide-react'

interface AssessmentCardProps {
  assessment: {
    id: string
    title: string
    description: string
    category: string
    duration: number
    questions: number
    icon: string
  }
}

export function AssessmentCard({ assessment }: AssessmentCardProps) {
  return (
    <Link href={`/assessments/free/${assessment.category}`}>
      <div className="card h-full hover:shadow-lg transition-all duration-300 cursor-pointer group">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <span className="text-4xl">{assessment.icon}</span>
            <span className="text-sm text-gray-500 bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              Free
            </span>
          </div>
          <h3 className="card-title mt-4 group-hover:text-blue-600 transition-colors">
            {assessment.title}
          </h3>
          <p className="card-description mt-2">
            {assessment.description}
          </p>
        </div>
        <div className="card-content">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{assessment.duration} min</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span>{assessment.questions} questions</span>
            </div>
          </div>
        </div>
        <div className="card-footer">
          <span className="text-blue-600 font-medium group-hover:underline">
            Start Assessment →
          </span>
        </div>
      </div>
    </Link>
  )
}