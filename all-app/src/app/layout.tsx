import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { Providers } from '@/components/providers'
import { BottomTabBar } from '@/components/bottom-tab-bar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'All-App - Assessments, Courses & Learning',
  description: 'Comprehensive platform for assessments, quizzes, and courses with AI-powered content generation',
  keywords: 'assessments, quizzes, courses, learning, education, AI',
  authors: [{ name: 'All-App Team' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'All-App',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} pb-16 md:pb-0`}>
        <Providers>
          {children}
          <BottomTabBar />
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  )
}