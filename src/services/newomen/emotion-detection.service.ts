/**
 * Emotion Detection Service for Newomen
 * Analyzes text and voice for emotional content
 */

import { adaptiveOpenAIService } from '../adaptive-openai.service';

export interface EmotionAnalysis {
  primary: string;
  secondary: string[];
  intensity: number; // 0-10
  confidence: number; // 0-1
  culturalFactors?: string[];
  needsSupport: boolean;
  suggestedResponse?: string;
}

export interface VoiceEmotionMarkers {
  pitch: {
    mean: number;
    variance: number;
    trend: 'rising' | 'falling' | 'stable';
  };
  pace: {
    wordsPerMinute: number;
    pauseFrequency: number;
    hesitations: number;
  };
  volume: {
    mean: number;
    variance: number;
    whispers: number;
  };
  quality: {
    tremor: number;
    breathiness: number;
    tension: number;
  };
}

export interface EmotionalPattern {
  pattern: string;
  frequency: number;
  triggers: string[];
  culturalContext?: string;
  therapeuticSignificance: 'low' | 'medium' | 'high';
}

class EmotionDetectionService {
  private emotionHistory: EmotionAnalysis[] = [];
  private patterns: Map<string, EmotionalPattern> = new Map();

  /**
   * Analyze text for emotional content
   */
  async analyzeText(text: string, culturalContext?: string): Promise<EmotionAnalysis> {
    try {
      const prompt = `
        Analyze the emotional content of this text with psychological depth.
        Text: "${text}"
        ${culturalContext ? `Cultural context: ${culturalContext}` : ''}
        
        Identify:
        1. Primary emotion (most dominant)
        2. Secondary emotions (up to 3)
        3. Emotional intensity (0-10 scale)
        4. Confidence in assessment (0-1)
        5. Cultural factors influencing expression
        6. Whether the person needs immediate emotional support
        7. A suggested therapeutic response approach
        
        Consider subtle emotional indicators, defensive patterns, and what might be unexpressed.
        
        Return as JSON with these exact fields:
        {
          "primary": "string",
          "secondary": ["string"],
          "intensity": number,
          "confidence": number,
          "culturalFactors": ["string"] or null,
          "needsSupport": boolean,
          "suggestedResponse": "string"
        }
      `;

      const result = await adaptiveOpenAIService.createChatCompletion([
        { 
          role: 'system', 
          content: 'You are an expert in emotional intelligence, psychology, and cultural emotional expression patterns.' 
        },
        { role: 'user', content: prompt }
      ], {
        model: 'gpt-4o',
        temperature: 0.3,
        max_tokens: 300
      });

      const analysis = JSON.parse(result.choices[0].message.content);
      
      // Add to history
      this.emotionHistory.push(analysis);
      
      // Update patterns
      this.updatePatterns(analysis, text);
      
      return analysis;
    } catch (error) {
      console.error('Emotion analysis failed:', error);
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Analyze voice for emotional markers
   */
  analyzeVoice(audioData: Float32Array, sampleRate: number): VoiceEmotionMarkers {
    // Calculate pitch
    const pitch = this.calculatePitch(audioData, sampleRate);
    
    // Calculate pace (would need transcription timing)
    const pace = this.calculatePace(audioData);
    
    // Calculate volume
    const volume = this.calculateVolume(audioData);
    
    // Calculate voice quality
    const quality = this.calculateVoiceQuality(audioData, sampleRate);
    
    return {
      pitch,
      pace,
      volume,
      quality
    };
  }

  /**
   * Calculate pitch characteristics
   */
  private calculatePitch(audioData: Float32Array, sampleRate: number): VoiceEmotionMarkers['pitch'] {
    // Simplified pitch detection using autocorrelation
    const pitchValues: number[] = [];
    const windowSize = 2048;
    const hopSize = 512;
    
    for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
      const window = audioData.slice(i, i + windowSize);
      const pitch = this.detectPitchAutocorrelation(window, sampleRate);
      if (pitch > 0) {
        pitchValues.push(pitch);
      }
    }
    
    const mean = pitchValues.reduce((a, b) => a + b, 0) / pitchValues.length || 0;
    const variance = this.calculateVariance(pitchValues, mean);
    const trend = this.calculateTrend(pitchValues);
    
    return { mean, variance, trend };
  }

  /**
   * Detect pitch using autocorrelation
   */
  private detectPitchAutocorrelation(buffer: Float32Array, sampleRate: number): number {
    const minPeriod = Math.floor(sampleRate / 500); // 500 Hz max
    const maxPeriod = Math.floor(sampleRate / 50);  // 50 Hz min
    
    let maxCorrelation = 0;
    let bestPeriod = 0;
    
    for (let period = minPeriod; period < maxPeriod && period < buffer.length; period++) {
      let correlation = 0;
      for (let i = 0; i < buffer.length - period; i++) {
        correlation += buffer[i] * buffer[i + period];
      }
      
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestPeriod = period;
      }
    }
    
    return bestPeriod > 0 ? sampleRate / bestPeriod : 0;
  }

