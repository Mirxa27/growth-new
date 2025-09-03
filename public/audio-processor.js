// AudioWorkletProcessor for real-time voice processing

// Base64 encoding function for AudioWorklet context (btoa not available)
function uint8ArrayToBase64(uint8Array) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i;
  
  for (i = 0; i < uint8Array.length - 2; i += 3) {
    result += chars[uint8Array[i] >> 2];
    result += chars[((uint8Array[i] & 3) << 4) | (uint8Array[i + 1] >> 4)];
    result += chars[((uint8Array[i + 1] & 15) << 2) | (uint8Array[i + 2] >> 6)];
    result += chars[uint8Array[i + 2] & 63];
  }
  
  if (i === uint8Array.length - 2) {
    result += chars[uint8Array[i] >> 2];
    result += chars[((uint8Array[i] & 3) << 4) | (uint8Array[i + 1] >> 4)];
    result += chars[(uint8Array[i + 1] & 15) << 2];
    result += '=';
  } else if (i === uint8Array.length - 1) {
    result += chars[uint8Array[i] >> 2];
    result += chars[(uint8Array[i] & 3) << 4];
    result += '==';
  }
  
  return result;
}

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input[0]) {
      const inputChannel = input[0];
      
      // Calculate audio level for visualization
      let sum = 0;
      for (let i = 0; i < inputChannel.length; i++) {
        sum += inputChannel[i] * inputChannel[i];
      }
      const audioLevel = Math.sqrt(sum / inputChannel.length);
      
      // Send audio level for visualization
      this.port.postMessage({
        type: 'audio-level',
        level: audioLevel
      });

      // Buffer audio data for transmission
      for (let i = 0; i < inputChannel.length; i++) {
        this.buffer[this.bufferIndex] = inputChannel[i];
        this.bufferIndex++;
        
        // When buffer is full, send to main thread
        if (this.bufferIndex >= this.bufferSize) {
          // Convert Float32 to PCM16
          const pcm16 = new Int16Array(this.bufferSize);
          for (let j = 0; j < this.bufferSize; j++) {
            // Clamp and convert to 16-bit PCM
            const sample = Math.max(-1, Math.min(1, this.buffer[j]));
            pcm16[j] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
          }
          
          // Convert to base64 for transmission
          const bytes = new Uint8Array(pcm16.buffer);
          const base64Audio = uint8ArrayToBase64(bytes);
          
          this.port.postMessage({
            type: 'audio-data',
            audio: base64Audio
          });
          
          this.bufferIndex = 0;
        }
      }
    }
    
    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);