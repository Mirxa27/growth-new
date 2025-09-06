import { supabase } from '@/integrations/supabase/client';

export type MemoryHighlights = {
  preferences: string[];
  themes: string[];
  context: string[];
};

const EMPTY: MemoryHighlights = { preferences: [], themes: [], context: [] };

export async function getMemoryHighlights(): Promise<MemoryHighlights> {
  try {
    const { data, error } = await supabase.functions.invoke('memory-highlights', {
      body: { action: 'get' }
    });
    if (error) throw error;
    return (data?.highlights as MemoryHighlights) || EMPTY;
  } catch (e) {
    console.warn('getMemoryHighlights failed:', e);
    return EMPTY;
  }
}

export async function upsertMemoryHighlights(highlights: MemoryHighlights): Promise<MemoryHighlights> {
  const { data, error } = await supabase.functions.invoke('memory-highlights', {
    body: { action: 'upsert', highlights }
  });
  if (error) throw error;
  return (data?.highlights as MemoryHighlights) || EMPTY;
}

export async function updateMemoryFromTurn(userMessage: string, assistantMessage: string): Promise<MemoryHighlights> {
  try {
    const { data, error } = await supabase.functions.invoke('memory-highlights', {
      body: { action: 'update_from_turn', user_message: userMessage, assistant_message: assistantMessage }
    });
    if (error) throw error;
    return (data?.highlights as MemoryHighlights) || EMPTY;
  } catch (e) {
    console.warn('updateMemoryFromTurn failed:', e);
    return EMPTY;
  }
}

export function composePersonalizedInstructions(baseInstructions: string, highlights: MemoryHighlights): string {
  const lines: string[] = [];
  if (highlights.preferences?.length) {
    lines.push(`Preferences: ${highlights.preferences.join('; ')}`);
  }
  if (highlights.themes?.length) {
    lines.push(`Recurring themes: ${highlights.themes.join('; ')}`);
  }
  if (highlights.context?.length) {
    lines.push(`Context: ${highlights.context.join('; ')}`);
  }
  const memoryText = lines.length ? `\n\nPersonalization memory (use implicitly, do not restate):\n${lines.join('\n')}` : '';
  return `${baseInstructions}${memoryText}`;
}

