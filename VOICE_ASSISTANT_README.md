# OpenAI GPT-4o Realtime Voice Assistant

A comprehensive real-time voice assistant implementation using OpenAI's latest GPT-4o Realtime API with advanced configuration options and seamless user experience.

## 🎯 Features

### Core Capabilities
- **Native Speech-to-Speech**: Direct audio processing without STT/TTS pipeline
- **Sub-second Latency**: Real-time conversation with minimal delay
- **Voice Activity Detection**: Smart detection of speech with configurable sensitivity
- **Interruption Handling**: Natural conversation flow with barge-in support
- **Multiple Voice Options**: Six distinct voices (Alloy, Echo, Fable, Onyx, Nova, Shimmer)
- **Real-time Transcription**: Live text display of conversations

### Technical Features
- **WebSocket Streaming**: Persistent, low-latency connection
- **Audio Worklet Processing**: Real-time audio processing using Web Audio API
- **Configurable Audio Formats**: PCM16, G.711 μ-law, G.711 A-law support
- **Advanced VAD**: Voice Activity Detection with customizable thresholds
- **Error Handling**: Comprehensive error recovery and user feedback

### Admin Features
- **Advanced Configuration Panel**: Comprehensive settings management
- **Multiple Configurations**: Save and load different voice assistant setups
- **Live Testing**: Test configurations before deployment
- **Real-time Monitoring**: Audio level visualization and connection status
- **Security**: Ephemeral token management for secure API access

## 🏗️ Architecture

### Frontend Components

#### 1. EnhancedRealtimeVoiceAgent (`/src/components/voice/EnhancedRealtimeVoiceAgent.tsx`)
Main voice interface component with:
- Connection management
- Audio streaming
- Conversation display
- Real-time audio level monitoring
- Voice Activity Detection

#### 2. AdvancedVoiceConfigPanel (`/src/components/admin/AdvancedVoiceConfigPanel.tsx`)
Comprehensive admin panel with:
- AI model configuration
- Voice and audio settings
- Response behavior tuning
- Advanced parameters
- Configuration management

#### 3. Audio Processor (`/public/audio-processor.js`)
AudioWorklet processor for:
- Real-time audio processing
- Voice Activity Detection
- Audio level monitoring
- PCM16 conversion

### Backend Infrastructure

#### 1. Realtime Token Edge Function (`/supabase/functions/get-realtime-token/index.ts`)
Secure token generation service:
- OpenAI API integration
- Ephemeral token creation
- User authentication
- Error handling and retries

#### 2. Database Schema
Voice agent configurations stored in Supabase:
- Multiple configuration support
- Active configuration management
- User-specific settings

## 🚀 Getting Started

### Prerequisites
- OpenAI API key with Realtime API access
- Supabase project
- Modern browser with WebRTC support

### Setup

1. **Environment Variables**
   ```bash
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   ```

2. **Deploy Edge Function**
   ```bash
   supabase functions deploy get-realtime-token
   ```

3. **Database Setup**
   The voice_agent_configs table is automatically created with the schema:
   ```sql
   CREATE TABLE voice_agent_configs (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name TEXT NOT NULL,
     model TEXT DEFAULT 'gpt-4o-realtime-preview',
     voice TEXT DEFAULT 'alloy',
     instructions TEXT,
     temperature REAL DEFAULT 0.8,
     max_tokens INTEGER DEFAULT 4096,
     is_active BOOLEAN DEFAULT false,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   ```

### Usage

1. **Navigate to Voice Demo**
   Visit `/voice-demo` to see the complete implementation

2. **Admin Configuration**
   Access `/admin` and go to the Voice tab for configuration

3. **Start Voice Session**
   - Click "Start Voice Session" 
   - Allow microphone access
   - Begin speaking to interact with NewMe

## 🔧 Configuration Options

### AI Model Settings
- **Model**: Choose between GPT-4o Realtime variants
- **Temperature**: Control response randomness (0.0-2.0)
- **Max Tokens**: Limit response length
- **Top P**: Nucleus sampling parameter
- **Penalties**: Frequency and presence penalties

