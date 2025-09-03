'use client'

import { useEffect, useMemo, useState } from 'react'
import { Sparkles, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

type ContentType = 'assessment' | 'course' | 'test' | 'exploration'
type AIProvider = 'openai' | 'anthropic' | 'google'

export default function AIBuilderPage() {
  const { user } = useAuth()
  const [contentType, setContentType] = useState<ContentType>('assessment')
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [aiProvider, setAIProvider] = useState<AIProvider>('openai')
  const [aiModel, setAIModel] = useState<string>('gpt-4o-mini')
  const [visibility, setVisibility] = useState<'public' | 'private'>('private')
  const [category, setCategory] = useState<string>('general')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<any>(null)

  const providerModels: Record<AIProvider, string[]> = {
    openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini'],
    anthropic: ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229'],
    google: ['gemini-1.5-flash', 'gemini-1.5-pro'],
  }

  useEffect(() => {
    // Reset model to first option when provider changes
    const models = providerModels[aiProvider]
    if (models && models.length > 0) {
      setAIModel(models[0])
    }
  }, [aiProvider])

  const mappedType = useMemo(() => {
    // Map UI content types to DB allowed types
    if (contentType === 'assessment') return 'quiz'
    return contentType
  }, [contentType])

  const mapDifficulty = (value: string) => {
    switch (value) {
      case 'easy':
        return 'beginner'
      case 'hard':
        return 'advanced'
      default:
        return 'intermediate'
    }
  }

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic')
      return
    }

    setIsGenerating(true)
    setGeneratedContent(null)

    try {
      // Call AI generation API
      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType,
          topic,
          description,
          difficulty,
          aiProvider,
          aiModel,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate content')
      }

      const data = await response.json()
      setGeneratedContent(data.content)

      // Save generation record to history
      const { error } = await supabase.from('ai_generation_history').insert({
        template_id: null,
        topic,
        additional_context: description,
        generated_content: data.content,
        status: 'draft',
        created_by: user?.id,
      } as any)

      if (error) console.warn('AI generation history insert warning:', error.message)

      toast.success('Content generated successfully!')
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Failed to generate content')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveContent = async () => {
    if (!generatedContent) return

    try {
      // Build questions in DB-friendly format
      const questions = Array.isArray(generatedContent.questions)
        ? generatedContent.questions.map((q: any, index: number) => {
            const rawType = (q.type || q.question_type || 'multiple_choice') as string
            let question_type: 'multiple_choice' | 'free_text' | 'image' = 'multiple_choice'
            let options: any[] | undefined = undefined

            if (rawType === 'multiple_choice') {
              const opts = q.options || q.choices || []
              const correct = q.correct_answer
              options = opts.map((opt: any, i: number) => {
                const text = typeof opt === 'string' ? opt : (opt?.text || opt?.option_text || String(opt))
                const is_correct = typeof correct === 'string' ? correct === text : false
                return {
                  option_text: text,
                  is_correct,
                  position: i + 1,
                  score_value: is_correct ? 1 : 0,
                }
              })
            } else if (rawType === 'true_false' || rawType === 'boolean') {
              question_type = 'multiple_choice'
              const correct = (q.correct_answer ?? '').toString().toLowerCase()
              options = [
                { option_text: 'True', is_correct: correct === 'true', position: 1, score_value: correct === 'true' ? 1 : 0 },
                { option_text: 'False', is_correct: correct === 'false', position: 2, score_value: correct === 'false' ? 1 : 0 },
              ]
            } else if (rawType === 'rating' || rawType === 'scale') {
              question_type = 'multiple_choice'
              const max = q?.scale?.max || 5
              options = Array.from({ length: max }).map((_, i) => ({
                option_text: String(i + 1),
                is_correct: false,
                position: i + 1,
                score_value: 0,
              }))
            } else if (rawType === 'free_text' || rawType === 'text') {
              question_type = 'free_text'
            }

            return {
              question_text: q.text || q.question_text || q.question || `Question ${index + 1}`,
              question_type,
              position: index + 1,
              points: q.points || 1,
              explanation: q.explanation || null,
              options,
            }
          })
        : []

      const difficultyMapped = mapDifficulty(difficulty)

      const { data: createdId, error } = await (supabase as any).rpc('create_assessment_with_questions', {
        _title: generatedContent.title || topic,
        _description: generatedContent.description || description || null,
        _type: mappedType,
        _visibility: visibility,
        _difficulty: difficultyMapped,
        _category: category,
        _ai_provider: aiProvider,
        _ai_model: aiModel,
        _ai_prompt: `Topic: ${topic}${description ? ` | Description: ${description}` : ''}`,
        _questions: questions,
        _created_by: user?.id,
      })

      if (error) throw error

      toast.success('Content saved successfully!')
      setGeneratedContent(null)
      setTopic('')
      setDescription('')
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save content')
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AI Content Builder</h1>
        <p className="mt-2 text-gray-600">
          Generate assessments, courses, and explorations using AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Generate New Content
          </h2>

          <div className="space-y-4">
            {/* Content Type Selection */}
            <div>
              <label className="label">Content Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(['assessment', 'course', 'test', 'exploration'] as ContentType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setContentType(type)}
                    className={`p-3 rounded-lg border-2 transition ${
                      contentType === type
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic Input */}
            <div>
              <label htmlFor="topic" className="label">
                Topic
              </label>
              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., JavaScript Fundamentals, Emotional Intelligence"
                className="input w-full"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="label">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide additional context or requirements..."
                rows={3}
                className="input w-full"
              />
            </div>

            {/* Difficulty Level */}
            <div>
              <label className="label">Difficulty Level</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="input w-full"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* AI Provider */}
            <div>
              <label className="label">AI Provider</label>
              <select
                value={aiProvider}
                onChange={(e) => setAIProvider(e.target.value as AIProvider)}
                className="input w-full"
              >
                <option value="openai">OpenAI (GPT-4)</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="google">Google (Gemini)</option>
              </select>
            </div>

            {/* AI Model */}
            <div>
              <label className="label">Model</label>
              <select
                value={aiModel}
                onChange={(e) => setAIModel(e.target.value)}
                className="input w-full"
              >
                {providerModels[aiProvider].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Visibility */}
            <div>
              <label className="label">Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
                className="input w-full"
              >
                <option value="private">Private (Users)</option>
                <option value="public">Public (Visitors)</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="label">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., general, wellness, career"
                className="input w-full"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="btn-primary w-full py-3 flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Content
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview/Results */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Generated Content
          </h2>

          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600">AI is generating your content...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
            </div>
          ) : generatedContent ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <p className="text-green-800 font-medium">
                    Content generated successfully!
                  </p>
                </div>
              </div>

              {/* Content Preview */}
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-900">
                  {generatedContent.title || 'Generated Content'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {generatedContent.description || 'No description provided'}
                </p>
                
                {contentType === 'assessment' && generatedContent.questions && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Questions: {generatedContent.questions.length}
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {generatedContent.questions.slice(0, 3).map((q: any, i: number) => (
                        <li key={i}>• {q.text}</li>
                      ))}
                      {generatedContent.questions.length > 3 && (
                        <li>• And {generatedContent.questions.length - 3} more...</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSaveContent}
                  className="btn-primary flex-1"
                >
                  Save & Configure
                </button>
                <button
                  onClick={() => setGeneratedContent(null)}
                  className="btn-outline flex-1"
                >
                  Discard
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Generated content will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          AI Generation Tips
        </h3>
        <ul className="text-blue-800 space-y-2 text-sm">
          <li>• Be specific with your topic for better results</li>
          <li>• Use the description field to add requirements or constraints</li>
          <li>• Review and edit generated content before publishing</li>
          <li>• Different AI providers may produce varying styles of content</li>
        </ul>
      </div>
    </div>
  )
}