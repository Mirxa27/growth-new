import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

const useDailyInsight = () => {
  const { user } = useAuth();
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsight = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      // In a real app, you would fetch this from Supabase
      // For now, we'll use a static insight
      setTimeout(() => {
        setInsight("Today is a great day to practice self-compassion. Remember to be as kind to yourself as you are to others.");
        setLoading(false);
      }, 1000);
    };

    fetchInsight();
  }, [user]);

  return { insight, loading };
};

export default useDailyInsight;