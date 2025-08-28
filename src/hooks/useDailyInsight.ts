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
      
      // Generate a random insight (fallback since daily_insights table may not exist yet)
      const insights = [
        'The journey of self-discovery is not about finding yourself, but creating yourself.',
        'Your greatest strength often lies hidden within your greatest challenge.',
        'Healing happens in the space between accepting what is and believing in what could be.',
        'The relationship you have with yourself sets the tone for every other relationship.',
        'Growth requires both the courage to look within and the compassion to love what you find.'
      ];
      
      const randomInsight = insights[Math.floor(Math.random() * insights.length)];

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