### Voice & Audio
- **Voice Selection**: Six pre-trained voices
- **Speech Speed**: Adjustable playback speed (0.25x-4x)
- **Audio Format**: PCM16, G.711 formats
- **Sample Rate**: Audio quality setting
- **VAD Threshold**: Voice detection sensitivity

### Behavior Settings
- **Silence Duration**: Pause detection timing
- **Interruption Handling**: Enable/disable barge-in
- **Transcription**: Real-time text display
- **System Instructions**: Custom AI personality

## 🔐 Security

### Token Management
- Ephemeral tokens with automatic expiration
- No API keys exposed to frontend
- User authentication required

### Audio Privacy
- No audio recording or storage
- Real-time processing only
- Secure WebSocket connections

## 🎛️ Audio Worklet Implementation

The audio processor uses AudioWorkletProcessor for:

```javascript
class AudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.vadThreshold = 0.01;
    this.audioBuffer = [];
    // Voice Activity Detection setup
  }

  process(inputs, outputs, parameters) {
    // Real-time audio processing
    // VAD implementation
    // PCM16 conversion
    return true;
  }
}
```

### Features:
- Real-time Voice Activity Detection
- Audio level monitoring
- Seamless audio buffering
- PCM16 format conversion

## 🌐 WebSocket Communication

Real-time communication with OpenAI using:

```typescript
const wsUrl = `wss://api.openai.com/v1/realtime?model=${model}`;
const ws = new WebSocket(wsUrl, [
  'realtime',
  `openai-insecure-api-key.${ephemeralToken}`
]);
```

### Message Types:
- `session.update`: Configure session parameters
- `input_audio_buffer.append`: Send audio data
- `response.audio.delta`: Receive audio responses
- `conversation.item.input_audio_transcription.completed`: Transcription events

## 📱 Browser Compatibility

### Required Features:
- WebRTC support
- AudioWorklet API
- WebSocket connections
- MediaDevices.getUserMedia()

### Supported Browsers:
- Chrome 66+
- Firefox 76+
- Safari 14.1+
- Edge 79+

## 🔧 Troubleshooting

### Common Issues:

1. **Audio Context Sample Rate Mismatch**
   - Fixed by using single AudioContext instance
   - Consistent 24kHz sample rate

2. **Microphone Permission Denied**
   - Ensure HTTPS connection
   - Check browser permissions

3. **WebSocket Connection Failed**
   - Verify OpenAI API key
   - Check ephemeral token generation

4. **Voice Activity Detection Issues**
   - Adjust VAD threshold in settings
   - Check microphone input levels

## 📈 Performance Optimization

### Audio Processing:
- Buffered audio transmission
- Efficient VAD algorithms
- Minimal latency audio pipeline

### Memory Management:
- Automatic buffer cleanup
- Connection state management
- Audio context lifecycle

### Network Optimization:
- WebSocket keep-alive
- Retry mechanisms
- Error recovery

## 🔄 Future Enhancements

### Planned Features:
- Multi-language support
- Custom voice training
- Advanced emotion detection
- Integration with other AI models
- Voice conversation analytics

### Technical Improvements:
- WebRTC data channels
- Advanced audio effects
- Noise cancellation
- Echo reduction

## 📚 API Reference

### EnhancedRealtimeVoiceAgent Props
```typescript
interface VoiceAgentProps {
  // Configuration overrides
  config?: Partial<VoiceConfig>;
  // Event handlers
  onConnectionChange?: (status: ConnectionStatus) => void;
  onTranscriptUpdate?: (transcript: TranscriptEntry[]) => void;
}
```

### AdvancedVoiceConfigPanel Props
```typescript
interface ConfigPanelProps {
  // Initial configuration
  initialConfig?: VoiceConfig;
  // Save callback
  onConfigSave?: (config: VoiceConfig) => void;
}
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Implement changes
4. Add tests
5. Submit pull request

## 📄 License

This project is licensed under the MIT License.

---

## 🎉 Demo

Experience the voice assistant live at `/voice-demo` in your application.

The implementation showcases the cutting-edge capabilities of OpenAI's GPT-4o Realtime API with a production-ready interface and comprehensive configuration options.
