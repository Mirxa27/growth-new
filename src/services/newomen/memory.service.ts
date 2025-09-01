/**
 * Memory & Personalization Service for Newomen
 * Persistent conversation memory and user personalization
 */

import { supabase } from '@/integrations/supabase/client';
import { adaptiveOpenAIService } from '../adaptive-openai.service';

export interface Memory {
  id: string;
  userId: string;
  type: 'fact' | 'preference' | 'emotion' | 'goal' | 'relationship' | 'trauma' | 'strength';
  content: string;
  context?: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  emotionalValence: number; // -1 to 1
  createdAt: string;
  lastAccessed: string;
  accessCount: number;
  tags: string[];
  embedding?: number[]; // Vector for semantic search
}

export interface UserProfile {
  userId: string;
  personalityTraits: PersonalityTrait[];
  coreValues: string[];
  lifeGoals: Goal[];
  relationships: Relationship[];
  culturalBackground: CulturalBackground;
  emotionalPatterns: EmotionalPattern[];
  growthAreas: GrowthArea[];
  strengths: string[];
  triggers: Trigger[];
  copingMechanisms: string[];
}

export interface PersonalityTrait {
  trait: string;
  score: number; // 0-100
  category: 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism';
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'personal' | 'professional' | 'relationship' | 'spiritual' | 'health';
  priority: 'low' | 'medium' | 'high';
  deadline?: string;
  progress: number; // 0-100
  milestones: string[];
}

export interface Relationship {
  id: string;
  name: string;
  type: 'family' | 'friend' | 'partner' | 'colleague' | 'other';
  quality: 'supportive' | 'neutral' | 'challenging' | 'toxic';
  importance: number; // 1-10
  patterns: string[];
  boundaries: string[];
}

export interface CulturalBackground {
  primaryCulture: string;
  languages: string[];
  religiousBackground?: string;
  familyStructure: string;
  culturalValues: string[];
  culturalChallenges: string[];
}

export interface EmotionalPattern {
  pattern: string;
  frequency: 'rare' | 'occasional' | 'frequent' | 'constant';
  triggers: string[];
  responses: string[];
  healthiness: 'healthy' | 'neutral' | 'unhealthy';
}

export interface GrowthArea {
  area: string;
  currentLevel: number; // 1-10
  targetLevel: number; // 1-10
  strategies: string[];
  blockers: string[];
  progress: number; // 0-100
}

export interface Trigger {
  trigger: string;
  response: string;
  intensity: number; // 1-10
  category: 'trauma' | 'stress' | 'anxiety' | 'anger' | 'sadness';
  copingStrategies: string[];
}

class MemoryService {
  private memories: Map<string, Memory> = new Map();
  private userProfile: UserProfile | null = null;
  private memoryIndex: Map<string, Set<string>> = new Map(); // Tag to memory IDs
  private embeddings: Map<string, number[]> = new Map(); // Memory ID to embedding

  /**
   * Initialize memory service for user
   */
  async initialize(userId: string): Promise<void> {
    await this.loadMemories(userId);
    await this.loadUserProfile(userId);
    await this.buildMemoryIndex();
  }

  /**
   * Load memories from database
   */
  private async loadMemories(userId: string): Promise<void> {
    const { data, error } = await supabase
      .from('user_memories')
      .select('*')
      .eq('user_id', userId)
      .order('importance', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Failed to load memories:', error);
      return;
    }

    this.memories.clear();
    data?.forEach(memory => {
      this.memories.set(memory.id, this.mapMemoryData(memory));
    });
  }

  /**
   * Load user profile
   */
  private async loadUserProfile(userId: string): Promise<void> {
    const { data, error } = await supabase
      .from('user_profiles_extended')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Create default profile if doesn't exist
      this.userProfile = await this.createDefaultProfile(userId);
      return;
    }

