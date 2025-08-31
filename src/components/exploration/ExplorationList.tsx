import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Compass, 
  Clock, 
  Star, 
  Brain, 
  Heart, 
  TrendingUp, 
  Sparkles 
} from 'lucide-react';

interface Exploration {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  estimated_duration: number;
  crystal_reward: number;
}

interface ExplorationListProps {
  explorations: Exploration[];
  onSelect: (id: string) => void;
}

export const ExplorationList: React.FC<ExplorationListProps> = ({ explorations, onSelect }) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'self-discovery': return <Brain className="w-4 h-4" />;
      case 'relationships': return <Heart className="w-4 h-4" />;
      case 'career': return <TrendingUp className="w-4 h-4" />;
      case 'healing': return <Sparkles className="w-4 h-4" />;
      default: return <Compass className="w-4 h-4" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {explorations.map((exploration) => (
        <div key={exploration.id} className="glass-card border-glass p-6 flex flex-col">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                {getCategoryIcon(exploration.category)}
              </div>
              <Badge variant="secondary" className="glass">{exploration.category}</Badge>
            </div>
            <h3 className="font-semibold text-lg leading-tight">{exploration.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {exploration.description}
            </p>
          </div>
          
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {exploration.estimated_duration} min
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              {exploration.crystal_reward}
            </div>
          </div>

          <Button 
            onClick={() => onSelect(exploration.id)} 
            className="w-full mt-4 bg-gradient-primary"
          >
            Start Exploration
          </Button>
        </div>
      ))}
    </div>
  );
};