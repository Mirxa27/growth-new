'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MobileNav } from './mobile-nav'

const navLinks = [
  { href: '/assessments', label: 'Assessments' },
  { href: '/courses', label: 'Courses' },
  { href: '/about', label: 'About' },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 bg-white border-b backdrop-blur-lg bg-white/90">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              All-App
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-gray-700 hover:text-blue-600 transition ${
                  pathname === link.href ? 'text-blue-600' : ''
                }`}
              >
                {link.label}
              </Link>
            ))}
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
    </header>
  )
}