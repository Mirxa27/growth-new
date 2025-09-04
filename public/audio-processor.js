// Enhanced AudioWorkletProcessor for real-time voice processing with VAD

class AudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    this.sampleRate = options.processorOptions?.sampleRate || 24000;
    this.channels = options.processorOptions?.channels || 1;
    this.bufferSize = 1024;
    this.audioBuffer = [];
    
    // Voice Activity Detection parameters
    this.vadThreshold = 0.01;
    this.silenceFrames = 0;
    this.voiceFrames = 0;
    this.isVoiceActive = false;
    this.minVoiceFrames = 3;
    this.minSilenceFrames = 10;
    
    // Audio level tracking
    this.audioLevel = 0;
    this.levelSmoothingFactor = 0.8;
    
    console.log('Enhanced AudioProcessor initialized with:', {
      sampleRate: this.sampleRate,
      channels: this.channels,
      bufferSize: this.bufferSize
    });
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    
    if (input.length === 0) {
      return true;
    }

    const inputChannel = input[0];
    if (inputChannel.length === 0) {
      return true;
    }

    // Calculate audio level (RMS)
    let sum = 0;
    for (let i = 0; i < inputChannel.length; i++) {
      sum += inputChannel[i] * inputChannel[i];
    }
    const rms = Math.sqrt(sum / inputChannel.length);
    
    // Smooth audio level
    this.audioLevel = this.audioLevel * this.levelSmoothingFactor + 
                     rms * (1 - this.levelSmoothingFactor);

    // Voice Activity Detection
    const wasVoiceActive = this.isVoiceActive;
    
    if (rms > this.vadThreshold) {
      this.voiceFrames++;
      this.silenceFrames = 0;
      
      if (!this.isVoiceActive && this.voiceFrames >= this.minVoiceFrames) {
        this.isVoiceActive = true;
      }
    } else {
      this.silenceFrames++;
      this.voiceFrames = 0;
      
      if (this.isVoiceActive && this.silenceFrames >= this.minSilenceFrames) {
        this.isVoiceActive = false;
      }
    }

    // Convert Float32 to Int16 for OpenAI API
    const int16Data = new Int16Array(inputChannel.length);
    for (let i = 0; i < inputChannel.length; i++) {
      // Clamp and convert to 16-bit signed integer
      const sample = Math.max(-1, Math.min(1, inputChannel[i]));
      int16Data[i] = sample * 32767;
    }

    // Buffer audio data
    this.audioBuffer.push(...int16Data);

    // Send buffered audio when we have enough data or voice activity changes
    if (this.audioBuffer.length >= this.bufferSize || 
        (wasVoiceActive !== this.isVoiceActive)) {
      
      const audioData = new Int16Array(this.audioBuffer);
      this.audioBuffer = [];

      // Send audio data and voice activity status to main thread
      this.port.postMessage({
        audioData: audioData,
        isVoiceActive: this.isVoiceActive,
        audioLevel: this.audioLevel * 100, // Convert to 0-100 scale
        rms: rms
      });
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);