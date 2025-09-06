import { describe, it, expect } from 'vitest';
import { composePersonalizedInstructions, type MemoryHighlights } from './memory.service';

describe('composePersonalizedInstructions', () => {
  it('appends memory highlights when present', () => {
    const base = 'You are NewMe.';
    const h: MemoryHighlights = {
      preferences: ['pref A', 'pref B'],
      themes: ['theme X'],
      context: ['context 1']
    };
    const out = composePersonalizedInstructions(base, h);
    expect(out).toContain('You are NewMe.');
    expect(out).toContain('Personalization memory');
    expect(out).toContain('Preferences: pref A; pref B');
    expect(out).toContain('Recurring themes: theme X');
    expect(out).toContain('Context: context 1');
  });

  it('returns base instructions when empty', () => {
    const base = 'You are NewMe.';
    const h: MemoryHighlights = { preferences: [], themes: [], context: [] };
    const out = composePersonalizedInstructions(base, h);
    expect(out).toBe(base);
  });
});