  /**
   * Calculate pace characteristics
   */
  private calculatePace(audioData: Float32Array): VoiceEmotionMarkers['pace'] {
    // Simplified - would need actual transcription timing
    return {
      wordsPerMinute: 120, // Average speaking rate
      pauseFrequency: 0,
      hesitations: 0
    };
  }

  /**
   * Calculate volume characteristics
   */
  private calculateVolume(audioData: Float32Array): VoiceEmotionMarkers['volume'] {
    const volumes: number[] = [];
    const windowSize = 1024;
    
    for (let i = 0; i < audioData.length - windowSize; i += windowSize) {
      const window = audioData.slice(i, i + windowSize);
      const rms = Math.sqrt(window.reduce((sum, val) => sum + val * val, 0) / windowSize);
      volumes.push(rms);
    }
    
    const mean = volumes.reduce((a, b) => a + b, 0) / volumes.length || 0;
    const variance = this.calculateVariance(volumes, mean);
    const whispers = volumes.filter(v => v < 0.01).length;
    
    return { mean, variance, whispers };
  }

  /**
   * Calculate voice quality indicators
   */
  private calculateVoiceQuality(audioData: Float32Array, sampleRate: number): VoiceEmotionMarkers['quality'] {
    // Simplified quality metrics
    const tremor = this.detectTremor(audioData);
    const breathiness = this.detectBreathiness(audioData);
    const tension = this.detectTension(audioData, sampleRate);
    
    return { tremor, breathiness, tension };
  }

  /**
   * Detect tremor in voice
   */
  private detectTremor(audioData: Float32Array): number {
    // Detect regular fluctuations in amplitude
    const envelope = this.extractEnvelope(audioData);
    const fluctuations = this.countFluctuations(envelope);
    return Math.min(fluctuations / envelope.length, 1);
  }

  /**
   * Detect breathiness
   */
  private detectBreathiness(audioData: Float32Array): number {
    // Ratio of high-frequency noise to harmonic content
    const noise = this.calculateNoiseRatio(audioData);
    return Math.min(noise, 1);
  }

  /**
   * Detect vocal tension
   */
  private detectTension(audioData: Float32Array, sampleRate: number): number {
    // Higher formant frequencies indicate tension
    const formants = this.estimateFormants(audioData, sampleRate);
    const tensionIndicator = formants[0] > 800 ? 0.7 : 0.3; // Simplified
    return tensionIndicator;
  }

  /**
   * Extract amplitude envelope
   */
  private extractEnvelope(audioData: Float32Array): Float32Array {
    const envelope = new Float32Array(audioData.length);
    const windowSize = 256;
    
    for (let i = 0; i < audioData.length; i++) {
      const start = Math.max(0, i - windowSize / 2);
      const end = Math.min(audioData.length, i + windowSize / 2);
      let sum = 0;
      
      for (let j = start; j < end; j++) {
        sum += Math.abs(audioData[j]);
      }
      
      envelope[i] = sum / (end - start);
    }
    
    return envelope;
  }

  /**
   * Count fluctuations in signal
   */
  private countFluctuations(data: Float32Array): number {
    let fluctuations = 0;
    let previousSign = 0;
    
    for (let i = 1; i < data.length; i++) {
      const diff = data[i] - data[i - 1];
      const sign = Math.sign(diff);
      
      if (sign !== previousSign && sign !== 0) {
        fluctuations++;
        previousSign = sign;
      }
    }
    
    return fluctuations;
  }

  /**
   * Calculate noise ratio
   */
  private calculateNoiseRatio(audioData: Float32Array): number {
    // Simplified: ratio of high-frequency energy to total energy
    const fft = this.performFFT(audioData);
    const highFreqEnergy = fft.slice(fft.length * 0.7).reduce((sum, val) => sum + val * val, 0);
    const totalEnergy = fft.reduce((sum, val) => sum + val * val, 0);
    
    return totalEnergy > 0 ? highFreqEnergy / totalEnergy : 0;
  }

  /**
   * Perform FFT (simplified)
   */
  private performFFT(audioData: Float32Array): Float32Array {
    // Placeholder - would use actual FFT implementation
    return new Float32Array(audioData.length / 2);
  }

