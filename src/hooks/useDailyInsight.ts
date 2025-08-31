import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface DailyInsight {
  id: string;
  insight_text: string;
  category: string;
}

export const useDailyInsight = () => {
  const { user } = useAuth();
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDailyInsight();
  }, [user]);

  const fetchDailyInsight = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, use a hardcoded insight since the table doesn't exist in the schema yet
      // This will be replaced with actual database queries once the table is created
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
      setInsight(randomInsight);

    } catch (error) {
      console.error('Error fetching daily insight:', error);
      setError('Unable to load daily insight. Please try again later.');
      setInsight('Today is a new opportunity to grow and discover something beautiful about yourself.');
    } finally {
      setLoading(false);
    }
  };

  return {
    insight,
    loading,
    error,
    refetch: fetchDailyInsight
  };
};