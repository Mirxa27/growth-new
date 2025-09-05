/**
 * Migration Runner Utility
 * Executes the voice_sessions table migration
 */

import { supabase } from '@/integrations/supabase/client';

export async function runVoiceSessionsMigration() {
  console.log('Starting voice_sessions migration...');
  
  const migrationSteps = [
    {
      name: 'Create voice_agent_configs table',
      sql: `
        CREATE TABLE IF NOT EXISTS public.voice_agent_configs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL DEFAULT 'Default Voice Agent',
          provider TEXT NOT NULL DEFAULT 'openai',
          model TEXT NOT NULL DEFAULT 'gpt-realtime-2025-08-28',
          voice TEXT NOT NULL DEFAULT 'alloy',
          temperature DECIMAL(3,2) NOT NULL DEFAULT 0.70,
          instructions TEXT DEFAULT 'You are a helpful AI assistant.',
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
    },
    {
      name: 'Create voice_sessions table',
      sql: `
        CREATE TABLE IF NOT EXISTS public.voice_sessions (
          id TEXT PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          config_id UUID REFERENCES public.voice_agent_configs(id) ON DELETE SET NULL,
          started_at TIMESTAMPTZ DEFAULT NOW(),
          ended_at TIMESTAMPTZ,
          transcript JSONB DEFAULT '[]'::jsonb,
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
    },
    {
      name: 'Insert default voice configuration',
      sql: `
        INSERT INTO public.voice_agent_configs (name, provider, model, voice, temperature, instructions, is_active)
        SELECT 'Default Voice Agent', 'openai', 'gpt-realtime-2025-08-28', 'alloy', 0.70, 
               'You are a helpful AI assistant focused on personal growth and well-being.', true
        WHERE NOT EXISTS (SELECT 1 FROM public.voice_agent_configs LIMIT 1)
      `
    }
  ];

  const results = {
    success: false,
    message: '',
    errors: [] as string[]
  };

  // Note: Supabase client doesn't support direct DDL execution
  // This would need to be run through Supabase dashboard or using service role key
  
  try {
    // Test if tables exist
    const { error: configError } = await supabase
      .from('voice_agent_configs')
      .select('id')
      .limit(1);
    
    const { error: sessionError } = await supabase
      .from('voice_sessions')
      .select('id')
      .limit(1);
    
    if (configError?.code === '42P01') {
      results.errors.push('voice_agent_configs table does not exist');
    }
    
    if (sessionError?.code === '42P01') {
      results.errors.push('voice_sessions table does not exist');
    }
    
    if (results.errors.length > 0) {
      results.message = 'Tables need to be created. Please run the SQL migration in Supabase dashboard.';
      results.success = false;
    } else {
      results.message = 'All required tables exist!';
      results.success = true;
    }
  } catch (error) {
    results.errors.push(error instanceof Error ? error.message : 'Unknown error');
    results.message = 'Failed to check table status';
  }
  
  return results;
}

/**
 * Check if voice tables exist
 */
export async function checkVoiceTables() {
  const tables = {
    voice_agent_configs: false,
    voice_sessions: false
  };
  
  try {
    // Check voice_agent_configs
    const { error: configError } = await supabase
      .from('voice_agent_configs')
      .select('count')
      .limit(1);
    
    tables.voice_agent_configs = !configError || configError.code !== '42P01';
    
    // Check voice_sessions
    const { error: sessionError } = await supabase
      .from('voice_sessions')
      .select('count')
      .limit(1);
    
    tables.voice_sessions = !sessionError || sessionError.code !== '42P01';
  } catch (error) {
    console.error('Error checking tables:', error);
  }
  
  return tables;
}

/**
 * Get migration SQL for manual execution
 */
export function getMigrationSQL(): string {
  return `
-- VOICE SESSIONS MIGRATION
-- Run this in Supabase SQL Editor

-- Create voice_agent_configs table
CREATE TABLE IF NOT EXISTS public.voice_agent_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Default Voice Agent',
    provider TEXT NOT NULL DEFAULT 'openai',
    model TEXT NOT NULL DEFAULT 'gpt-realtime-2025-08-28',
    voice TEXT NOT NULL DEFAULT 'alloy',
    temperature DECIMAL(3,2) NOT NULL DEFAULT 0.70,
    instructions TEXT DEFAULT 'You are a helpful AI assistant.',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create voice_sessions table  
CREATE TABLE IF NOT EXISTS public.voice_sessions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    config_id UUID REFERENCES public.voice_agent_configs(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    transcript JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add default configuration
INSERT INTO public.voice_agent_configs (name, provider, model, voice, temperature, instructions, is_active)
SELECT 'Default Voice Agent', 'openai', 'gpt-realtime-2025-08-28', 'alloy', 0.70, 
       'You are a helpful AI assistant focused on personal growth and well-being.', true
WHERE NOT EXISTS (SELECT 1 FROM public.voice_agent_configs LIMIT 1);

-- Enable RLS
ALTER TABLE public.voice_agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view voice configs" ON public.voice_agent_configs FOR SELECT USING (true);
CREATE POLICY "Users can view own voice sessions" ON public.voice_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own voice sessions" ON public.voice_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own voice sessions" ON public.voice_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_voice_sessions_user_id ON public.voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_started_at ON public.voice_sessions(started_at DESC);
  `.trim();
}