  /**
   * Estimate formant frequencies
   */
  private estimateFormants(audioData: Float32Array, sampleRate: number): number[] {
    // Placeholder - would use LPC or cepstral analysis
    return [700, 1200, 2500]; // Typical formant frequencies
  }

  /**
   * Calculate variance
   */
  private calculateVariance(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Calculate trend
   */
  private calculateTrend(values: number[]): 'rising' | 'falling' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstMean = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondMean = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const diff = secondMean - firstMean;
    
    if (Math.abs(diff) < firstMean * 0.1) return 'stable';
    return diff > 0 ? 'rising' : 'falling';
  }

  /**
   * Update emotional patterns
   */
  private updatePatterns(analysis: EmotionAnalysis, text: string): void {
    const patternKey = `${analysis.primary}_${analysis.intensity > 7 ? 'high' : 'low'}`;
    
    const existing = this.patterns.get(patternKey);
    if (existing) {
      existing.frequency++;
      if (text.length > 20) {
        existing.triggers.push(text.substring(0, 50));
      }
    } else {
      this.patterns.set(patternKey, {
        pattern: patternKey,
        frequency: 1,
        triggers: [text.substring(0, 50)],
        therapeuticSignificance: analysis.intensity > 7 ? 'high' : 'low'
      });
    }
  }

  /**
   * Get default analysis
   */
  private getDefaultAnalysis(): EmotionAnalysis {
    return {
      primary: 'neutral',
      secondary: [],
      intensity: 5,
      confidence: 0.5,
      needsSupport: false,
      suggestedResponse: 'Continue with active listening and validation'
    };
  }

  /**
   * Get emotional patterns
   */
  getPatterns(): EmotionalPattern[] {
    return Array.from(this.patterns.values())
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Get emotional trajectory
   */
  getEmotionalTrajectory(): {
    trend: 'improving' | 'declining' | 'stable';
    averageIntensity: number;
    dominantEmotions: string[];
  } {
    if (this.emotionHistory.length < 2) {
      return {
        trend: 'stable',
        averageIntensity: 5,
        dominantEmotions: []
      };
    }
    
    const recentHistory = this.emotionHistory.slice(-10);
    const intensities = recentHistory.map(e => e.intensity);
    const averageIntensity = intensities.reduce((a, b) => a + b, 0) / intensities.length;
    
    // Calculate trend
    const firstHalf = intensities.slice(0, Math.floor(intensities.length / 2));
    const secondHalf = intensities.slice(Math.floor(intensities.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    let trend: 'improving' | 'declining' | 'stable';
    if (secondAvg < firstAvg - 1) {
      trend = 'improving';
    } else if (secondAvg > firstAvg + 1) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }
    
    // Get dominant emotions
    const emotionCounts = new Map<string, number>();
    recentHistory.forEach(e => {
      emotionCounts.set(e.primary, (emotionCounts.get(e.primary) || 0) + 1);
    });
    
    const dominantEmotions = Array.from(emotionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(e => e[0]);
    
    return {
      trend,
      averageIntensity,
      dominantEmotions
    };
  }

  /**
   * Suggest intervention based on emotional state
   */
  suggestIntervention(analysis: EmotionAnalysis): {
    type: 'grounding' | 'validation' | 'exploration' | 'challenge' | 'support';
    technique: string;
    script: string;
  } {
    if (analysis.intensity > 8) {
      return {
        type: 'grounding',
        technique: 'breathing',
        script: "I can feel this is really intense for you. Let's take a moment to breathe together. Inhale slowly... and exhale..."
      };
    }
    
    if (analysis.primary === 'sadness' && analysis.intensity > 6) {
      return {
        type: 'validation',
        technique: 'emotional_validation',
        script: "Your sadness is so valid. It makes complete sense that you would feel this way given what you've shared."
      };
    }
    
    if (analysis.primary === 'anger') {
      return {
        type: 'exploration',
        technique: 'anger_exploration',
        script: "There's something important in this anger. What is it protecting? What boundary is being crossed?"
      };
    }
    
    if (analysis.primary === 'fear') {
      return {
        type: 'support',
        technique: 'fear_support',
        script: "Fear is trying to keep you safe. Let's explore what safety means for you right now."
      };
    }
    
    return {
      type: 'exploration',
      technique: 'open_exploration',
      script: "Tell me more about what this feeling is like for you."
    };
  }

  /**
   * Clear emotion history
   */
  clearHistory(): void {
    this.emotionHistory = [];
    this.patterns.clear();
  }
}

// Export singleton instance
export const emotionDetectionService = new EmotionDetectionService();