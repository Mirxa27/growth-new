/**
 * OpenAI API wrapper that gracefully handles missing API keys
 */

export class OpenAIWrapperService {
  private static isConfigured(): boolean {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    return !!(apiKey && apiKey !== 'your-openai-api-key-here' && apiKey.length > 10);
  }

  static async checkModels(): Promise<any[]> {
    if (!this.isConfigured()) {
      console.log('OpenAI API key not configured, returning mock models');
      return [
        { id: 'gpt-4', name: 'GPT-4' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
      ];
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.warn('Failed to fetch OpenAI models, using fallback:', error);
      return [
        { id: 'gpt-4', name: 'GPT-4' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
      ];
    }
  }

  static async generateCompletion(prompt: string, options?: any): Promise<string> {
    if (!this.isConfigured()) {
      console.log('OpenAI API key not configured, returning fallback response');
      return this.getFallbackResponse(prompt);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: options?.model || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: options?.maxTokens || 150,
          temperature: options?.temperature || 0.7,
          ...options
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || this.getFallbackResponse(prompt);
    } catch (error) {
      console.warn('OpenAI API call failed, using fallback:', error);
      return this.getFallbackResponse(prompt);
    }
  }

  private static getFallbackResponse(prompt: string): string {
    const fallbackResponses = [
      "I understand you're exploring important aspects of your personal growth. Your journey of self-discovery is valuable, and I'm here to support you when the full AI features are available.",
      "Your thoughts and feelings are important. While I'm operating in limited mode right now, I encourage you to continue reflecting on your growth and development.",
      "Thank you for sharing with me. Personal growth is a beautiful journey, and every step you take toward understanding yourself better is meaningful.",
      "I appreciate your openness in exploring these questions. Your commitment to personal development shows great self-awareness and courage."
    ];
    
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }

  static getConfigurationStatus(): {
    isConfigured: boolean;
    message: string;
  } {
    const configured = this.isConfigured();
    return {
      isConfigured: configured,
      message: configured 
        ? 'OpenAI API is properly configured'
        : 'OpenAI API key not configured - using fallback responses'
    };
  }
}

export const openaiWrapper = OpenAIWrapperService;