import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Sparkles, 
  Brain, 
  Eye, 
  
  Clock,
  Star,
  Wand2,
  Save,
  Loader2
} from 'lucide-react';

interface GeneratedExploration {
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  facilitator_prompt: string;
  higher_self_prompt: string;
  questions: string[];
  analysis_structure: {
    corePattern: string;
    hiddenPotential: string;
    actionableSteps: string;
    affirmations: string;
    encouragement: string;
  };
  estimated_duration: number;
  crystal_reward: number;
}

export const AIExplorationBuilder = () => {
  const { toast } = useToast();
  const [topic, setTopic] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');
  const [duration, setDuration] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedExploration, setGeneratedExploration] = useState<GeneratedExploration | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const generateExploration = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter a topic for the exploration.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const prompt = `Create a complete therapeutic exploration for women on self-discovery journey.

Topic: ${topic}
Additional Context: ${additionalContext}
Target Audience: ${targetAudience}
Difficulty Level: ${difficulty}
Target Duration: ${duration} minutes

Generate a comprehensive exploration with:

1. A compelling title (under 60 characters)
2. An engaging description (2-3 sentences) that captures the transformation this exploration offers
3. Choose appropriate category: self-discovery, relationships, career, healing, spirituality
4. 10 deep, thoughtful questions that build upon each other progressively
5. A facilitator prompt for the first phase (neutral, empathetic guide)
6. A higher self prompt for the analysis phase (wise, insightful analyst)
7. Analysis structure with specific sections

Requirements:
- Questions should be open-ended and encourage deep reflection
- Progressive depth - start gentle, build to deeper introspection
- Use inclusive, empowering language
- Focus on self-discovery and personal growth
- Questions should take about ${Math.floor(duration/10)} minutes each to fully explore

Return ONLY valid JSON in this exact format:
{
  "title": "exploration title",
  "description": "compelling description",
  "category": "category name",
  "difficulty_level": "${difficulty}",
  "facilitator_prompt": "neutral facilitator system prompt",
  "higher_self_prompt": "wise higher self system prompt",
  "questions": ["question 1", "question 2", ...],
  "analysis_structure": {
    "corePattern": "description of core pattern analysis",
    "hiddenPotential": "description of potential identification",
    "actionableSteps": "description of actionable steps",
    "affirmations": "description of affirmations",
    "encouragement": "description of encouragement"
  },
  "estimated_duration": ${duration},
  "crystal_reward": ${Math.max(50, duration * 2)}
}`;

      const { data, error } = await (supabase.functions as any).invoke('enhanced-chat-completion', {
        body: {
          messages: [
            {
              role: 'system',
              content: 'You are an expert in creating therapeutic explorations for women\'s personal growth. Create meaningful, transformative experiences that guide users through deep self-discovery.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: 'gpt-4o',
          temperature: 0.7,
          max_tokens: 2000
        }
      });

      if (error) throw error;

      const content = data.choices[0].message.content;
      
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format from AI');
      }

      const exploration = JSON.parse(jsonMatch[0]);
      
      // Validate the structure
      if (!exploration.title || !exploration.questions || !Array.isArray(exploration.questions)) {
        throw new Error('Invalid exploration structure generated');
      }

      setGeneratedExploration(exploration);
      
      toast({
        title: "Exploration generated! ✨",
        description: `Created "${exploration.title}" with ${exploration.questions.length} questions.`,
      });

    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate exploration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveExploration = async () => {
    if (!generatedExploration) return;

    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('explorations')
        .insert({
          title: generatedExploration.title,
          description: generatedExploration.description,
          category: generatedExploration.category,
          difficulty_level: generatedExploration.difficulty_level,
          facilitator_prompt: generatedExploration.facilitator_prompt,
          higher_self_prompt: generatedExploration.higher_self_prompt,
          questions: generatedExploration.questions,
          analysis_structure: generatedExploration.analysis_structure,
          estimated_duration: generatedExploration.estimated_duration,
          crystal_reward: generatedExploration.crystal_reward,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Exploration saved! 🎉",
        description: "The exploration has been added to the library.",
      });

      // Reset form
      setTopic('');
      setAdditionalContext('');
      setTargetAudience('');
      setGeneratedExploration(null);

    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'self-discovery': return '🔍';
      case 'relationships': return '💝';
      case 'career': return '💼';
      case 'healing': return '🌱';
      case 'spirituality': return '✨';
      default: return '🌟';
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-500/10 text-green-700 dark:text-green-300';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300';
      case 'advanced': return 'bg-red-500/10 text-red-700 dark:text-red-300';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
          <Wand2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold gradient-text">AI Exploration Builder</h2>
          <p className="text-muted-foreground">Generate complete explorations from simple topics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card className="glass-card border-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Exploration Parameters
            </CardTitle>
            <CardDescription>
              Provide details about the exploration you want to create
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Topic / Theme *</label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Inner Child Healing, Embracing Vulnerability, Finding Your Voice"
                className="glass border-glass"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Additional Context</label>
              <Textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="Any specific themes, outcomes, or approaches you want included..."
                rows={3}
                className="glass border-glass"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Target Audience</label>
              <Input
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g., career women, new mothers, those in transition"
                className="glass border-glass"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Difficulty Level</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background glass border-glass"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                <Input
                  type="number"
                  min="15"
                  max="90"
                  step="5"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="glass border-glass"
                />
              </div>
            </div>

            <Button 
              onClick={generateExploration} 
              disabled={isGenerating || !topic.trim()}
              className="w-full bg-gradient-primary"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Exploration...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Exploration
                </>
              )}
            </Button>

            <div className="text-xs text-muted-foreground">
              💡 Tip: Be specific about the emotional journey or transformation you want users to experience.
            </div>
          </CardContent>
        </Card>

        {/* Preview/Result */}
        <Card className="glass-card border-glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Generated Exploration
            </CardTitle>
            <CardDescription>
              Review and save the AI-generated exploration
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedExploration ? (
              <div className="space-y-4">
                {/* Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold leading-tight">
                      {generatedExploration.title}
                    </h3>
                    <div className="flex gap-1">
                      <Badge className={getDifficultyColor(generatedExploration.difficulty_level)}>
                        {generatedExploration.difficulty_level}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {generatedExploration.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <span>{getCategoryIcon(generatedExploration.category)}</span>
                      <span className="capitalize">{generatedExploration.category}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{generatedExploration.estimated_duration} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      <span>{generatedExploration.crystal_reward} crystals</span>
                    </div>
                  </div>
                </div>

                {/* Questions Preview */}
                <div className="space-y-2">
                  <h4 className="font-medium">Questions ({generatedExploration.questions.length})</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {generatedExploration.questions.map((question, index) => (
                      <div key={index} className="text-sm p-2 glass-surface rounded">
                        <span className="font-medium text-primary">{index + 1}.</span> {question}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Analysis Structure */}
                <div className="space-y-2">
                  <h4 className="font-medium">Analysis Structure</h4>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    {Object.entries(generatedExploration.analysis_structure).map(([key, value]) => (
                      <div key={key} className="p-2 glass-surface rounded">
                        <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                        <span className="text-muted-foreground ml-1">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={saveExploration} 
                    disabled={isSaving}
                    className="flex-1 bg-gradient-primary"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save to Library
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={() => setGeneratedExploration(null)} 
                    variant="outline"
                    className="glass"
                  >
                    Discard
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No exploration generated yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Fill in the form and click generate to create an exploration
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card className="glass-card border-glass">
        <CardHeader>
          <CardTitle className="text-lg">💡 Pro Tips for Better Explorations</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-medium">Topic Ideas:</h4>
            <ul className="text-muted-foreground space-y-1">
              <li>• Healing from perfectionism</li>
              <li>• Embracing your authentic voice</li>
              <li>• Navigating life transitions</li>
              <li>• Releasing limiting beliefs</li>
              <li>• Cultivating self-compassion</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Best Practices:</h4>
            <ul className="text-muted-foreground space-y-1">
              <li>• Be specific about the transformation desired</li>
              <li>• Consider the emotional journey</li>
              <li>• Think about practical applications</li>
              <li>• Include context about challenges</li>
              <li>• Specify any cultural considerations</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};