
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sparkles, Download, Share, BookOpen, Heart, Target, MessageSquare } from 'lucide-react';

interface AnalysisResultsProps {
  analysis: {
    core_pattern: string;
    hidden_potential: string;
    actionable_steps: string[];
    affirmations: string[];
    encouragement: string;
  };
  exploration: {
    title: string;
    description: string;
  };
  onClose: () => void;
  onSaveToJournal?: () => void;
}

export const AnalysisResults = ({ analysis, exploration, onClose, onSaveToJournal }: AnalysisResultsProps) => {
  const handleDownloadPDF = () => {
    // This would generate a PDF of the analysis
    console.log('Downloading PDF...');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `My ${exploration.title} Analysis`,
          text: analysis.core_pattern,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="text-center mb-8">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold gradient-text mb-2">Your Analysis is Ready</h1>
          <p className="text-muted-foreground">Insights from your Higher Self</p>
          <Badge variant="secondary" className="mt-2">
            {exploration.title}
          </Badge>
        </div>

        <div className="space-y-6">
          {/* Core Pattern */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20 text-primary">
                  <Target className="h-5 w-5" />
                </div>
                Core Pattern
              </CardTitle>
              <CardDescription>
                The main theme discovered in your responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed">{analysis.core_pattern}</p>
            </CardContent>
          </Card>

          {/* Hidden Potential */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/20 text-secondary">
                  <Sparkles className="h-5 w-5" />
                </div>
                Hidden Potential
              </CardTitle>
              <CardDescription>
                Untapped strengths and opportunities within you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed">{analysis.hidden_potential}</p>
            </CardContent>
          </Card>

          {/* Actionable Steps */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20 text-green-500">
                  <Target className="h-5 w-5" />
                </div>
                Actionable Steps
              </CardTitle>
              <CardDescription>
                Concrete actions you can take right now
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.actionable_steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg glass-surface">
                    <Badge variant="outline" className="min-w-[2rem] text-center">
                      {index + 1}
                    </Badge>
                    <p className="text-base">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Affirmations */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500/20 text-pink-500">
                  <Heart className="h-5 w-5" />
                </div>
                Personal Affirmations
              </CardTitle>
              <CardDescription>
                Positive statements tailored to your responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.affirmations.map((affirmation, index) => (
                  <div key={index} className="p-4 rounded-lg glass-surface border-l-4 border-pink-500/50">
                    <p className="text-base italic">"{affirmation}"</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Encouragement */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-500">
                  <MessageSquare className="h-5 w-5" />
                </div>
                Encouragement
              </CardTitle>
              <CardDescription>
                A message of support from your Higher Self
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed italic">{analysis.encouragement}</p>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            onClick={onSaveToJournal}
            variant="outline"
            className="glass-button"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Save to Journal
          </Button>
          
          <Button
            onClick={handleDownloadPDF}
            variant="outline"
            className="glass-button"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          
          <Button
            onClick={handleShare}
            variant="outline"
            className="glass-button"
          >
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          
          <Button
            onClick={onClose}
            className="bg-primary hover:bg-primary/90"
          >
            Continue Journey
          </Button>
        </div>
      </div>
    </div>
  );
};
