import type { Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'

export type AuthUser = {
  id: string
  email?: string
}

export async function getUserFromRequest(req: Request): Promise<AuthUser | null> {
  const authHeader = req.headers['authorization']
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) return null
  const supabaseUrl = process.env.SUPABASE_URL as string
  const anonKey = process.env.SUPABASE_ANON_KEY as string | undefined
  // Use anon for verification; safe server-side
  const supabase = createClient(supabaseUrl, anonKey || 'public-anon-key')
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return { id: data.user.id, email: data.user.email || undefined }
}

export async function requireUser(req: Request, res: Response, next: NextFunction) {
  const user = await getUserFromRequest(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  ;(req as any).user = user
  next()
}

