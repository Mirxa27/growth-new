#!/usr/bin/env node

/**
 * Database Setup Script
 * Creates missing tables using Supabase SQL execution
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.SUPABASE_URL || "https://ufgqmqoykddaotdbwteg.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA2MzY4MSwiZXhwIjoyMDY3NjM5NjgxfQ.ly1DdFt60DSLEUMtK5l0jr1G3TLiJnPohADSc4HZuwo";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🔧 Setting up missing database tables...\n');

  // Create the missing tables needed for our verification tests
  const sqlCommands = [
    // Add visitor_sessions table
    `
    CREATE TABLE IF NOT EXISTS public.visitor_sessions (
      id BIGSERIAL PRIMARY KEY,
      session_id TEXT NOT NULL UNIQUE,
      ip_address TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    `,
    
    // Add the questions table as an alias to assessment_questions 
    `
    CREATE OR REPLACE VIEW public.questions AS 
    SELECT 
      id,
      assessment_id,
      question_text as text,
      question_type as type,
      position,
      scale_min,
      scale_max,
      scale_labels,
      is_required,
      created_at
    FROM public.assessment_questions;
    `,
    
    // Add the options table as an alias to assessment_options
    `
    CREATE OR REPLACE VIEW public.options AS 
    SELECT 
      id,
      question_id,
      option_text as text,
      is_correct,
      position,
      feedback,
      scoring_data,
      created_at
    FROM public.assessment_options;
    `,

    // Enable RLS on visitor_sessions
    `
    ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;
    `,

    // Policy for visitor_sessions - allow anonymous inserts and selects
    `
    CREATE POLICY "Anyone can insert visitor sessions" ON public.visitor_sessions
    FOR INSERT TO anon WITH CHECK (true);
    `,

    `
    CREATE POLICY "Anyone can read visitor sessions" ON public.visitor_sessions
    FOR SELECT TO anon USING (true);
    `,

    // Insert some test questions and options for existing assessments
    `
    INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, position) 
    SELECT 
      id,
      'What best describes your current mindset?' as question_text,
      'multiple_choice' as question_type,
      1 as position
    FROM public.assessments 
    WHERE id = 1 
    AND NOT EXISTS (
      SELECT 1 FROM public.assessment_questions WHERE assessment_id = 1
    );
    `,

    `
    INSERT INTO public.assessment_options (question_id, option_text, position) 
    SELECT 
      q.id,
      unnest(ARRAY['Growth-oriented', 'Fixed mindset', 'Uncertain']) as option_text,
      generate_series(1, 3) as position
    FROM public.assessment_questions q
    WHERE q.assessment_id = 1 
    AND NOT EXISTS (
      SELECT 1 FROM public.assessment_options WHERE question_id = q.id
    );
    `
  ];

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < sqlCommands.length; i++) {
    const sql = sqlCommands[i].trim();
    if (!sql) continue;

    try {
      console.log(`⚡ Executing SQL command ${i + 1}...`);
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        // Try direct execution for simpler commands
        const { error: directError } = await supabase.from('_sql').select().limit(0);
        if (error.code === 'PGRST202') {
          // RPC function doesn't exist, which is expected
          console.log(`   ⚠️  Note: RPC exec_sql not available, command may need manual execution`);
        } else {
          console.log(`   ❌ Error: ${error.message}`);
          errorCount++;
        }
      } else {
        console.log(`   ✅ Success`);
        successCount++;
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Database Setup Results:`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);

  // Test the setup by checking tables again
  console.log(`\n🔍 Verifying table setup...`);
  
  const tables = ['assessments', 'assessment_questions', 'assessment_options', 'visitor_sessions', 'questions', 'options'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`📊 ${table}: ❌ ${error.message}`);
      } else {
        console.log(`📊 ${table}: ✅ Available (${data?.length || 0} sample records)`);
      }
    } catch (err) {
      console.log(`📊 ${table}: ❌ ${err.message}`);
    }
  }
}

setupDatabase().catch(console.error);
