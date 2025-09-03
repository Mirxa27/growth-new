# WebRTC Voice-to-Voice Integration Guide

## Overview

This implementation provides a complete real-time WebRTC-based voice-to-voice pipeline with:
- Low-latency audio streaming
- Real-time Speech-to-Text (STT)
- Streaming Text-to-Speech (TTS)
- Voice Activity Detection (VAD)
- Audio processing with AudioWorklet
- Comprehensive error handling and fallbacks

## Architecture

### 1. WebRTC Voice Service (`webrtc-voice.service.ts`)
- Manages WebRTC peer connections
- Handles audio capture and streaming
- Implements VAD for speech detection
- Provides audio level monitoring
- Supports data channel for metadata

### 2. STT Pipeline (`stt-pipeline.service.ts`)
- Multiple provider support (Browser API, OpenAI Whisper)
- Real-time transcription with interim results
- Automatic language detection
- Confidence scoring
- Word-level timestamps (when available)

### 3. TTS Pipeline (`tts-pipeline.service.ts`)
- Multiple provider support (Browser API, OpenAI TTS)
- Streaming synthesis for low latency
- Voice selection and customization
- Audio caching for repeated phrases
- Queue management with priorities

### 4. Audio Worklet Processor
- Real-time audio processing in separate thread
- Voice Activity Detection
- Energy calculation
- Low-latency audio passthrough

## Usage

### Basic Integration

```tsx
import { VoiceSession } from '@/components/voice/VoiceSession';

function MyComponent() {
  const { user } = useAuth();
  
  return (
    <VoiceSession
      userId={user.id}
      config={{
        language: 'en-US',
        voiceId: 'nova',
        model: 'gpt-4-turbo-preview',
        systemPrompt: 'You are a helpful assistant.',
        enableTranscription: true,
        enableVAD: true
      }}
      onTranscript={(text, isUser) => {
        console.log(`${isUser ? 'User' : 'AI'}: ${text}`);
      }}
      onSessionEnd={(sessionData) => {
        console.log('Session ended:', sessionData);
      }}
    />
  );
}
```

### Advanced Configuration

```tsx
// Custom WebRTC configuration
const webrtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:your-turn-server.com', username: 'user', credential: 'pass' }
  ],
  audioConstraints: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000
  },
  enableVAD: true,
  vadThreshold: -45, // dB
  sampleRate: 48000,
  channels: 1
};

// STT configuration
const sttConfig = {
  provider: 'openai', // 'browser' | 'openai' | 'custom'
  language: 'en-US',
  model: 'whisper-1',
  continuous: true,
  interimResults: true,
  punctuation: true,
  wordTimestamps: true
};

// TTS configuration
const ttsConfig = {
  provider: 'openai', // 'browser' | 'openai' | 'elevenlabs' | 'custom'
  voice: 'nova', // OpenAI: alloy, echo, fable, onyx, nova, shimmer
  model: 'tts-1', // 'tts-1' | 'tts-1-hd'
  speed: 1.0,
  streamingEnabled: true,
  cacheEnabled: true
};
```

## Features

### Voice Activity Detection (VAD)
- Automatic speech detection
- Configurable sensitivity threshold
- Visual feedback for speaking state
- Prevents interruptions during AI response

### Real-time Transcription
- Interim results for immediate feedback
- Final results with confidence scores
- Speaker diarization
- Punctuation and formatting

### Low-latency TTS
- Sentence-level streaming
- Multiple voice options
- Speed and pitch control
- Audio caching for common responses

### Connection Management
- Automatic reconnection
- Network quality monitoring
- Graceful degradation
- Error recovery

## Performance Optimization

### 1. Audio Processing
- AudioWorklet for off-main-thread processing
- Efficient buffer management
- Adaptive bitrate
- Echo cancellation

### 2. Network Optimization
- TURN server fallback
- Bandwidth adaptation
- Packet loss recovery
- Jitter buffer management

### 3. Caching Strategy
- TTS response caching
- Conversation context management
- Efficient memory usage
- Cache invalidation

## Error Handling

### Microphone Permissions
```tsx
// Handled automatically with user-friendly prompts
// Fallback to text input if denied
```

### Network Issues
```tsx
// Automatic reconnection with exponential backoff
// Offline queue for pending messages
// Graceful degradation to text
```

### Provider Failures
```tsx
// Automatic fallback chain:
// 1. Primary provider (e.g., OpenAI)
// 2. Secondary provider (e.g., Browser API)
// 3. Text-only mode
```

## Security Considerations

1. **End-to-End Encryption**: WebRTC provides DTLS-SRTP encryption
2. **TURN Server Authentication**: Use authenticated TURN servers
3. **API Key Management**: Store keys securely in environment variables
4. **Content Filtering**: Implement profanity/content filtering as needed

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| WebRTC | ✅ | ✅ | ✅ | ✅ |
| AudioWorklet | ✅ | ✅ | ✅ | ✅ |
| Web Speech API | ✅ | ❌ | ✅ | ✅ |
| MediaRecorder | ✅ | ✅ | ✅ | ✅ |

## Deployment Checklist

- [ ] Configure STUN/TURN servers
- [ ] Set up OpenAI API key
- [ ] Configure TTS voices
- [ ] Test microphone permissions
- [ ] Verify SSL certificates
- [ ] Set up monitoring/analytics
- [ ] Configure rate limiting
- [ ] Test on target devices

## Monitoring

The system provides real-time metrics:
- Audio latency
- Packet loss rate
- Jitter measurements
- Connection quality
- Transcription accuracy
- TTS queue depth

## Future Enhancements

1. **Multi-language Support**: Automatic language detection and switching
2. **Custom Wake Words**: "Hey Assistant" activation
3. **Emotion Detection**: Analyze voice tone and sentiment
4. **Voice Cloning**: Custom voice creation
5. **Offline Mode**: Local STT/TTS fallback
6. **Group Calls**: Multi-party voice sessions