import { describe, it, expect } from 'vitest';

describe('Test Environment Check', () => {
  it('should have vitest globals available', () => {
    expect(true).toBe(true);
  });

  it('should have vi mocking available', () => {
    const mockFn = vi.fn();
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
  });
});