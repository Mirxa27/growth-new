import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useDailyInsight = () => {
  const { user } = useAuth();
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDailyInsight();
    }
  }, [user]);

  const fetchDailyInsight = async () => {
    try {
      setLoading(true);

      // Try to fetch today's insight from database first
      const today = new Date().toISOString().split('T')[0];
      const { data: existingInsight, error: fetchError } = await supabase
        .from('daily_insights')
        .select('insight_text')
        .or(`user_id.eq.${user?.id},user_id.is.null`)
        .eq('generated_date', today)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!fetchError && existingInsight) {
        setInsight(existingInsight.insight_text);
        return;
      }

      // If no insight exists for today, generate and save a new one
      const insights = [
        'The journey of self-discovery is not about finding yourself, but creating yourself.',
        'Your greatest strength often lies hidden within your greatest challenge.',
        'Healing happens in the space between accepting what is and believing in what could be.',
        'The relationship you have with yourself sets the tone for every other relationship.',
        'Growth requires both the courage to look within and the compassion to love what you find.',
        'Every challenge you face is an opportunity to discover something new about yourself.',
        'Your intuition is a powerful guide - learn to trust it while staying grounded.',
        'Self-compassion is not selfish; it\'s essential for sustainable growth.',
        'The most meaningful changes happen when you align your actions with your deepest values.',
        'Your past experiences have shaped you, but they don\'t define your future possibilities.'
      ];

      const randomInsight = insights[Math.floor(Math.random() * insights.length)];

      // Save the new insight to database
      const { error: insertError } = await supabase
        .from('daily_insights')
        .insert({
          user_id: user?.id,
          insight_text: randomInsight,
          insight_type: 'inspiration',
          generated_date: today
        });

      if (insertError) {
        console.warn('Failed to save daily insight to database:', insertError);
      }

      setInsight(randomInsight);
    } catch (error) {
      console.error('Error fetching daily insight:', error);
      // Fallback insight
      setInsight('Today is a new opportunity to grow and discover something beautiful about yourself.');
    } finally {
      setLoading(false);
    }
  };

  return { insight, loading, refetch: fetchDailyInsight };
};