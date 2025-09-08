/**
 * Voice Integration Service
 * Integrates transcription with other platform features
 */

import { EventEmitter } from 'events';
import { realtimeTranscriptionService, TranscriptionEvent } from '@/services/transcription/realtime-transcription.service';
import { supabase } from '@/integrations/supabase/client';

export interface VoiceSession {
  id: string;
  userId: string;
  type: 'transcription' | 'meeting' | 'note' | 'assessment';
  startTime: number;
  endTime?: number;
  transcripts: VoiceTranscript[];
  metadata: {
    title?: string;
    tags?: string[];
    confidence?: number;
    language?: string;
    duration?: number;
  };
}

export interface VoiceTranscript {
  id: string;
  text: string;
  confidence: number;
  timestamp: number;
  speaker?: string;
  isComplete: boolean;
}

class VoiceIntegrationService extends EventEmitter {
  private currentSession: VoiceSession | null = null;
  private autoSave = true;
  private saveInterval = 30000; // 30 seconds
  private saveTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.setupTranscriptionListeners();
  }

  /**
   * Start a new voice session
   */
  async startSession(type: VoiceSession['type'], metadata: VoiceSession['metadata'] = {}): Promise<VoiceSession> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // End any existing session
      if (this.currentSession) {
        await this.endSession();
      }

      // Create new session
      this.currentSession = {
        id: `voice_session_${Date.now()}`,
        userId: user.id,
        type,
        startTime: Date.now(),
        transcripts: [],
        metadata: {
          language: 'en',
          ...metadata
        }
      };

      // Start auto-save if enabled
      if (this.autoSave) {
        this.startAutoSave();
      }

      this.emit('sessionStarted', this.currentSession);
      return this.currentSession;

    } catch (error) {
      console.error('Failed to start voice session:', error);
      throw error;
    }
  }

  /**
   * End the current voice session
   */
  async endSession(): Promise<VoiceSession | null> {
    if (!this.currentSession) {
      return null;
    }

    try {
      // Stop auto-save
      if (this.saveTimer) {
        clearInterval(this.saveTimer);
        this.saveTimer = null;
      }

      // Update session end time
      this.currentSession.endTime = Date.now();
      this.currentSession.metadata.duration = this.currentSession.endTime - this.currentSession.startTime;

      // Calculate overall confidence
      if (this.currentSession.transcripts.length > 0) {
        const avgConfidence = this.currentSession.transcripts.reduce((sum, t) => sum + t.confidence, 0) / this.currentSession.transcripts.length;
        this.currentSession.metadata.confidence = avgConfidence;
      }

      // Save final session
      await this.saveSession(this.currentSession);

      const endedSession = this.currentSession;
      this.currentSession = null;

      this.emit('sessionEnded', endedSession);
      return endedSession;

    } catch (error) {
      console.error('Failed to end voice session:', error);
      throw error;
    }
  }

  /**
   * Add transcript to current session
   */
  addTranscript(transcript: Omit<VoiceTranscript, 'id'>): void {
    if (!this.currentSession) {
      return;
    }

    const voiceTranscript: VoiceTranscript = {
      id: `transcript_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      ...transcript
    };

    this.currentSession.transcripts.push(voiceTranscript);
    this.emit('transcriptAdded', voiceTranscript);
  }

  /**
   * Get current session
   */
  getCurrentSession(): VoiceSession | null {
    return this.currentSession;
  }

  /**
   * Save session to database
   */
  private async saveSession(session: VoiceSession): Promise<void> {
    try {
      const { error } = await supabase
        .from('voice_sessions')
        .upsert({
          id: session.id,
          user_id: session.userId,
          session_type: session.type,
          started_at: new Date(session.startTime).toISOString(),
          ended_at: session.endTime ? new Date(session.endTime).toISOString() : null,
          transcripts: session.transcripts,
          metadata: session.metadata,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to save voice session:', error);
      } else {
        this.emit('sessionSaved', session);
      }
    } catch (error) {
      console.error('Error saving voice session:', error);
    }
  }

  /**
   * Load session history
   */
  async getSessionHistory(limit = 20): Promise<VoiceSession[]> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('voice_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to load session history:', error);
        return [];
      }

      return data.map(session => ({
        id: session.id,
        userId: session.user_id,
        type: session.session_type,
        startTime: new Date(session.started_at).getTime(),
        endTime: session.ended_at ? new Date(session.ended_at).getTime() : undefined,
        transcripts: session.transcripts || [],
        metadata: session.metadata || {}
      }));

    } catch (error) {
      console.error('Error loading session history:', error);
      return [];
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('voice_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        throw error;
      }

      this.emit('sessionDeleted', sessionId);
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw error;
    }
  }

  /**
   * Export session as different formats
   */
  exportSession(session: VoiceSession, format: 'txt' | 'json' | 'srt' = 'txt'): string {
    switch (format) {
      case 'txt':
        return this.exportAsText(session);
      case 'json':
        return JSON.stringify(session, null, 2);
      case 'srt':
        return this.exportAsSRT(session);
      default:
        return this.exportAsText(session);
    }
  }

  /**
   * Setup transcription event listeners
   */
  private setupTranscriptionListeners(): void {
    realtimeTranscriptionService.on('transcription', (event: TranscriptionEvent) => {
      if (event.type === 'completed' && event.transcript && this.currentSession) {
        this.addTranscript({
          text: event.transcript,
          confidence: event.confidence || 0.8,
          timestamp: Date.now(),
          isComplete: true
        });
      }
    });
  }

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
    }

    this.saveTimer = setInterval(() => {
      if (this.currentSession) {
        this.saveSession(this.currentSession);
      }
    }, this.saveInterval);
  }

  /**
   * Export session as plain text
   */
  private exportAsText(session: VoiceSession): string {
    const header = `Voice Session: ${session.metadata.title || 'Untitled'}\n`;
    const info = `Date: ${new Date(session.startTime).toLocaleString()}\n`;
    const duration = session.metadata.duration ? `Duration: ${Math.round(session.metadata.duration / 1000)}s\n` : '';
    const separator = '='.repeat(50) + '\n\n';

    const transcripts = session.transcripts
      .map(t => `[${new Date(t.timestamp).toLocaleTimeString()}] ${t.text}`)
      .join('\n\n');

    return header + info + duration + separator + transcripts;
  }

  /**
   * Export session as SRT subtitle format
   */
  private exportAsSRT(session: VoiceSession): string {
    let srt = '';
    const startTime = session.startTime;

    session.transcripts.forEach((transcript, index) => {
      const start = Math.max(0, transcript.timestamp - startTime);
      const end = start + 3000; // 3 seconds per subtitle

      const startSRT = this.millisecondsToSRT(start);
      const endSRT = this.millisecondsToSRT(end);

      srt += `${index + 1}\n`;
      srt += `${startSRT} --> ${endSRT}\n`;
      srt += `${transcript.text}\n\n`;
    });

    return srt;
  }

  /**
   * Convert milliseconds to SRT time format
   */
  private millisecondsToSRT(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
  }

  /**
   * Configure auto-save settings
   */
  setAutoSave(enabled: boolean, interval = 30000): void {
    this.autoSave = enabled;
    this.saveInterval = interval;

    if (this.currentSession) {
      if (enabled) {
        this.startAutoSave();
      } else if (this.saveTimer) {
        clearInterval(this.saveTimer);
        this.saveTimer = null;
      }
    }
  }
}

// Export singleton instance
export const voiceIntegrationService = new VoiceIntegrationService();