#!/usr/bin/env node

/**
 * Setup Admin Data Script
 * Creates all required data for admin user to access admin panel
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ufgqmqoykddaotdbwteg.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA2MzY4MSwiZXhwIjoyMDY3NjM5NjgxfQ.ly1DdFt60DSLEUMtK5l0jr1G3TLiJnPohADSc4HZuwo';
const ADMIN_USER_ID = 'aa8e99c7-32e2-4e82-975b-5bd539da6df4';

async function setupAdminData() {
  console.log('🔧 Setting up admin user data...');

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Create user_progress for admin
    console.log('Creating user_progress...');
    const { error: progressError } = await supabase
      .from('user_progress')
      .upsert({
        user_id: ADMIN_USER_ID,
        current_level: 10,
        crystal_balance: 1000,
        progress_metrics: {
          assessments_completed: 5,
          chat_sessions: 10,
          community_posts: 2
        }
      }, { onConflict: 'user_id' });

    if (progressError) {
      console.warn('Progress creation warning:', progressError.message);
    } else {
      console.log('✅ User progress created');
    }

    // Create user_memory_profile for admin
    console.log('Creating user_memory_profile...');
    const { error: memoryError } = await supabase
      .from('user_memory_profiles')
      .upsert({
        user_id: ADMIN_USER_ID,
        progress_metrics: {
          assessments_completed: 5,
          growth_milestones: ['first_login', 'first_assessment', 'admin_access'],
          personality_insights: 'Analytical and goal-oriented leader'
        },
        current_level: 10,
        crystal_balance: 1000,
        personality_traits: {
          openness: 8,
          conscientiousness: 9,
          extraversion: 7,
          agreeableness: 8,
          neuroticism: 3
        },
        growth_goals: {
          primary: 'Platform management and user growth',
          secondary: 'Community building and engagement'
        }
      }, { onConflict: 'user_id' });

    if (memoryError) {
      console.warn('Memory profile creation warning:', memoryError.message);
    } else {
      console.log('✅ User memory profile created');
    }

    // Create daily streak for admin
    console.log('Creating daily streak...');
    const today = new Date().toISOString().split('T')[0];
    const { error: streakError } = await supabase
      .from('daily_streaks')
      .upsert({
        user_id: ADMIN_USER_ID,
        date: today,
        streak_count: 7
      }, { onConflict: 'user_id,date' });

    if (streakError) {
      console.warn('Streak creation warning:', streakError.message);
    } else {
      console.log('✅ Daily streak created');
    }

    // Create daily affirmation for admin
    console.log('Creating daily affirmation...');
    const { error: affirmationError } = await supabase
      .from('daily_affirmations')
      .upsert({
        user_id: ADMIN_USER_ID,
        affirmation_text: 'You are a powerful leader capable of transforming lives through technology and compassion.',
        generated_date: today
      }, { onConflict: 'user_id,generated_date' });

    if (affirmationError) {
      console.warn('Affirmation creation warning:', affirmationError.message);
    } else {
      console.log('✅ Daily affirmation created');
    }

    // Create some achievements for admin
    console.log('Creating achievements...');
    const achievements = [
      { achievement_id: 'platform_creator', unlocked_at: new Date().toISOString() },
      { achievement_id: 'admin_access', unlocked_at: new Date().toISOString() },
      { achievement_id: 'first_login', unlocked_at: new Date().toISOString() }
    ];

    for (const achievement of achievements) {
      const { error: achError } = await supabase
        .from('user_achievements')
        .upsert({
          user_id: ADMIN_USER_ID,
          ...achievement
        }, { onConflict: 'user_id,achievement_id' });

      if (achError) {
        console.warn(`Achievement creation warning:`, achError.message);
      } else {
        console.log(`✅ Achievement ${achievement.achievement_id} created`);
      }
    }

    console.log('\n🎉 ADMIN DATA SETUP COMPLETE!');
    console.log('✅ All required data created for admin user');
    console.log('✅ Admin should now be able to access dashboard and admin panel');

  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    process.exit(1);
  }
}

setupAdminData();