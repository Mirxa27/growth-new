import { supabase } from '@/integrations/supabase/client';
import { errorHandler, ErrorCategory, ErrorSeverity } from '@/services/error/error-handler.service';

export interface UploadOptions {
  bucket: 'avatars' | 'documents' | 'voice-recordings' | 'exports';
  path: string;
  file: File | Blob;
  upsert?: boolean;
  contentType?: string;
}

export interface DownloadOptions {
  bucket: string;
  path: string;
}

class StorageService {
  private static instance: StorageService;

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Upload a file to storage
   */
  async upload(options: UploadOptions): Promise<{ url: string | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Ensure path includes user ID for security
      const fullPath = options.path.startsWith(user.id) 
        ? options.path 
        : `${user.id}/${options.path}`;

      const { data, error } = await supabase.storage
        .from(options.bucket)
        .upload(fullPath, options.file, {
          upsert: options.upsert ?? false,
          contentType: options.contentType || options.file.type
        });

      if (error) throw error;

      // Get public URL for avatars
      if (options.bucket === 'avatars') {
        const { data: { publicUrl } } = supabase.storage
          .from(options.bucket)
          .getPublicUrl(data.path);
        
        return { url: publicUrl, error: null };
      }

      // For other buckets, return the path
      return { url: data.path, error: null };
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.STORAGE,
        context: { 
          action: 'upload',
          bucket: options.bucket,
          path: options.path 
        }
      });
      return { url: null, error: error as Error };
    }
  }

  /**
   * Upload avatar image
   */
  async uploadAvatar(file: File): Promise<{ url: string | null; error: Error | null }> {
    const fileName = `avatar-${Date.now()}.${file.name.split('.').pop()}`;
    return this.upload({
      bucket: 'avatars',
      path: fileName,
      file,
      upsert: true
    });
  }

  /**
   * Upload document
   */
  async uploadDocument(file: File, folder?: string): Promise<{ url: string | null; error: Error | null }> {
    const fileName = `${folder ? `${folder}/` : ''}${Date.now()}-${file.name}`;
    return this.upload({
      bucket: 'documents',
      path: fileName,
      file
    });
  }

  /**
   * Upload voice recording
   */
  async uploadVoiceRecording(blob: Blob, sessionId: string): Promise<{ url: string | null; error: Error | null }> {
    const fileName = `session-${sessionId}/recording-${Date.now()}.webm`;
    return this.upload({
      bucket: 'voice-recordings',
      path: fileName,
      file: blob,
      contentType: 'audio/webm'
    });
  }

  /**
   * Download a file from storage
   */
  async download(options: DownloadOptions): Promise<{ data: Blob | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(options.bucket)
        .download(options.path);

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.STORAGE,
        context: { 
          action: 'download',
          bucket: options.bucket,
          path: options.path 
        }
      });
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get signed URL for temporary access
   */
  async getSignedUrl(
    bucket: string, 
    path: string, 
    expiresIn: number = 3600
  ): Promise<{ url: string | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) throw error;

      return { url: data.signedUrl, error: null };
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.STORAGE,
        context: { 
          action: 'get_signed_url',
          bucket,
          path 
        }
      });
      return { url: null, error: error as Error };
    }
  }

  /**
   * Delete a file from storage
   */
  async delete(bucket: string, paths: string | string[]): Promise<{ error: Error | null }> {
    try {
      const pathArray = Array.isArray(paths) ? paths : [paths];
      
      const { error } = await supabase.storage
        .from(bucket)
        .remove(pathArray);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.STORAGE,
        context: { 
          action: 'delete',
          bucket,
          paths 
        }
      });
      return { error: error as Error };
    }
  }

  /**
   * List files in a folder
   */
  async list(
    bucket: string, 
    folder?: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: { column: string; order: 'asc' | 'desc' };
    }
  ): Promise<{ files: any[] | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const path = folder ? `${user.id}/${folder}` : user.id;

      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path, {
          limit: options?.limit ?? 100,
          offset: options?.offset ?? 0,
          sortBy: options?.sortBy
        });

      if (error) throw error;

      return { files: data, error: null };
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.STORAGE,
        context: { 
          action: 'list',
          bucket,
          folder 
        }
      });
      return { files: null, error: error as Error };
    }
  }

  /**
   * Get total storage usage for user
   */
  async getStorageUsage(): Promise<{ usage: number; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let totalSize = 0;
      const buckets = ['avatars', 'documents', 'voice-recordings', 'exports'];

      for (const bucket of buckets) {
        const { files } = await this.list(bucket);
        if (files) {
          totalSize += files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
        }
      }

      return { usage: totalSize, error: null };
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.STORAGE,
        context: { action: 'get_storage_usage' }
      });
      return { usage: 0, error: error as Error };
    }
  }

  /**
   * Export user data
   */
  async exportUserData(): Promise<{ url: string | null; error: Error | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Collect all user data
      const [
        { data: profile },
        { data: assessments },
        { data: goals },
        { data: journal },
        { data: sessions }
      ] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('id', user.id).single(),
        supabase.from('assessments').select('*').eq('created_by', user.id),
        supabase.from('goals' as any).select('*').eq('user_id', user.id),
        supabase.from('journal_entries' as any).select('*').eq('user_id', user.id),
        supabase.from('chat_sessions' as any).select('*, chat_messages(*)').eq('user_id', user.id)
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        profile,
        assessments,
        goals,
        journal_entries: journal,
        chat_sessions: sessions
      };

      // Create JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      
      const fileName = `export-${Date.now()}.json`;
      
      return this.upload({
        bucket: 'exports',
        path: fileName,
        file: blob,
        contentType: 'application/json'
      });
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.STORAGE,
        context: { action: 'export_user_data' }
      });
      return { url: null, error: error as Error };
    }
  }
}

export const storageService = StorageService.getInstance();