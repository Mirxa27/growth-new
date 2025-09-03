import express from 'express'
import { z } from 'zod'
import { getSupabaseServiceClient } from '../supabase'
import { requireUser } from '../auth'

const router = express.Router()

router.get('/assessments', async (req, res) => {
  const supabase = getSupabaseServiceClient()
  const id = req.query.id as string | undefined
  if (id) {
    const { data, error } = await supabase.from('assessments').select('*').eq('id', id).single()
    if (error) return res.status(404).json({ error: error.message })
    return res.json(data)
  }
  const { data, error } = await supabase.from('assessments').select('*').order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.get('/assessments/user', requireUser, async (_req, res) => {
  const supabase = getSupabaseServiceClient()
  const { data, error } = await supabase.from('assessments').select('*').eq('audience', 'user').order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3),
  type: z.string().min(3),
  audience: z.enum(['visitor', 'user']).default('visitor'),
  content: z.any(),
})

router.post('/assessments/upsert', async (req, res) => {
  try {
    const body = upsertSchema.parse(req.body)
    const supabase = getSupabaseServiceClient()
    const { data, error } = await supabase.from('assessments').upsert(body).select().single()
    if (error) throw error
    res.json(data)
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

router.get('/courses', async (_req, res) => {
  const supabase = getSupabaseServiceClient()
  const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

const upsertSimple = (table: 'tests' | 'explorations' | 'courses') => async (req: any, res: any) => {
  const supabase = getSupabaseServiceClient()
  const { id, ...rest } = req.body || {}
  const { data, error } = await supabase.from(table).upsert({ id, ...rest }).select().single()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
}

router.post('/tests/upsert', upsertSimple('tests'))
router.post('/explorations/upsert', upsertSimple('explorations'))
router.post('/courses/upsert', upsertSimple('courses'))

export default router

