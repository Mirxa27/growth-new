import { useEffect, useMemo, useState } from 'react'

type Assessment = {
  id: string
  type: 'personality' | 'knowledge' | 'aptitude' | 'learning-style' | 'habit' | 'interest'
  title: string
  description: string
  free: boolean
}

export default function Assessments() {
  const [serverItems, setServerItems] = useState<Assessment[] | null>(null)
  useEffect(() => {
    fetch('/api/assessments/free').then(r => r.json()).then(setServerItems).catch(() => setServerItems(null))
  }, [])

  const items = useMemo<Assessment[]>(
    () => [
      { id: 'pers-1', type: 'personality', title: 'Big Five Snapshot', description: 'Brief personality profile.', free: true },
      { id: 'know-1', type: 'knowledge', title: 'General Knowledge Quiz', description: '10-question mixed trivia.', free: true },
      { id: 'apt-1', type: 'aptitude', title: 'Logical Aptitude Test', description: 'Assess logical reasoning.', free: true },
      { id: 'learn-1', type: 'learning-style', title: 'Learning Style Finder', description: 'Visual/Auditory/Read-Write/Kinesthetic.', free: true },
      { id: 'habit-1', type: 'habit', title: 'Study Habits Diagnostic', description: 'Identify study blockers.', free: true },
      { id: 'interest-1', type: 'interest', title: 'Career Interests Profiler', description: 'Holland Code preview.', free: true },
    ],
    []
  )

  const list = serverItems ?? items
  return (
    <main style={{ padding: 24 }}>
      <h1>Free Assessments</h1>
      <p>Try any of these without signing up.</p>
      <ul>
        {list.map((a) => (
          <li key={a.id} style={{ margin: '12px 0' }}>
            <strong>{a.title}</strong> — {a.description}
            <a href={`/run?id=${encodeURIComponent(a.id)}`} style={{ marginLeft: 8 }}>Start</a>
          </li>
        ))}
      </ul>
    </main>
  )
}

