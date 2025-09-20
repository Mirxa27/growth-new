# OpenAI Realtime API Implementation

## Overview

This document describes the comprehensive implementation of OpenAI's Realtime API for low-latency, multimodal voice interactions in the Newomen platform. The implementation includes voice agents, real-time transcription, session management, and admin configuration.

## Architecture

### Core Services

#### 1. RealtimeService (`/src/services/ai/realtime.service.ts`)
- **Purpose**: Main service for managing Realtime API sessions using the OpenAI Agents SDK
- **Features**:
  - Session creation and management
  - Voice agent configuration
  - Ephemeral API key generation
  - Event handling and lifecycle management
  - Configuration loading from admin panel

#### 2. RealtimeWebSocketService (`/src/services/ai/realtime-websocket.service.ts`)
- **Purpose**: Direct WebSocket connection to OpenAI Realtime API
- **Features**:
  - Low-level WebSocket management
  - Audio data streaming
  - Message handling
  - Reconnection logic
  - Session state tracking

#### 3. RealtimeTranscriptionService (`/src/services/ai/realtime-transcription.service.ts`)
- **Purpose**: Real-time audio transcription using Whisper
- **Features**:
  - Audio-to-text conversion
  - Word-level timestamps
  - Speaker detection (when available)
  - Multiple language support
  - Confidence scoring

### UI Components

#### 1. VoiceAgent (`/src/components/voice/VoiceAgent.tsx`)
- **Purpose**: Complete voice interaction interface
- **Features**:
  - Start/stop voice sessions
  - Audio level monitoring
  - Connection status display
  - Error handling
  - Quick message shortcuts

#### 2. VoiceChat (`/src/components/voice/VoiceChat.tsx`)
- **Purpose**: Chat-style voice conversation interface
- **Features**:
  - Message history display
  - Voice recording with push-to-talk
  - Text input fallback
  - Transcription display
  - Audio playback controls

#### 3. TranscriptionPanel (`/src/components/voice/TranscriptionPanel.tsx`)
- **Purpose**: Dedicated transcription interface
- **Features**:
  - Real-time transcription display
  - Language selection
  - Word timestamp visualization
  - Export functionality
  - Audio level monitoring

#### 4. SessionManager (`/src/components/voice/SessionManager.tsx`)
- **Purpose**: Administrative session monitoring
- **Features**:
  - Active session tracking
  - Session statistics
  - Session termination controls
  - Performance metrics
  - Auto-refresh capabilities

### Assessment Integration

#### VoiceEnabledAssessment (`/src/components/assessments/VoiceEnabledAssessment.tsx`)
- **Purpose**: Voice-enabled assessment interface
- **Features**:
  - Three interaction modes: Traditional, Voice-only, Hybrid
  - Voice response recording
  - AI assistant guidance
  - Question reading by AI
  - Response transcription
  - Progress tracking

### Admin Configuration

#### 1. RealtimeAPIConfig (`/src/components/admin/RealtimeAPIConfig.tsx`)
- **Purpose**: Comprehensive admin configuration interface
- **Features**:
  - Realtime API settings
  - Transcription configuration
  - Advanced parameters
  - Testing interface
  - Configuration validation

#### 2. VoiceTestingInterface (`/src/components/admin/VoiceTestingInterface.tsx`)
- **Purpose**: Testing suite for voice functionality
- **Features**:
  - Automated test scenarios
  - Manual testing tools
  - Session monitoring
  - Test result tracking
  - Performance analysis

## Configuration Options

### Realtime Configuration

```typescript
interface RealtimeConfig {
  model: string;                    // e.g., 'gpt-4o-realtime-preview-2024-12-17'
  voice: string;                    // 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' | 'marin' | 'juniper' | 'sage'
  instructions: string;             // System instructions for the AI
  temperature: number;              // Response randomness (0-1)
  maxTokens?: number;              // Maximum response tokens
  enableTranscription: boolean;     // Enable input audio transcription
  sessionType: 'realtime' | 'transcription';
  inputModalities: ('text' | 'audio')[];
  outputModalities: ('text' | 'audio')[];
  turnDetection?: {
    type: 'server_vad' | 'none';
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
  };
}
```

### Transcription Configuration

```typescript
interface TranscriptionConfig {
  model: string;                    // e.g., 'whisper-1'
  language?: string;               // Language code (e.g., 'en', 'es', 'fr')
  prompt?: string;                 // Optional transcription prompt
  temperature?: number;            // Transcription randomness
  response_format: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  enable_word_timestamps?: boolean;
  enable_speaker_detection?: boolean;
}
```

## Usage Examples

### Basic Voice Agent

```typescript
import { VoiceAgent } from '@/components/voice';

const MyComponent = () => {
  return (
    <VoiceAgent
      config={{
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'marin',
        instructions: 'You are a helpful assistant.',
        temperature: 0.7,
      }}
      onSessionStart={(sessionId) => console.log('Session started:', sessionId)}
      onSessionEnd={(sessionId) => console.log('Session ended:', sessionId)}
      onMessage={(message, type) => console.log('Message:', message, type)}
    />
  );
};
```

### Voice-Enabled Assessment

```typescript
import { VoiceEnabledAssessment } from '@/components/voice';

const AssessmentPage = () => {
  const handleComplete = (responses) => {
    console.log('Assessment completed:', responses);
  };

  return (
    <VoiceEnabledAssessment
      assessment={assessmentData}
      onComplete={handleComplete}
      enableVoiceQuestions={true}
      enableVoiceResponses={true}
      voiceConfig={{
        voice: 'marin',
        instructions: 'Help the user complete this assessment with encouragement.',
      }}
    />
  );
};
```

