
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Target, Save, Briefcase, Heart, Users, TrendingUp, Sparkles, DollarSign, Circle } from 'lucide-react';

interface BalanceArea {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  order_index: number;
}

interface BalanceWheelProps {
  onComplete: () => void;
}

export const BalanceWheel = ({ onComplete }: BalanceWheelProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [areas, setAreas] = useState<BalanceArea[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBalanceAreas();
  }, []);

  const fetchBalanceAreas = async () => {
    try {
      const { data, error } = await supabase
        .from('balance_wheel_areas')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      
      const initialScores: Record<string, number> = {};
      const initialNotes: Record<string, string> = {};
      
      (data || []).forEach(area => {
        initialScores[area.id] = 5;
        initialNotes[area.id] = '';
      });

      setAreas(data || []);
      setScores(initialScores);
      setNotes(initialNotes);
    } catch (error) {
      console.error('Error fetching balance areas:', error);
      toast({
        title: 'Error',
        description: 'Failed to load balance wheel areas.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (areaId: string, value: number[]) => {
    setScores(prev => ({ ...prev, [areaId]: value[0] }));
  };

  const handleNotesChange = (areaId: string, value: string) => {
    setNotes(prev => ({ ...prev, [areaId]: value }));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Save balance scores
      const scoreEntries = Object.entries(scores).map(([areaId, score]) => ({
        user_id: user.id,
        area_id: areaId,
        score,
        notes: notes[areaId] || null
      }));

      for (const entry of scoreEntries) {
        const { error } = await supabase
          .from('user_balance_scores')
          .upsert(entry, { onConflict: 'user_id,area_id' });

        if (error) throw error;
      }

      // Calculate focus areas (lowest scoring areas)
      const sortedAreas = areas
        .map(area => ({ ...area, score: scores[area.id] }))
        .sort((a, b) => a.score - b.score)
        .slice(0, 3)
        .map(area => area.name);

      // Update profile with growth areas
      await supabase
        .from('profiles')
        .update({ growth_areas: sortedAreas })
        .eq('user_id', user.id);

      toast({
        title: 'Balance Wheel Complete!',
        description: 'Your life balance assessment has been saved.'
      });

      onComplete();
    } catch (error) {
      console.error('Error saving balance scores:', error);
      toast({
        title: 'Error',
        description: 'Failed to save balance wheel results.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      Briefcase,
      Heart,
      Users,
      TrendingUp,
      Sparkles,
      DollarSign,
      Circle
    };
    return iconMap[iconName] || Circle;
  };

  const averageScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / areas.length;
  const balanceLevel = averageScore >= 8 ? 'Excellent' : averageScore >= 6 ? 'Good' : averageScore >= 4 ? 'Fair' : 'Needs Focus';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="text-center mb-8">
          <Target className="h-8 w-8 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold gradient-text mb-2">Life Balance Wheel</h1>
          <p className="text-muted-foreground">Rate your satisfaction in each life area (1-10)</p>
        </div>

        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Overall Balance: {balanceLevel}</span>
              <span className="text-sm text-muted-foreground">Average: {averageScore.toFixed(1)}/10</span>
            </CardTitle>
            <CardDescription>
              Focus on areas with lower scores for the greatest impact on your well-being.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {areas.map((area) => {
            const IconComponent = getIconComponent(area.icon);
            return (
              <Card key={area.id} className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${area.color}20`, color: area.color }}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg">{area.name}</h3>
                      <p className="text-sm text-muted-foreground font-normal">{area.description}</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Satisfaction Level</Label>
                      <span className="text-2xl font-bold" style={{ color: area.color }}>
                        {scores[area.id]}/10
                      </span>
                    </div>
                    <Slider
                      value={[scores[area.id]]}
                      onValueChange={(value) => handleScoreChange(area.id, value)}
                      max={10}
                      min={1}
                      step={1}
                      className="mb-4"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`notes-${area.id}`}>Notes (optional)</Label>
                    <Textarea
                      id={`notes-${area.id}`}
                      placeholder="What would make this area better?"
                      value={notes[area.id]}
                      onChange={(e) => handleNotesChange(area.id, e.target.value)}
                      className="mt-2 glass-input"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="bg-primary hover:bg-primary/90"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Complete Assessment
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
