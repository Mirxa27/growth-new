import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Brain, 
  Sparkles, 
  Target, 
  Heart, 
  CheckCircle 
} from 'lucide-react';

interface Analysis {
  corePattern: string;
  hiddenPotential: string;
  actionableSteps: string[];
  affirmations: string[];
  encouragement: string;
}

interface AnalysisResultsProps {
  analysis: Analysis;
  onComplete: () => void;
}

export const AnalysisResults = ({ analysis, onComplete }: AnalysisResultsProps) => {
  return (
    <div className="space-y-6">
      <Card className="glass border-card-border text-center">
        <CardContent className="p-8">
          <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Your Exploration Insights</h1>
          <p className="text-muted-foreground">
            Here are the insights from your Higher Self based on your reflections.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Core Pattern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{analysis.corePattern}</p>
          </CardContent>
        </Card>

        <Card className="glass border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-secondary" />
              Hidden Potential
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{analysis.hiddenPotential}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            Actionable Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {analysis.actionableSteps.map((step, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                <span className="text-sm">{step}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="glass border-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            Personalized Affirmations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {analysis.affirmations.map((affirmation, index) => (
              <li key={index} className="text-sm italic">
                "{affirmation}"
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="glass border-card-border text-center">
        <CardContent className="p-8">
          <p className="text-lg italic mb-6">"{analysis.encouragement}"</p>
          <Button onClick={onComplete} className="bg-gradient-primary">
            Complete Exploration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};