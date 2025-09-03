'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FileText, BookOpen, User, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function BottomTabBar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const tabs = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Assess', href: '/assessments', icon: FileText },
    { name: 'AI', href: '/ai-chat', icon: Sparkles },
    { name: 'Learn', href: '/courses', icon: BookOpen },
    { name: 'Profile', href: user ? '/profile' : '/auth/signin', icon: User },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
      <div className="grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-col items-center justify-center space-y-1 ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-xs">{tab.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}