    this.userProfile = this.mapProfileData(data);
  }

  /**
   * Build memory index for fast retrieval
   */
  private async buildMemoryIndex(): Promise<void> {
    this.memoryIndex.clear();

    for (const [id, memory] of this.memories) {
      // Index by tags
      memory.tags.forEach(tag => {
        if (!this.memoryIndex.has(tag)) {
          this.memoryIndex.set(tag, new Set());
        }
        this.memoryIndex.get(tag)!.add(id);
      });

      // Index by type
      if (!this.memoryIndex.has(memory.type)) {
        this.memoryIndex.set(memory.type, new Set());
      }
      this.memoryIndex.get(memory.type)!.add(id);
    }
  }

  /**
   * Store a new memory
   */
  async storeMemory(
    content: string,
    type: Memory['type'],
    context?: string,
    importance?: Memory['importance']
  ): Promise<Memory> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Analyze memory for metadata
    const analysis = await this.analyzeMemory(content, type);

    const memory: Memory = {
      id: crypto.randomUUID(),
      userId: user.id,
      type,
      content,
      context,
      importance: importance || analysis.importance,
      emotionalValence: analysis.emotionalValence,
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      accessCount: 0,
      tags: analysis.tags,
      embedding: await this.generateEmbedding(content)
    };

    // Save to database
    const { error } = await supabase
      .from('user_memories')
      .insert({
        id: memory.id,
        user_id: memory.userId,
        type: memory.type,
        content: memory.content,
        context: memory.context,
        importance: memory.importance,
        emotional_valence: memory.emotionalValence,
        tags: memory.tags,
        embedding: memory.embedding,
        created_at: memory.createdAt
      });

    if (!error) {
      this.memories.set(memory.id, memory);
      await this.updateProfile(type, content);
      await this.buildMemoryIndex();
    }

    return memory;
  }

  /**
   * Analyze memory for metadata
   */
  private async analyzeMemory(
    content: string,
    type: Memory['type']
  ): Promise<{
    importance: Memory['importance'];
    emotionalValence: number;
    tags: string[];
  }> {
    try {
      const prompt = `
        Analyze this memory for storage and retrieval.
        Type: ${type}
        Content: "${content}"
        
        Determine:
        1. Importance (low/medium/high/critical)
        2. Emotional valence (-1 to 1, negative to positive)
        3. Tags (3-5 relevant keywords)
        
        Consider psychological significance and potential therapeutic relevance.
        
        Return JSON: { importance, emotionalValence, tags }
      `;

      const result = await adaptiveOpenAIService.createChatCompletion([
        { role: 'system', content: 'You are a memory analysis expert.' },
        { role: 'user', content: prompt }
      ], {
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 200
      });

      return JSON.parse(result.choices[0].message.content);
    } catch (error) {
      return {
        importance: 'medium',
        emotionalValence: 0,
        tags: [type]
      };
    }
  }

  /**
   * Generate embedding for semantic search
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await adaptiveOpenAIService.createEmbedding(
        text,
        'text-embedding-3-small'
      );
      return response.data[0].embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      return [];
    }
  }

  /**
   * Retrieve relevant memories for context
   */
  async retrieveRelevantMemories(
    query: string,
    limit: number = 5
  ): Promise<Memory[]> {
    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query);
    
    if (queryEmbedding.length === 0) {
      // Fallback to keyword search
      return this.keywordSearch(query, limit);
    }

    // Calculate cosine similarity with all memories
    const similarities: { memory: Memory; similarity: number }[] = [];

    for (const [id, memory] of this.memories) {
      if (memory.embedding && memory.embedding.length > 0) {
        const similarity = this.cosineSimilarity(queryEmbedding, memory.embedding);
        similarities.push({ memory, similarity });
      }
    }

    // Sort by similarity and return top results
    similarities.sort((a, b) => b.similarity - a.similarity);
    const results = similarities.slice(0, limit).map(s => s.memory);

    // Update access counts
    for (const memory of results) {
      memory.accessCount++;
      memory.lastAccessed = new Date().toISOString();
      await this.updateMemoryAccess(memory.id);
    }

    return results;
  }

  /**
   * Keyword search fallback
   */
  private keywordSearch(query: string, limit: number): Memory[] {
    const queryLower = query.toLowerCase();
    const words = queryLower.split(' ');
    
    const scores = new Map<string, number>();

    for (const [id, memory] of this.memories) {
      let score = 0;
      const contentLower = memory.content.toLowerCase();
      
      // Check word matches
      words.forEach(word => {
        if (contentLower.includes(word)) score += 1;
      });
      
      // Check tag matches
      memory.tags.forEach(tag => {
        if (words.includes(tag.toLowerCase())) score += 2;
      });
      
      // Boost by importance
      if (memory.importance === 'critical') score *= 2;
      else if (memory.importance === 'high') score *= 1.5;
      
      if (score > 0) {
        scores.set(id, score);
      }
    }

    // Sort by score
    const sorted = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    return sorted.map(([id]) => this.memories.get(id)!);
  }

  /**
   * Calculate cosine similarity between vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (normA * normB);
  }

  /**
   * Update memory access in database
   */
  private async updateMemoryAccess(memoryId: string): Promise<void> {
    await supabase
      .from('user_memories')
      .update({
        access_count: this.memories.get(memoryId)?.accessCount || 0,
        last_accessed: new Date().toISOString()
      })
      .eq('id', memoryId);
  }

  /**
   * Update user profile based on new memory
   */
  private async updateProfile(type: Memory['type'], content: string): Promise<void> {
    if (!this.userProfile) return;

    switch (type) {
      case 'goal':
        await this.extractAndUpdateGoals(content);
        break;
      case 'relationship':
        await this.extractAndUpdateRelationships(content);
        break;
      case 'trauma':
        await this.extractAndUpdateTriggers(content);
        break;
      case 'strength':
        await this.extractAndUpdateStrengths(content);
        break;
      case 'emotion':
        await this.extractAndUpdateEmotionalPatterns(content);
        break;
    }

    // Save updated profile
    await this.saveProfile();
  }

  /**
   * Extract and update goals
   */
  private async extractAndUpdateGoals(content: string): Promise<void> {
    // AI analysis to extract goal information
    // Implementation would parse content and update userProfile.lifeGoals
  }

  /**
   * Extract and update relationships
   */
  private async extractAndUpdateRelationships(content: string): Promise<void> {
    // AI analysis to extract relationship information
    // Implementation would parse content and update userProfile.relationships
  }

  /**
   * Extract and update triggers
   */
  private async extractAndUpdateTriggers(content: string): Promise<void> {
    // AI analysis to extract trigger information
    // Implementation would parse content and update userProfile.triggers
  }

  /**
   * Extract and update strengths
   */
  private async extractAndUpdateStrengths(content: string): Promise<void> {
    // AI analysis to extract strength information
    // Implementation would parse content and update userProfile.strengths
  }

  /**
   * Extract and update emotional patterns
   */
  private async extractAndUpdateEmotionalPatterns(content: string): Promise<void> {
    // AI analysis to extract emotional pattern information
    // Implementation would parse content and update userProfile.emotionalPatterns
  }

  /**
   * Get user profile
   */
  getUserProfile(): UserProfile | null {
    return this.userProfile;
  }

  /**
   * Get memories by type
   */
  getMemoriesByType(type: Memory['type']): Memory[] {
    const memoryIds = this.memoryIndex.get(type);
    if (!memoryIds) return [];
    
    return Array.from(memoryIds)
      .map(id => this.memories.get(id))
      .filter(m => m !== undefined) as Memory[];
  }

  /**
   * Get memories by tag
   */
  getMemoriesByTag(tag: string): Memory[] {
    const memoryIds = this.memoryIndex.get(tag);
    if (!memoryIds) return [];
    
    return Array.from(memoryIds)
      .map(id => this.memories.get(id))
      .filter(m => m !== undefined) as Memory[];
  }

  /**
   * Get important memories
   */
  getImportantMemories(): Memory[] {
    return Array.from(this.memories.values())
      .filter(m => m.importance === 'high' || m.importance === 'critical')
      .sort((a, b) => {
        const importanceOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return importanceOrder[b.importance] - importanceOrder[a.importance];
      });
  }

  /**
   * Generate conversation context
   */
  async generateConversationContext(currentTopic: string): Promise<string> {
    const relevantMemories = await this.retrieveRelevantMemories(currentTopic, 3);
    const importantMemories = this.getImportantMemories().slice(0, 2);
    
    let context = '';
    
    if (this.userProfile) {
      context += `User Profile:\n`;
      context += `- Core Values: ${this.userProfile.coreValues.join(', ')}\n`;
      context += `- Strengths: ${this.userProfile.strengths.slice(0, 3).join(', ')}\n`;
      context += `- Cultural Background: ${this.userProfile.culturalBackground.primaryCulture}\n`;
      
      if (this.userProfile.triggers.length > 0) {
        context += `- Be mindful of triggers: ${this.userProfile.triggers.slice(0, 2).map(t => t.trigger).join(', ')}\n`;
      }
    }
    
    if (relevantMemories.length > 0) {
      context += `\nRelevant Memories:\n`;
      relevantMemories.forEach(memory => {
        context += `- [${memory.type}] ${memory.content.substring(0, 100)}...\n`;
      });
    }
    
    if (importantMemories.length > 0) {
      context += `\nImportant Context:\n`;
      importantMemories.forEach(memory => {
        context += `- ${memory.content.substring(0, 100)}...\n`;
      });
    }
    
    return context;
  }

  /**
   * Forget memories (for privacy)
   */
  async forgetMemories(type?: Memory['type']): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (type) {
      // Forget specific type
      const memoriesToForget = this.getMemoriesByType(type);
      const ids = memoriesToForget.map(m => m.id);
      
      await supabase
        .from('user_memories')
        .delete()
        .in('id', ids);
      
      ids.forEach(id => this.memories.delete(id));
    } else {
      // Forget all memories
      await supabase
        .from('user_memories')
        .delete()
        .eq('user_id', user.id);
      
      this.memories.clear();
    }
    
    await this.buildMemoryIndex();
  }

  /**
   * Save profile to database
   */
  private async saveProfile(): Promise<void> {
    if (!this.userProfile) return;

    await supabase
      .from('user_profiles_extended')
      .upsert({
        user_id: this.userProfile.userId,
        personality_traits: this.userProfile.personalityTraits,
        core_values: this.userProfile.coreValues,
        life_goals: this.userProfile.lifeGoals,
        relationships: this.userProfile.relationships,
        cultural_background: this.userProfile.culturalBackground,
        emotional_patterns: this.userProfile.emotionalPatterns,
        growth_areas: this.userProfile.growthAreas,
        strengths: this.userProfile.strengths,
        triggers: this.userProfile.triggers,
        coping_mechanisms: this.userProfile.copingMechanisms,
        updated_at: new Date().toISOString()
      });
  }

  /**
   * Create default profile
   */
  private async createDefaultProfile(userId: string): Promise<UserProfile> {
    const profile: UserProfile = {
      userId,
      personalityTraits: [],
      coreValues: [],
      lifeGoals: [],
      relationships: [],
      culturalBackground: {
        primaryCulture: 'universal',
        languages: ['English'],
        familyStructure: 'nuclear',
        culturalValues: [],
        culturalChallenges: []
      },
      emotionalPatterns: [],
      growthAreas: [],
      strengths: [],
      triggers: [],
      copingMechanisms: []
    };

    await this.saveProfile();
    return profile;
  }

  /**
   * Map memory data from database
   */
  private mapMemoryData(data: any): Memory {
    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      content: data.content,
      context: data.context,
      importance: data.importance,
      emotionalValence: data.emotional_valence,
      createdAt: data.created_at,
      lastAccessed: data.last_accessed || data.created_at,
      accessCount: data.access_count || 0,
      tags: data.tags || [],
      embedding: data.embedding
    };
  }

  /**
   * Map profile data from database
   */
  private mapProfileData(data: any): UserProfile {
    return {
      userId: data.user_id,
      personalityTraits: data.personality_traits || [],
      coreValues: data.core_values || [],
      lifeGoals: data.life_goals || [],
      relationships: data.relationships || [],
      culturalBackground: data.cultural_background || {
        primaryCulture: 'universal',
        languages: ['English'],
        familyStructure: 'nuclear',
        culturalValues: [],
        culturalChallenges: []
      },
      emotionalPatterns: data.emotional_patterns || [],
      growthAreas: data.growth_areas || [],
      strengths: data.strengths || [],
      triggers: data.triggers || [],
      copingMechanisms: data.coping_mechanisms || []
    };
  }
}

// Export singleton instance
export const memoryService = new MemoryService();