
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Download, 
  Share, 
  BookOpen, 
  Heart, 
  Target, 
  MessageSquare,
  ArrowRight,
  Star
} from 'lucide-react';

interface AnalysisResultsProps {
  analysis: {
    aiGenerated?: boolean;
    content?: string;
    core_pattern?: string;
    hidden_potential?: string;
    actionable_steps?: string[];
    affirmations?: string[];
    encouragement?: string;
  };
  exploration: {
    title: string;
    description: string;
  };
  onClose: () => void;
  onSaveToJournal?: () => void;
  crystalsEarned?: number;
}

export const AnalysisResults = ({ 
  analysis, 
  exploration, 
  onClose, 
  onSaveToJournal,
  crystalsEarned = 100 
}: AnalysisResultsProps) => {
  const navigate = useNavigate();
  
  // Handle AI-generated content vs structured content
  const isAIGenerated = analysis.aiGenerated && analysis.content;
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
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text">Exploration Complete!</h1>
          </div>
          
          <div className="flex items-center justify-center gap-4">
            <Badge variant="outline" className="text-primary border-primary">
              {exploration.title}
            </Badge>
            <div className="flex items-center gap-1 text-accent">
              <Star className="w-4 h-4 fill-current" />
              <span className="font-semibold">{crystalsEarned} Crystals Earned!</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {isAIGenerated ? (
            /* AI-Generated Content */
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Your Higher Self Analysis
                </CardTitle>
                <CardDescription>
                  Deep insights and guidance from your inner wisdom
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-lg max-w-none">
                  <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                    {analysis.content}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Structured Content */
            <>
              {/* Core Pattern */}
              {analysis.core_pattern && (
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
              )}

              {/* Hidden Potential */}
              {analysis.hidden_potential && (
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
              )}

              {/* Actionable Steps */}
              {analysis.actionable_steps && analysis.actionable_steps.length > 0 && (
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
              )}

              {/* Affirmations */}
              {analysis.affirmations && analysis.affirmations.length > 0 && (
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
              )}

              {/* Encouragement */}
              {analysis.encouragement && (
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
              )}
            </>
          )}
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
            onClick={() => navigate('/explorations')}
            variant="outline"
            className="glass-button"
          >
            <Target className="h-4 w-4 mr-2" />
            Explore More
          </Button>
          
          <Button
            onClick={onClose}
            className="bg-primary hover:bg-primary/90"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Continue Journey
          </Button>
        </div>
      </div>
    </div>
  );
};
