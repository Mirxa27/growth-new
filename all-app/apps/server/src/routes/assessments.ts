import express from 'express'
import { z } from 'zod'
import { getSupabaseServiceClient } from '../supabase'

const router = express.Router()

router.get('/free', async (_req, res) => {
  // Return preset free assessments (no auth required)
  res.json([
    { id: 'pers-1', type: 'personality', title: 'Big Five Snapshot' },
    { id: 'know-1', type: 'knowledge', title: 'General Knowledge Quiz' },
    { id: 'apt-1', type: 'aptitude', title: 'Logical Aptitude Test' },
    { id: 'learn-1', type: 'learning-style', title: 'Learning Style Finder' },
    { id: 'habit-1', type: 'habit', title: 'Study Habits Diagnostic' },
    { id: 'interest-1', type: 'interest', title: 'Career Interests Profiler' },
  ])
})

const createSchema = z.object({
  title: z.string().min(3),
  type: z.enum(['personality', 'knowledge', 'aptitude', 'learning-style', 'habit', 'interest']),
  content: z.any(),
  audience: z.enum(['visitor', 'user']).default('visitor'),
})

router.post('/', async (req, res) => {
  try {
    const body = createSchema.parse(req.body)
    const supabase = getSupabaseServiceClient()
    const { data, error } = await supabase.from('assessments').insert(body).select().single()
    if (error) throw error
    res.json(data)
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

export default router

