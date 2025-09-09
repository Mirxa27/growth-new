/**
 * Audio Processor Worklet
 * Processes real-time audio for transcription
 */

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    this.sampleRate = 24000; // Target sample rate for OpenAI
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    
    if (input && input.length > 0) {
      const inputChannel = input[0];
      
      // Process each sample
      for (let i = 0; i < inputChannel.length; i++) {
        // Apply simple gain and clipping
        let sample = inputChannel[i] * 0.8;
        sample = Math.max(-1, Math.min(1, sample));
        
        this.buffer[this.bufferIndex] = sample;
        this.bufferIndex++;
        
        // When buffer is full, send it to main thread
        if (this.bufferIndex >= this.bufferSize) {
          this.port.postMessage({
            type: 'audioData',
            audioBuffer: new Float32Array(this.buffer)
          });
          
          // Reset buffer
          this.bufferIndex = 0;
          this.buffer.fill(0);
        }
      }
    }
    
    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);