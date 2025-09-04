import { describe, it, expect } from 'vitest';

// Simple unit test for base64 audio decoding helper (playBase64Audio logic)
function base64ToUint8Array(b64: string) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

describe('base64 audio helper', () => {
  it('decodes base64 to Uint8Array', () => {
    const arr = new Uint8Array([1,2,3,4,5]);
    let binary = '';
    for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
    const b64 = btoa(binary);
    const result = base64ToUint8Array(b64);
    expect(Array.from(result)).toEqual([1,2,3,4,5]);
  });
});