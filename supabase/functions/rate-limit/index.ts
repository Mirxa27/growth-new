import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const rateLimit = new Map<string, { count: number, timestamp: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 20;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  const userEntry = rateLimit.get(ip);

  if (userEntry && now - userEntry.timestamp < RATE_LIMIT_WINDOW) {
    if (userEntry.count >= MAX_REQUESTS) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    userEntry.count++;
  } else {
    rateLimit.set(ip, { count: 1, timestamp: now });
  }

  // This function would typically wrap another function, but for simplicity,
  // we'll just return a success message.
  return new Response(JSON.stringify({ success: true, message: "Request allowed" }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});