### Transcription Only

```typescript
import { TranscriptionPanel } from '@/components/voice';

const TranscriptionPage = () => {
  return (
    <TranscriptionPanel
      config={{
        model: 'whisper-1',
        language: 'en',
        enable_word_timestamps: true,
      }}
      onTranscriptionComplete={(result) => {
        console.log('Transcription:', result.text);
      }}
    />
  );
};
```

## API Integration

### Admin Panel Configuration

The system automatically loads configuration from the `admin_ai_providers` table:

```sql
-- OpenAI Realtime API Configuration
INSERT INTO admin_ai_providers (
  provider_type,
  provider_name,
  configuration,
  is_active
) VALUES (
  'openai_realtime',
  'OpenAI Realtime API',
  '{
    "model": "gpt-4o-realtime-preview-2024-12-17",
    "voice": "marin",
    "instructions": "You are a helpful AI assistant...",
    "temperature": 0.7,
    "enableTranscription": true,
    "sessionType": "realtime"
  }',
  true
);

-- OpenAI Transcription Configuration
INSERT INTO admin_ai_providers (
  provider_type,
  provider_name,
  configuration,
  is_active
) VALUES (
  'openai_transcription',
  'OpenAI Transcription',
  '{
    "model": "whisper-1",
    "language": "en",
    "enable_word_timestamps": true,
    "enable_speaker_detection": false
  }',
  true
);
```

### Environment Variables

Required environment variables for OpenAI API access:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com  # Optional, defaults to OpenAI
```

## Session Management

### Session Lifecycle

1. **Creation**: Session created with unique ID
2. **Connection**: WebSocket/WebRTC connection established
3. **Configuration**: Session configured with voice, model, instructions
4. **Active**: Session ready for voice interaction
5. **Cleanup**: Session disconnected and cleaned up

### Session Types

- **Realtime Sessions**: Full voice conversation with AI
- **WebSocket Sessions**: Direct WebSocket connection
- **Transcription Sessions**: Audio-to-text only

### Monitoring

The SessionManager component provides:
- Real-time session statistics
- Active session tracking
- Performance metrics
- Error monitoring
- Automatic cleanup

## Testing

### Automated Tests

The VoiceTestingInterface includes several automated test scenarios:

1. **Basic Connection Test**: Verify API connectivity
2. **Voice Quality Test**: Test different voices
3. **Transcription Accuracy Test**: Verify transcription quality
4. **WebSocket Stability Test**: Test connection stability
5. **Multilingual Support Test**: Test different languages
6. **High Load Test**: Performance under load

### Manual Testing

Manual testing tools include:
- Interactive voice chat
- Transcription testing
- Session monitoring
- Configuration testing

## Error Handling

### Common Issues

1. **API Key Missing**: Ensure OpenAI API key is configured
2. **Network Issues**: Check internet connection and firewall
3. **Microphone Access**: Verify browser permissions
4. **Session Limits**: Monitor concurrent session limits
5. **Audio Format**: Ensure supported audio formats

### Error Recovery

- Automatic reconnection for network issues
- Fallback to text input when voice fails
- Graceful degradation for unsupported features
- User-friendly error messages

## Performance Optimization

### Best Practices

1. **Session Cleanup**: Automatically clean up old sessions
2. **Audio Compression**: Use efficient audio formats
3. **Batch Processing**: Group related operations
4. **Caching**: Cache configuration and session data
5. **Monitoring**: Track performance metrics

### Resource Management

- Limit concurrent sessions
- Monitor memory usage
- Clean up audio resources
- Optimize network usage

## Security Considerations

### API Key Management

- Store API keys securely in admin configuration
- Use ephemeral keys for client-side connections
- Rotate keys regularly
- Monitor API usage

### Privacy

- Audio data is processed by OpenAI
- Transcriptions may be logged
- Implement data retention policies
- Provide user privacy controls

## Migration from Beta

The implementation supports both beta and GA versions of the Realtime API:

### Key Changes

1. **New URL Structure**: Updated endpoints for GA
2. **Event Names**: Updated event naming conventions
3. **Session Configuration**: New session structure
4. **Client Secrets**: New ephemeral key generation

### Backward Compatibility

The system automatically detects and handles both versions for smooth migration.

## Future Enhancements

### Planned Features

1. **Multi-language Support**: Enhanced language detection
2. **Voice Cloning**: Custom voice training
3. **Emotion Detection**: Sentiment analysis
4. **Real-time Translation**: Cross-language conversations
5. **Advanced Analytics**: Detailed usage statistics

### Integration Opportunities

1. **Assessment System**: Enhanced voice assessments
2. **Community Features**: Voice posts and comments
3. **Learning Modules**: Interactive voice lessons
4. **Coaching Sessions**: AI-powered voice coaching

## Troubleshooting

### Common Solutions

1. **Check API Key**: Verify OpenAI API key in admin panel
2. **Browser Permissions**: Ensure microphone access granted
3. **Network Connectivity**: Test internet connection
4. **Session Limits**: Check concurrent session usage
5. **Configuration**: Validate admin panel settings

### Debug Tools

- Browser developer console
- Network tab for WebSocket connections
- Session manager for active sessions
- Test interface for validation

## Support

For technical support and questions:

1. Check the admin testing interface
2. Review session manager logs
3. Validate configuration settings
4. Test with minimal configuration
5. Contact development team with specific error details

---

This implementation provides a comprehensive, production-ready integration of OpenAI's Realtime API with full admin configuration, testing capabilities, and seamless user experience.