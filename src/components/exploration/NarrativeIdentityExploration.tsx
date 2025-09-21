import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  BookOpen, 
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Brain,
  Sparkles,
  Heart,
  Target,
  Lightbulb
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { MobileContainer } from '@/components/responsive/MobileOptimized';
import { supabase } from '@/integrations/supabase/client';
import { newMeAI } from '@/services/ai/newme-ai-service';
import { gamification } from '@/services/gamification/gamification-service';

interface NarrativeQuestion {
  id: string;
  question: string;
  category: 'identity' | 'relationships' | 'values' | 'challenges' | 'growth';
  prompt: string;
  followUp?: string;
}

const NARRATIVE_QUESTIONS: NarrativeQuestion[] = [
  {
    id: 'life_story',
    question: 'If you were to write the story of your life so far, what would be the main chapters?',
    category: 'identity',
    prompt: 'Think about the major phases, transitions, or turning points that have shaped who you are today.',
    followUp: 'What themes do you notice running through these chapters?'
  },
  {
    id: 'defining_moment',
    question: 'Describe a moment when you felt most authentically yourself. What was happening?',
    category: 'identity',
    prompt: 'Consider a time when you felt completely aligned with your values and true nature.',
    followUp: 'What made this moment feel so authentic to you?'
  },
  {
    id: 'family_narrative',
    question: 'What stories about your family or cultural background have shaped how you see yourself?',
    category: 'relationships',
    prompt: 'Think about the spoken and unspoken messages you received about who you should be.',
    followUp: 'Which of these stories serve you, and which might be limiting you?'
  },
  {
    id: 'core_values',
    question: 'What principles or values do you hold most dear, and how do they show up in your daily life?',
    category: 'values',
    prompt: 'Consider what you would never compromise on, even under pressure.',
    followUp: 'When have you felt most proud of staying true to these values?'
  },
  {
    id: 'recurring_challenge',
    question: 'What challenge or pattern keeps showing up in your life? How do you typically respond?',
    category: 'challenges',
    prompt: 'Think about situations that trigger similar reactions or feelings in you.',
    followUp: 'What might this pattern be trying to teach you about yourself?'
  },
  {
    id: 'strength_story',
    question: 'Tell me about a time when you overcame something difficult. What inner resources did you draw upon?',
    category: 'growth',
    prompt: 'Focus on your internal experience and what you discovered about your own capabilities.',
    followUp: 'How has this experience changed the way you see yourself?'
  },
  {
    id: 'relationship_patterns',
    question: 'What patterns do you notice in your close relationships? What roles do you tend to play?',
    category: 'relationships',
    prompt: 'Consider how you show up with family, friends, romantic partners, or colleagues.',
    followUp: 'Which of these patterns feel authentic to you, and which feel like old habits?'
  },
  {
    id: 'future_self',
    question: 'When you imagine your ideal future self, what qualities does she embody?',
    category: 'growth',
    prompt: 'Think beyond achievements to the kind of person you want to become.',
    followUp: 'What would need to shift in your current story to become this version of yourself?'
  },
  {
    id: 'hidden_story',
    question: 'What part of your story do you rarely share with others? What makes it feel significant to you?',
    category: 'identity',
    prompt: 'Consider experiences that have shaped you but that you keep private.',
    followUp: 'How might sharing this part of your story change your relationships?'
  },
  {
    id: 'rewrite_narrative',
    question: 'If you could rewrite one limiting story you tell yourself, what would the new version say?',
    category: 'growth',
    prompt: 'Think about a narrative that holds you back or makes you feel small.',
    followUp: 'What evidence do you have that this new story could be true?'
  }
];

interface ExplorationResponse {
  questionId: string;
  response: string;
  followUpResponse?: string;
  timestamp: string;
}

interface AnalysisResult {
  coreThemes: string[];
  narrativePatterns: string[];
  strengths: string[];
  growthAreas: string[];
  insights: string[];
  recommendations: string[];
}

