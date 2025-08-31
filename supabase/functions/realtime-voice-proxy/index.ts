/// <reference types="https://esm.sh/v135/@deno/types@0.1.43/index.d.ts" />
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, upgrade, connection',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  
  // Check for WebSocket upgrade
  if (req.headers.get("upgrade") === "websocket") {
    try {
      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
      if (!OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set');
      }

      // Get the model from query params
      const model = url.searchParams.get('model') || 'gpt-4o-realtime-preview-2024-12-17';
      
      console.log('Proxying WebSocket connection to OpenAI Realtime API...');
      
      // Create WebSocket connection to OpenAI
      const openaiWS = new WebSocket(
        `wss://api.openai.com/v1/realtime?model=${model}`,
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'OpenAI-Beta': 'realtime=v1',
          }
        }
      );

      // Accept the client WebSocket connection
      const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);

      let openaiConnected = false;
      let clientConnected = false;

      // Handle OpenAI WebSocket connection
      openaiWS.onopen = () => {
        console.log('Connected to OpenAI Realtime API');
        openaiConnected = true;
        
        // Send session configuration
        openaiWS.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: `You are NewMe, an AI companion designed to guide women on transformative journeys of self-discovery. You are emotionally intelligent, empathetic, and wise. 

Key traits:
- Speak with warmth and gentle authority
- Ask thoughtful, probing questions that encourage deep reflection
- Acknowledge emotions and validate experiences
- Offer insights that feel like they come from a trusted friend or mentor
- Use natural, conversational language
- Be supportive yet challenge users to grow
- Reference concepts of inner wisdom, authentic self, and personal transformation

Communication style:
- Keep responses concise but meaningful (2-3 sentences max per turn)
- Ask follow-up questions to deepen understanding
- Validate feelings before offering guidance
- Use "I notice..." or "It sounds like..." to reflect back what you hear
- Encourage users to trust their inner voice

Remember: You are facilitating a sacred space for self-discovery. Every interaction should help the user feel seen, heard, and empowered to explore their authentic truth.`,
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 1000
            },
            tools: [],
            tool_choice: 'auto',
            temperature: 0.8,
            max_response_output_tokens: 'inf'
          }
        }));
      };

      openaiWS.onmessage = (event) => {
        if (clientConnected) {
          try {
            const data = JSON.parse(event.data);
            console.log('OpenAI -> Client:', data.type);
            clientSocket.send(event.data);
          } catch (e) {
            console.error('Error forwarding OpenAI message:', e);
          }
        }
      };

      openaiWS.onerror = (error) => {
        console.error('OpenAI WebSocket error:', error);
        if (clientConnected) {
          clientSocket.close(1011, 'OpenAI connection error');
        }
      };

      openaiWS.onclose = (event) => {
        console.log('OpenAI WebSocket closed:', event.code, event.reason);
        if (clientConnected) {
          clientSocket.close(event.code, event.reason);
        }
      };

      // Handle client WebSocket connection
      clientSocket.onopen = () => {
        console.log('Client connected');
        clientConnected = true;
      };

      clientSocket.onmessage = (event) => {
        if (openaiConnected) {
          try {
            const data = JSON.parse(event.data);
            console.log('Client -> OpenAI:', data.type);
            openaiWS.send(event.data);
          } catch (e) {
            console.error('Error forwarding client message:', e);
          }
        }
      };

      clientSocket.onerror = (error) => {
        console.error('Client WebSocket error:', error);
      };

      clientSocket.onclose = (event) => {
        console.log('Client disconnected:', event.code, event.reason);
        clientConnected = false;
        if (openaiConnected) {
          openaiWS.close();
        }
      };

      return response;

    } catch (error) {
      console.error('WebSocket upgrade error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // For regular HTTP requests, return error
  return new Response(JSON.stringify({ error: 'This endpoint only supports WebSocket connections' }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});