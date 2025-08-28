import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Star, Users, Sparkles, Play } from 'lucide-react';
import { MobileCard } from '@/components/responsive/MobileOptimized';

interface Exploration {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  estimated_duration: number;
  crystal_reward: number;
  is_active: boolean;
}

interface ExplorationListProps {
  explorations: Exploration[];
  onStartExploration: (exploration: Exploration) => void;
}

export const ExplorationList: React.FC<ExplorationListProps> = ({
  explorations,
  onStartExploration
}) => {
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'hsl(142, 71%, 45%)';
      case 'intermediate': return 'hsl(45, 93%, 47%)';
      case 'advanced': return 'hsl(346, 87%, 58%)';
      default: return 'hsl(220, 85%, 57%)';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'self-discovery': return Star;
      case 'relationships': return Users;
      case 'personal-growth': return Sparkles;
      default: return Star;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'self-discovery': return 'hsl(320, 85%, 65%)';
      case 'relationships': return 'hsl(346, 87%, 58%)';
      case 'personal-growth': return 'hsl(280, 70%, 60%)';
      default: return 'hsl(320, 85%, 65%)';
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {explorations.map((exploration) => {
        const IconComponent = getCategoryIcon(exploration.category);
        const categoryColor = getCategoryColor(exploration.category);
        
        return (
          <MobileCard 
            key={exploration.id} 
            className="hover:scale-105 transition-all duration-300 cursor-pointer group interactive"
          >
            <CardHeader>
              <div className="flex items-start justify-between mb-3">
                <div 
                  className="p-2 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${categoryColor}20` }}
                >
                  <IconComponent className="h-5 w-5" style={{ color: categoryColor }} />
                </div>
                <Badge 
                  variant="outline" 
                  className="glass text-xs"
                  style={{ 
                    borderColor: getDifficultyColor(exploration.difficulty_level),
                    color: getDifficultyColor(exploration.difficulty_level)
                  }}
                >
                  {exploration.difficulty_level}
                </Badge>
              </div>
              
              <CardTitle className="text-xl group-hover:text-primary transition-colors">
                {exploration.title}
              </CardTitle>
              <CardDescription className="text-base line-clamp-3">
                {exploration.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {exploration.estimated_duration} min
                </div>
                <div className="flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {exploration.crystal_reward} crystals
                </div>
              </div>
              
              <Button 
                onClick={() => onStartExploration(exploration)}
                className="w-full bg-gradient-primary hover:opacity-90 group-hover:shadow-lg transition-all micro-bounce"
              >
                <Play className="h-4 w-4 mr-2" />
                Begin Exploration
              </Button>
            </CardContent>
          </MobileCard>
        );
      })}
    </div>
  );
};