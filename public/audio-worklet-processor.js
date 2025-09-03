// Audio Worklet Processor for real-time voice processing

class VoiceProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    // Configuration from options
    this.sampleRate = options.processorOptions.sampleRate || 48000;
    this.vadThreshold = options.processorOptions.vadThreshold || -50;
    this.enableVAD = options.processorOptions.enableVAD !== false;
    
    // Internal state
    this.bufferSize = 128; // Default for AudioWorklet
    this.audioBuffer = [];
    this.frameSize = 2048; // Size for processing chunks
    this.isSpeaking = false;
    this.silenceFrames = 0;
    this.silenceThreshold = 10; // Frames of silence before marking as not speaking
    
    // Initialize
    this.port.postMessage({ type: 'initialized' });
  }

  /**
   * Calculate RMS energy of audio data
   */
  calculateEnergy(audioData) {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    return Math.sqrt(sum / audioData.length);
  }

  /**
   * Convert energy to decibels
   */
  energyToDecibels(energy) {
    return 20 * Math.log10(Math.max(energy, 1e-10));
  }

  /**
   * Detect Voice Activity
   */
  detectVoiceActivity(audioData) {
    const energy = this.calculateEnergy(audioData);
    const db = this.energyToDecibels(energy);
    return db > this.vadThreshold;
  }

  /**
   * Process audio data
   */
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (input.length > 0) {
      const inputData = input[0];
      
      // Pass through audio
      if (output.length > 0 && output[0]) {
        output[0].set(inputData);
      }
      
      // Add to buffer for processing
      this.audioBuffer.push(...inputData);
      
      // Process when we have enough data
      while (this.audioBuffer.length >= this.frameSize) {
        const frame = new Float32Array(this.audioBuffer.splice(0, this.frameSize));
        
        // Detect voice activity
        if (this.enableVAD) {
          const hasVoice = this.detectVoiceActivity(frame);
          
          if (hasVoice) {
            this.silenceFrames = 0;
            if (!this.isSpeaking) {
              this.isSpeaking = true;
              this.port.postMessage({
                type: 'vadStatus',
                isSpeaking: true
              });
            }
          } else {
            this.silenceFrames++;
            if (this.isSpeaking && this.silenceFrames > this.silenceThreshold) {
              this.isSpeaking = false;
              this.port.postMessage({
                type: 'vadStatus',
                isSpeaking: false
              });
            }
          }
        }
        
        // Send audio data to main thread
        this.port.postMessage({
          type: 'audioData',
          audioData: frame,
          timestamp: currentTime * 1000, // Convert to milliseconds
          isSpeaking: this.isSpeaking,
          energy: this.calculateEnergy(frame)
        });
      }
    }
    
    // Keep processor alive
    return true;
  }
}

// Register the processor
registerProcessor('voice-processor', VoiceProcessor);