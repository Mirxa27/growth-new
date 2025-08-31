# Voice Agent Migration Guide: OpenAI Realtime API

## Overview
This guide documents the migration from the legacy voice agent implementation to the new OpenAI Realtime API using WebSocket-based communication.

## Changes Made

### 1. Package Updates
- **Added**: `@openai/agents-realtime` package
- **Removed**: Legacy voice dependencies (if any)

### 2. New Architecture
- **WebSocket-based**: Direct connection to OpenAI Realtime API
- **Client Token**: Secure token generation via Supabase Edge Functions
- **Real-time Audio**: Native browser WebRTC for audio processing

### 3. New Files Created

#### Core Components
- `src/types/voice.ts` - TypeScript interfaces for voice agent
- `src/hooks/useVoiceAgent.ts` - Custom hook for voice agent management
- `src/components/voice/NewVoiceAgent.tsx` - React component for voice UI
- `supabase/functions/generate-voice-token/index.ts` - Edge function for secure token generation

#### Updated Pages
- `src/pages/Chat.tsx` - Updated to use new voice agent with tabs for voice/text

## Environment Variables Required

Add these to your `.env` file:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install @openai/agents-realtime
```

### 2. Deploy Edge Function
```bash
supabase functions deploy generate-voice-token
```

### 3. Configure Environment
Update your environment variables with the required keys.

## Usage

### Basic Usage
```tsx
import { NewVoiceAgent } from '@/components/voice/NewVoiceAgent';

function App() {
  return (
    <div>
      <NewVoiceAgent />
    </div>
  );
}
```

### Advanced Usage
```tsx
import { useVoiceAgent } from '@/hooks/useVoiceAgent';

function CustomVoiceComponent() {
  const config = {
    name: 'My Voice Agent',
    instructions: 'Your custom instructions here',
    voice: 'alloy',
    temperature: 0.7,
    maxTokens: 1000,
  };

  const { state, messages, connect, disconnect, startRecording, stopRecording } = useVoiceAgent(config);

  // Use the hook methods
}
```

## API Reference

### useVoiceAgent Hook
```typescript
const {
  state,           // VoiceSessionState
  messages,        // VoiceMessage[]
  connect,         // () => Promise<void>
  disconnect,      // () => void
  startRecording,  // () => Promise<void>
  stopRecording,   // () => void
  sendTextMessage,   // (message: string) => void
  clearMessages,    // () => void
} = useVoiceAgent(config);
```

### VoiceSessionState
```typescript
interface VoiceSessionState {
  isConnected: boolean;
  isRecording: boolean;
  isSpeaking: boolean;
  transcript: string;
  error: string | null;
}
```

## Security Features

### Client Token Generation
- Uses Supabase Edge Functions for secure token generation
- Validates user authentication before generating tokens
- Tokens expire automatically (set by OpenAI)

### WebSocket Security
- Uses secure WebSocket connection (wss://)
- Tokens are passed as WebSocket subprotocol headers
- No API keys exposed to client-side code

## Migration Steps

### 1. Remove Legacy Voice Code
- Remove any existing voice agent implementations
- Clean up old voice-related dependencies

### 2. Install New Dependencies
```bash
npm install @openai/agents-realtime
```

### 3. Add New Files
- Copy all new files from this implementation
- Update environment variables

### 4. Update Pages
- Replace old voice components with `NewVoiceAgent`
- Update routing if necessary

### 5. Deploy Edge Function
```bash
supabase functions deploy generate-voice-token
```

## Testing

### Manual Testing
1. Navigate to `/chat` page
2. Click "Connect Voice Agent"
3. Grant microphone permissions
4. Test voice conversation

### Automated Testing
- Test WebSocket connection
- Test token generation
- Test audio recording
- Test error handling

## Troubleshooting

### Common Issues

#### WebSocket Connection Failed
- Check OpenAI API key validity
- Ensure correct model name
- Verify network connectivity

#### Microphone Permission Denied
- Check browser permissions
- Ensure HTTPS (required for WebRTC)
- Test in supported browsers

#### Token Generation Failed
- Check Supabase authentication
- Verify edge function deployment
- Check environment variables

### Debug Mode
Enable debug logging by adding:
```typescript
// In useVoiceAgent.ts
ws.onmessage = (event) => {
  console.log('Received:', event.data);
  // ... rest of handler
};
```

## Browser Support
- Chrome 91+
- Firefox 90+
- Safari 15+
- Edge 91+

## Performance Considerations
- Audio processing is done client-side
- WebSocket connection is lightweight
- Memory usage scales with conversation length
- Consider implementing conversation history limits

## Future Enhancements
- Text chat integration
- Conversation history persistence
- Multiple voice options
- Custom voice training
- Real-time transcription
- Multi-language support
