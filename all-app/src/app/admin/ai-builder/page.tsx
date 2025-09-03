'use client'

import { useState } from 'react'
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
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<any>(null)

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
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate content')
      }

      const data = await response.json()
      setGeneratedContent(data.content)

      // Save to database
      const { error } = await supabase.from('ai_generated_content').insert({
        content_type: contentType,
        prompt: `Topic: ${topic}, Description: ${description}`,
        ai_provider: aiProvider,
        ai_model: data.model,
        generated_content: data.content,
        status: 'completed',
        created_by: user?.id,
      })

      if (error) throw error

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
      // Save the content based on type
      if (contentType === 'assessment') {
        const { error } = await supabase.from('assessments').insert({
          title: generatedContent.title,
          description: generatedContent.description,
          instructions: generatedContent.instructions,
          category_id: generatedContent.category_id,
          difficulty,
          created_by: user?.id,
        })

        if (error) throw error

        // Also insert questions
        // ... additional logic for questions
      }

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
                        ? 'border-primary bg-primary-50 text-primary'
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
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
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