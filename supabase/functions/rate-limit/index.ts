/// <reference types="https://esm.sh/v135/@deno/types@0.1.43/index.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Simple in-memory rate limiting for demonstration
// In production, use Redis or a persistent cache
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const defaultConfig: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60000 // 1 minute
};

const configs: Record<string, RateLimitConfig> = {
  'auth': { maxRequests: 5, windowMs: 300000 }, // 5 requests per 5 minutes
  'chat': { maxRequests: 30, windowMs: 60000 }, // 30 requests per minute
  'exploration': { maxRequests: 3, windowMs: 3600000 }, // 3 requests per hour
  'admin': { maxRequests: 100, windowMs: 60000 } // 100 requests per minute
};

function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig = defaultConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const key = `${endpoint}:${identifier}`;
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || now > existing.resetTime) {
    const resetTime = now + config.windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: config.maxRequests - 1, resetTime };
  }

  if (existing.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetTime: existing.resetTime };
  }

  existing.count++;
  return { 
    allowed: true, 
    remaining: config.maxRequests - existing.count, 
    resetTime: existing.resetTime 
  };
}

function cleanup() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up expired entries every 5 minutes
setInterval(cleanup, 5 * 60 * 1000);

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-endpoint, x-identifier',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const endpoint = req.headers.get('x-endpoint') || 'default';
    const identifier = req.headers.get('x-identifier') || 'anonymous';
    
    const config = configs[endpoint] || defaultConfig;
    const result = checkRateLimit(identifier, endpoint, config);

    const responseHeaders = {
      ...corsHeaders,
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.resetTime.toString(),
    };

    if (!result.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        }),
        { 
          status: 429, 
          headers: { ...responseHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        allowed: true,
        remaining: result.remaining,
        resetTime: result.resetTime
      }),
      { 
        status: 200, 
        headers: { ...responseHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Rate limit check failed:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});