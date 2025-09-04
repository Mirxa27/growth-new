'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Users, 
  FileText, 
  BookOpen, 
  TrendingUp,
  Activity,
  Award
} from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAssessments: 0,
    totalCourses: 0,
    totalAttempts: 0,
    recentActivity: []
  })

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      // Get user count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Get assessment count
      const { count: assessmentCount } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true })

      // Get course count
      const { count: courseCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })

      // Get attempt count
      const { count: attemptCount } = await supabase
        .from('assessment_attempts')
        .select('*', { count: 'exact', head: true })

      setStats({
        totalUsers: userCount || 0,
        totalAssessments: assessmentCount || 0,
        totalCourses: courseCount || 0,
        totalAttempts: attemptCount || 0,
        recentActivity: []
      })
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    }
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Assessments',
      value: stats.totalAssessments,
      icon: FileText,
      color: 'bg-green-500',
      change: '+5%'
    },
    {
      title: 'Courses',
      value: stats.totalCourses,
      icon: BookOpen,
      color: 'bg-purple-500',
      change: '+8%'
    },
    {
      title: 'Total Attempts',
      value: stats.totalAttempts,
      icon: Activity,
      color: 'bg-orange-500',
      change: '+15%'
    }
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome to your admin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.title} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                <stat.icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">{stat.change}</span>
              <span className="text-gray-600 ml-1">from last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary-50 transition">
            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">Create Assessment</p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary-50 transition">
            <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">Create Course</p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary-50 transition">
            <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">Generate with AI</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-gray-600 text-center py-8">No recent activity to display</p>
        </div>
      </div>
    </div>
  )
}