export const NarrativeIdentityExploration = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<ExplorationResponse[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [followUpResponse, setFollowUpResponse] = useState('');
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const currentQuestionData = NARRATIVE_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + (showFollowUp ? 0.5 : 0)) / NARRATIVE_QUESTIONS.length) * 100;

  useEffect(() => {
    // Check if user has already completed this exploration
    checkExistingExploration();
  }, [user]);

  const checkExistingExploration = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('exploration_responses')
        .select('*')
        .eq('user_id', user.id)
        .eq('exploration_type', 'narrative_identity')
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        // User has previous responses, ask if they want to continue or start fresh
        const shouldContinue = confirm(
          'You have a previous narrative exploration. Would you like to continue where you left off, or start fresh?'
        );
        
        if (!shouldContinue) {
          // Load previous responses
          const previousResponses = data.map(item => ({
            questionId: item.question_id,
            response: item.response,
            followUpResponse: item.follow_up_response,
            timestamp: item.created_at
          }));
          setResponses(previousResponses);
          setCurrentQuestion(previousResponses.length);
        }
      }
    } catch (error) {
      console.error('Error checking existing exploration:', error);
    }
  };

  const handleResponseSubmit = async () => {
    if (!currentResponse.trim()) return;

    const responseData: ExplorationResponse = {
      questionId: currentQuestionData.id,
      response: currentResponse.trim(),
      followUpResponse: followUpResponse.trim() || undefined,
      timestamp: new Date().toISOString()
    };

    // Save response to database
    try {
      await supabase
        .from('exploration_responses')
        .insert({
          user_id: user!.id,
          exploration_type: 'narrative_identity',
          question_id: currentQuestionData.id,
          response: currentResponse.trim(),
          follow_up_response: followUpResponse.trim() || null,
        });

      // Record action for gamification
      await gamification.recordAction(user!.id, 'narrative_question_complete');
    } catch (error) {
      console.error('Error saving response:', error);
    }

    setResponses(prev => [...prev, responseData]);
    setCurrentResponse('');
    setFollowUpResponse('');
    setShowFollowUp(false);

    if (currentQuestion < NARRATIVE_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // All questions completed, start analysis
      await analyzeResponses([...responses, responseData]);
    }
  };

  const handleFollowUpSubmit = () => {
    setShowFollowUp(false);
    handleResponseSubmit();
  };

  const handlePrevious = () => {
    if (showFollowUp) {
      setShowFollowUp(false);
      setFollowUpResponse('');
    } else if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      // Load previous response
      const prevResponse = responses[currentQuestion - 1];
      if (prevResponse) {
        setCurrentResponse(prevResponse.response);
        setFollowUpResponse(prevResponse.followUpResponse || '');
      }
    }
  };

  const analyzeResponses = async (allResponses: ExplorationResponse[]) => {
    setIsAnalyzing(true);
    
    try {
      // Get user profile for context
      const userProfile = await newMeAI.getUserMemoryProfile(user!.id);
      if (!userProfile) throw new Error('Unable to load user profile');

      // Prepare responses for analysis
      const responseText = allResponses
        .map(r => `Q: ${NARRATIVE_QUESTIONS.find(q => q.id === r.questionId)?.question}\nA: ${r.response}${r.followUpResponse ? `\nFollow-up: ${r.followUpResponse}` : ''}`)
        .join('\n\n');

      // Create analysis prompt
      const analysisPrompt = `Analyze this narrative identity exploration for a ${userProfile.culturalContext.language === 'ar' ? 'Arabic-speaking' : 'English-speaking'} woman. 

Responses:
${responseText}

Provide analysis in this JSON format:
{
  "coreThemes": ["theme1", "theme2", "theme3"],
  "narrativePatterns": ["pattern1", "pattern2"],
  "strengths": ["strength1", "strength2", "strength3"],
  "growthAreas": ["area1", "area2"],
  "insights": ["insight1", "insight2", "insight3"],
  "recommendations": ["rec1", "rec2", "rec3"]
}

Focus on:
- Recurring themes across responses
- Narrative patterns that shape her identity
- Hidden strengths revealed in her stories
- Areas for growth and development
- Actionable insights for personal development
- Culturally sensitive recommendations`;

      // Use NewMe AI for analysis
      const context = {
        userId: user!.id,
        sessionId: `narrative_analysis_${Date.now()}`,
        userProfile,
        conversationGoal: 'narrative_identity_analysis'
      };

      const aiResult = await newMeAI.generateResponse(analysisPrompt, context);
      
      // Try to parse JSON from AI response
      let analysis: AnalysisResult;
      try {
        const jsonMatch = aiResult.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        // Fallback analysis if JSON parsing fails
        analysis = {
          coreThemes: ['Self-Discovery', 'Personal Growth', 'Authentic Living'],
          narrativePatterns: ['Seeking Authenticity', 'Overcoming Challenges'],
          strengths: ['Self-Reflection', 'Resilience', 'Growth Mindset'],
          growthAreas: ['Self-Compassion', 'Boundary Setting'],
          insights: [
            'Your responses show a deep commitment to personal growth',
            'You have strong self-awareness and reflective capabilities',
            'Your stories reveal hidden strengths you may not fully recognize'
          ],
          recommendations: [
            'Continue exploring your authentic self through regular reflection',
            'Practice self-compassion as you navigate growth',
            'Consider sharing your story with trusted others'
          ]
        };
      }

      setAnalysisResult(analysis);
      
      // Update user profile with new narrative patterns
      const updatedPatterns = [...(userProfile.narrativePatterns || []), ...analysis.narrativePatterns];
      await supabase
        .from('user_memory_profiles')
        .update({
          narrative_patterns: updatedPatterns,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user!.id);

      // Award completion crystals and achievement
      await gamification.recordAction(user!.id, 'narrative_identity_complete');
      await gamification.awardCrystals(user!.id, 300, 'narrative_identity_complete');

      setIsComplete(true);
    } catch (error) {
      console.error('Error analyzing responses:', error);
      // Show basic completion without analysis
      setIsComplete(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleComplete = () => {
    navigate('/dashboard');
  };

  if (isAnalyzing) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10">
          <MobileContainer className="py-8">
            <Card className="glass-strong">
              <CardContent className="p-8 text-center space-y-6">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <LoadingSpinner size="lg" />
                </div>
                <h2 className="text-2xl font-bold">Analyzing Your Story</h2>
                <p className="text-muted-foreground">
                  NewMe is carefully analyzing your responses to create personalized insights 
                  about your narrative identity and growth patterns...
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing responses</span>
                    <span>100%</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </MobileContainer>
        </div>
      </ErrorBoundary>
    );
  }

  if (isComplete && analysisResult) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10">
          <MobileContainer className="py-8">
            {/* Completion Header */}
            <Card className="glass-strong mb-6">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Your Narrative Identity Revealed</CardTitle>
                <p className="text-muted-foreground">
                  Congratulations on completing this deep exploration of your personal story!
                </p>
              </CardHeader>
            </Card>

            {/* Core Themes */}
            <Card className="glass-strong mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Your Core Themes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.coreThemes.map((theme, index) => (
                    <Badge key={index} className="bg-primary/20 text-primary">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Narrative Patterns */}
            <Card className="glass-strong mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-secondary" />
                  Your Narrative Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResult.narrativePatterns.map((pattern, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0" />
                      <p className="text-sm">{pattern}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Strengths */}
            <Card className="glass-strong mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  Your Hidden Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {analysisResult.strengths.map((strength, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 glass-subtle rounded-lg">
                      <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-accent" />
                      </div>
                      <span className="font-medium">{strength}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Growth Areas */}
            <Card className="glass-strong mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-secondary" />
                  Growth Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResult.growthAreas.map((area, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Target className="w-4 h-4 text-secondary mt-1 flex-shrink-0" />
                      <p className="text-sm">{area}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Insights */}
            <Card className="glass-strong mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  Personal Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResult.insights.map((insight, index) => (
                    <div key={index} className="p-4 glass-subtle rounded-lg">
                      <p className="text-sm leading-relaxed italic">"{insight}"</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="glass-strong mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-accent" />
                  Next Steps for Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResult.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-accent">{index + 1}</span>
                      </div>
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Complete Button */}
            <Button
              onClick={handleComplete}
              className="w-full bg-gradient-primary hover:opacity-90"
              size="lg"
            >
              Continue Your Journey
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </MobileContainer>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10">
        <MobileContainer className="py-8">
          {/* Header */}
          <Card className="glass-strong mb-6">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Narrative Identity Exploration</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Discover the stories that shape who you are
                    </p>
                  </div>
                </div>
                <Badge variant="outline">
                  {currentQuestion + 1} / {NARRATIVE_QUESTIONS.length}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardHeader>
          </Card>

          {/* Question Card */}
          <Card className="glass-strong mb-6">
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Question */}
                <div className="space-y-3">
                  <Badge variant="outline" className="text-xs">
                    {currentQuestionData.category}
                  </Badge>
                  <h2 className="text-xl font-semibold leading-relaxed">
                    {currentQuestionData.question}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {currentQuestionData.prompt}
                  </p>
                </div>

                {/* Response Input */}
                {!showFollowUp ? (
                  <div className="space-y-3">
                    <Textarea
                      value={currentResponse}
                      onChange={(e) => setCurrentResponse(e.target.value)}
                      placeholder="Take your time to reflect and share your thoughts..."
                      className="glass-input min-h-[120px] resize-none"
                      maxLength={1000}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Take as much space as you need</span>
                      <span>{currentResponse.length}/1000</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 glass-subtle rounded-lg">
                      <p className="text-sm font-medium mb-2">Your response:</p>
                      <p className="text-sm text-muted-foreground">{currentResponse}</p>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-sm font-medium">
                        {currentQuestionData.followUp}
                      </p>
                      <Textarea
                        value={followUpResponse}
                        onChange={(e) => setFollowUpResponse(e.target.value)}
                        placeholder="Share any additional thoughts..."
                        className="glass-input min-h-[80px] resize-none"
                        maxLength={500}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Optional follow-up reflection</span>
                        <span>{followUpResponse.length}/500</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between gap-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0 && !showFollowUp}
              className="glass-button"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {!showFollowUp ? (
              <Button
                onClick={() => {
                  if (currentQuestionData.followUp && currentResponse.trim()) {
                    setShowFollowUp(true);
                  } else {
                    handleResponseSubmit();
                  }
                }}
                disabled={!currentResponse.trim()}
                className="bg-gradient-primary hover:opacity-90"
              >
                {currentQuestionData.followUp ? 'Continue' : 
                 currentQuestion === NARRATIVE_QUESTIONS.length - 1 ? 'Complete' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleFollowUpSubmit}
                className="bg-gradient-primary hover:opacity-90"
              >
                {currentQuestion === NARRATIVE_QUESTIONS.length - 1 ? 'Complete Exploration' : 'Next Question'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {NARRATIVE_QUESTIONS.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentQuestion
                    ? 'bg-primary w-6'
                    : index < currentQuestion
                    ? 'bg-primary/60'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </MobileContainer>
      </div>
    </ErrorBoundary>
  );
};