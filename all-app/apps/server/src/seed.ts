import { getSupabaseServiceClient } from './supabase'

async function main() {
  const supabase = getSupabaseServiceClient()
  const free = [
    { title: 'Big Five Snapshot', type: 'personality', audience: 'visitor', content: { items: [] } },
    { title: 'General Knowledge Quiz', type: 'knowledge', audience: 'visitor', content: { items: [] } },
    { title: 'Logical Aptitude Test', type: 'aptitude', audience: 'visitor', content: { items: [] } },
    { title: 'Learning Style Finder', type: 'learning-style', audience: 'visitor', content: { items: [] } },
    { title: 'Study Habits Diagnostic', type: 'habit', audience: 'visitor', content: { items: [] } },
    { title: 'Career Interests Profiler', type: 'interest', audience: 'visitor', content: { items: [] } },
  ]

  const users: Array<{ title: string; type: string }> = Array.from({ length: 20 }).map((_, i) => ({
    title: `User Assessment ${i + 1}`,
    type: 'knowledge',
  }))

  const userRows = users.map((u) => ({ ...u, audience: 'user', content: { items: [] } }))

  const { error: e1 } = await supabase.from('assessments').insert([...free, ...userRows])
  if (e1) throw e1
  console.log('Seeded assessments')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

