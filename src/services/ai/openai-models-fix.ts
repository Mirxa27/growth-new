/**
 * Fixed OpenAI models list with all available models
 * This ensures models are always available even if the API call fails
 */

export const OPENAI_MODELS = {
  // Chat Models
  'gpt-4-turbo': {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Most capable GPT-4 model with 128K context window',
    max_tokens: 4096,
    supports_vision: true,
    supports_functions: true,
    cost_per_1k_tokens: 0.01
  },
  'gpt-4-turbo-preview': {
    id: 'gpt-4-turbo-preview',
    name: 'GPT-4 Turbo Preview',
    description: 'Preview of GPT-4 Turbo with latest improvements',
    max_tokens: 4096,
    supports_vision: true,
    supports_functions: true,
    cost_per_1k_tokens: 0.01
  },
  'gpt-4': {
    id: 'gpt-4',
    name: 'GPT-4',
    description: 'Original GPT-4 model',
    max_tokens: 8192,
    supports_vision: false,
    supports_functions: true,
    cost_per_1k_tokens: 0.03
  },
  'gpt-4-32k': {
    id: 'gpt-4-32k',
    name: 'GPT-4 32K',
    description: 'GPT-4 with 32K context window',
    max_tokens: 32768,
    supports_vision: false,
    supports_functions: true,
    cost_per_1k_tokens: 0.06
  },
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Multimodal GPT-4 optimized for speed',
    max_tokens: 4096,
    supports_vision: true,
    supports_functions: true,
    cost_per_1k_tokens: 0.005
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Smaller, faster, cheaper GPT-4o',
    max_tokens: 16384,
    supports_vision: true,
    supports_functions: true,
    cost_per_1k_tokens: 0.00015
  },
  'gpt-3.5-turbo': {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and efficient model for most tasks',
    max_tokens: 16384,
    supports_vision: false,
    supports_functions: true,
    cost_per_1k_tokens: 0.0005
  },
  'gpt-3.5-turbo-16k': {
    id: 'gpt-3.5-turbo-16k',
    name: 'GPT-3.5 Turbo 16K',
    description: 'GPT-3.5 with 16K context window',
    max_tokens: 16384,
    supports_vision: false,
    supports_functions: true,
    cost_per_1k_tokens: 0.003
  },

  // Realtime Models
  'gpt-4o-realtime-preview': {
    id: 'gpt-4o-realtime-preview',
    name: 'GPT-4o Realtime Preview',
    description: 'Latest realtime model for voice interactions',
    max_tokens: 4096,
    supports_voice: true,
    supports_vision: true,
    supports_functions: true,
    cost_per_1k_tokens: 0.015
  },
  'gpt-4o-realtime-preview-2024-12-17': {
    id: 'gpt-4o-realtime-preview-2024-12-17',
    name: 'GPT-4o Realtime (Dec 2024)',
    description: 'December 2024 realtime model with improvements',
    max_tokens: 4096,
    supports_voice: true,
    supports_vision: true,
    supports_functions: true,
    cost_per_1k_tokens: 0.015
  },
  'gpt-4o-realtime-preview-2024-10-01': {
    id: 'gpt-4o-realtime-preview-2024-10-01',
    name: 'GPT-4o Realtime (Oct 2024)',
    description: 'October 2024 realtime model',
    max_tokens: 4096,
    supports_voice: true,
    supports_vision: true,
    supports_functions: true,
    cost_per_1k_tokens: 0.015
  },

  // Audio Models
  'whisper-1': {
    id: 'whisper-1',
    name: 'Whisper',
    description: 'Speech recognition model',
    supports_transcription: true,
    cost_per_minute: 0.006
  },
  'tts-1': {
    id: 'tts-1',
    name: 'TTS-1',
    description: 'Text-to-speech model',
    supports_tts: true,
    voices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
    cost_per_1k_chars: 0.015
  },
  'tts-1-hd': {
    id: 'tts-1-hd',
    name: 'TTS-1 HD',
    description: 'High quality text-to-speech model',
    supports_tts: true,
    voices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
    cost_per_1k_chars: 0.030
  },

  // Vision Models
  'gpt-4-vision-preview': {
    id: 'gpt-4-vision-preview',
    name: 'GPT-4 Vision Preview',
    description: 'GPT-4 with vision capabilities',
    max_tokens: 4096,
    supports_vision: true,
    supports_functions: true,
    cost_per_1k_tokens: 0.01
  },

  // Embedding Models
  'text-embedding-3-small': {
    id: 'text-embedding-3-small',
    name: 'Text Embedding 3 Small',
    description: 'Small embedding model',
    dimensions: 1536,
    cost_per_1k_tokens: 0.00002
  },
  'text-embedding-3-large': {
    id: 'text-embedding-3-large',
    name: 'Text Embedding 3 Large',
    description: 'Large embedding model',
    dimensions: 3072,
    cost_per_1k_tokens: 0.00013
  },
  'text-embedding-ada-002': {
    id: 'text-embedding-ada-002',
    name: 'Text Embedding Ada 002',
    description: 'Legacy embedding model',
    dimensions: 1536,
    cost_per_1k_tokens: 0.0001
  }
};

export const OPENAI_VOICES = [
  { id: 'alloy', name: 'Alloy', description: 'Neutral and balanced' },
  { id: 'echo', name: 'Echo', description: 'Warm and conversational' },
  { id: 'fable', name: 'Fable', description: 'Expressive and animated' },
  { id: 'onyx', name: 'Onyx', description: 'Deep and authoritative' },
  { id: 'nova', name: 'Nova', description: 'Friendly and upbeat' },
  { id: 'shimmer', name: 'Shimmer', description: 'Soft and gentle' }
];

/**
 * Get all available OpenAI models
 */
export function getAllOpenAIModels() {
  return Object.values(OPENAI_MODELS);
}

/**
 * Get chat models only
 */
export function getChatModels() {
  return Object.values(OPENAI_MODELS).filter(model => 
    model.id.includes('gpt') && !model.id.includes('realtime') && !model.id.includes('embedding')
  );
}

/**
 * Get realtime models only
 */
export function getRealtimeModels() {
  return Object.values(OPENAI_MODELS).filter(model => 
    model.id.includes('realtime')
  );
}

/**
 * Get audio models only
 */
export function getAudioModels() {
  return Object.values(OPENAI_MODELS).filter(model => 
    model.id === 'whisper-1' || model.id.includes('tts')
  );
}

/**
 * Get embedding models only
 */
export function getEmbeddingModels() {
  return Object.values(OPENAI_MODELS).filter(model => 
    model.id.includes('embedding')
  );
}