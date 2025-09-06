import React, { useState } from 'react';
import { toast } from 'sonner';
import { unifiedAI } from '@/services/ai/unified-ai.service';
import { logger } from '@/services/logging/logger.service';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Wand2, Loader2, Send } from 'lucide-react';

// Types for AI Builder content types
interface ContentType {
  key: string;
  label: string;
}

interface GeneratedContent {
  id: string;
  type: string;
  title: string;
  description: string;
  content: string;
  createdAt: Date;
  provider: string;
}

const contentTypes: ContentType[] = [
  { key: 'assessment', label: 'Personality Assessment' },
  { key: 'exploration', label: 'Growth Exploration' },
  { key: 'course', label: 'Learning Course' },
  { key: 'meditation', label: 'Meditation Guide' },
  { key: 'journal', label: 'Journal Prompt' },
  { key: 'affirmation', label: 'Daily Affirmations' }
];

const AIBuilderPanel: React.FC = () => {
  const [activeType, setActiveType] = useState<string>('assessment');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [submissions, setSubmissions] = useState<GeneratedContent[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic' | 'google' | 'auto'>('auto');

  // Real AI-powered content generation function
  const generateContent = async (type: string, title: string, description: string): Promise<string> => {
    const prompts = {
      assessment: `Create a comprehensive personality assessment titled "${title}" with the following description: ${description}

Generate:
1. 10-15 thoughtful multiple-choice questions
2. 4 options per question with scoring logic
3. Result categories and interpretations
4. Personalized insights and recommendations

Format as a structured assessment with clear instructions for users.`,

      exploration: `Create a personal growth exploration session titled "${title}" with description: ${description}

Include:
1. Guided reflection questions
2. Interactive exercises and activities  
3. Mindfulness practices
4. Goal-setting framework
5. Action steps and takeaways

Make it engaging and transformative for women's personal development.`,

      course: `Design a learning course titled "${title}" with description: ${description}

Structure:
1. Course overview and learning objectives
2. 5-7 lesson modules with detailed content
3. Interactive exercises and assignments
4. Progress tracking milestones
5. Resources and further reading

Focus on practical application and personal growth.`,

      meditation: `Create a meditation guide titled "${title}" with description: ${description}

Include:
1. Preparation and setup instructions
2. Step-by-step guided meditation script
3. Breathing techniques and visualizations
4. Duration options (5, 10, 15, 20 minutes)
5. Benefits and integration tips

Make it soothing and accessible for all experience levels.`,

      journal: `Generate journal prompts titled "${title}" with description: ${description}

Provide:
1. 20-30 thought-provoking questions
2. Categorized by themes (self-reflection, goals, relationships, etc.)
3. Different difficulty levels (beginner to advanced)
4. Guidance on how to use the prompts effectively
5. Follow-up reflection exercises

Focus on promoting self-awareness and personal growth.`,

      affirmation: `Create daily affirmations collection titled "${title}" with description: ${description}

Include:
1. 30 powerful, personalized affirmations
2. Different categories (confidence, success, love, health)
3. Morning and evening affirmation sets
4. Visualization techniques to accompany affirmations
5. Tips for making affirmations more effective

Make them empowering and relevant to women's personal development journey.`
    };

    const prompt = prompts[type as keyof typeof prompts] || 
      `Create detailed content for a ${type} titled "${title}" with description: ${description}. Make it comprehensive, engaging, and valuable for personal growth and development.`;

    try {
      const response = await unifiedAI.chat([
        {
          role: 'system',
          content: 'You are an expert content creator specializing in personal development, psychology, and women\'s empowerment. Create high-quality, actionable content that promotes growth, self-awareness, and positive transformation.'
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        provider: selectedProvider,
        temperature: 0.7,
        maxTokens: 2000
      });

      return response.content;
    } catch (error) {
      logger.error('AI content generation failed', {
        component: 'AIBuilderPanel',
        action: 'generateContent',
        metadata: { type, title, provider: selectedProvider },
        error
      });
      throw new Error('Failed to generate content. Please try again.');
    }
  };

  const handleGenerate = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Please provide both title and description');
      return;
    }

    setIsGenerating(true);
    try {
      const generated = await generateContent(activeType, title, description);
      setContent(generated);
      toast.success('Content generated successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate content');
      logger.error('Content generation failed in component', {
        component: 'AIBuilderPanel',
        action: 'handleGenerate',
        metadata: { activeType, title, selectedProvider },
        error
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !content.trim()) {
      toast.error('Please ensure all fields are filled');
      return;
    }

    const newContent: GeneratedContent = {
      id: Date.now().toString(),
      type: activeType,
      title,
      description,
      content,
      createdAt: new Date(),
      provider: selectedProvider
    };

    setSubmissions(prevSubmissions => [newContent, ...prevSubmissions]);
    
    // Reset fields
    setTitle('');
    setDescription('');
    setContent('');
    toast.success(`New ${contentTypes.find(ct => ct.key === activeType)?.label} created successfully!`);
  };

  const handleDelete = (id: string) => {
    setSubmissions(prevSubmissions => prevSubmissions.filter(item => item.id !== id));
    toast.success('Content deleted successfully');
  };

  return (
    <div className="p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-pink-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">AI Content Builder</h1>
          <p className="text-base sm:text-lg text-gray-600 px-4">Create personalized content using AI for assessments, explorations, and more</p>
        </div>

        {/* Content Type Selection */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-600" />
              Choose Content Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {contentTypes.map((type) => (
                <Button
                  key={type.key}
                  onClick={() => setActiveType(type.key)}
                  variant={activeType === type.key ? 'default' : 'outline'}
                  className="transition-all duration-200 hover:scale-105"
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Content Creator */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-xl">Create Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* AI Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Provider
                </label>
                <Select value={selectedProvider} onValueChange={(value: 'openai' | 'anthropic' | 'google' | 'auto') => setSelectedProvider(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select AI Provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (Best Available)</SelectItem>
                    <SelectItem value="openai">OpenAI GPT</SelectItem>
                    <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                    <SelectItem value="google">Google Gemini</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <Input
                  type="text"
                  placeholder="Enter content title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Textarea
                  placeholder="Describe what you want to create..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !title.trim() || !description.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate with AI
                  </>
                )}
              </Button>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generated Content
                </label>
                <Textarea
                  placeholder="Generated content will appear here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[200px] resize-vertical"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!content.trim()}
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
              >
                <Send className="mr-2 h-4 w-4" />
                Save Content
              </Button>
            </CardContent>
          </Card>

          {/* Created Content List */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-xl">Created Content</CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wand2 className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No content created yet.</p>
                  <p className="text-sm text-gray-400">Generate your first piece of AI content!</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4 max-h-[400px] sm:max-h-[600px] overflow-y-auto">
                  {submissions.map((item) => (
                    <div key={item.id} className="p-4 border border-gray-200 rounded-lg bg-white/60 hover:bg-white/80 transition-all duration-200">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{item.title}</h3>
                        <Button
                          onClick={() => handleDelete(item.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          ×
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {contentTypes.find(ct => ct.key === item.type)?.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {item.provider}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.description}</p>
                      
                      <div className="text-xs text-gray-400">
                        Created: {item.createdAt.toLocaleString()}
                      </div>
                      
                      <details className="mt-2">
                        <summary className="text-sm text-purple-600 cursor-pointer hover:text-purple-700">
                          View Content
                        </summary>
                        <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-700 max-h-32 overflow-y-auto">
                          <pre className="whitespace-pre-wrap font-sans">{item.content}</pre>
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIBuilderPanel;