// Enhanced CORS configuration with strict security
export const corsHeaders = {
  'Access-Control-Allow-Origin': getAllowedOrigin(),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Expose-Headers': 'content-length, content-range',
  'Access-Control-Max-Age': '86400',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
}

// Production origin whitelist
const ALLOWED_ORIGINS = [
  'https://newomen.me',
  'https://www.newomen.me',
  'https://app.newomen.me',
  'https://admin.newomen.me',
  'https://localhost:5173', // Development
  'https://localhost:4173', // Preview
]

function getAllowedOrigin(): string {
  // In production, only allow specific origins
  // Use a more secure approach for Deno environment
  try {
    // @ts-expect-error - Deno is available in Supabase Edge Functions
    const env = Deno.env.get('NODE_ENV')
    if (env === 'production') {
      return ALLOWED_ORIGINS.join(', ')
    }
  } catch {
    // Fallback to development mode if Deno.env is not available
    console.warn('Could not access Deno environment, using development CORS settings')
  }

  // In development, allow all origins for testing
  return '*'
}

// Alternative function for request-specific origin validation
export function validateOrigin(origin: string | null): boolean {
  if (!origin) return false

  try {
    // @ts-expect-error - Deno is available in Supabase Edge Functions
    const env = Deno.env.get('NODE_ENV')
    if (env === 'production') {
      return ALLOWED_ORIGINS.includes(origin)
    }
  } catch {
    // In development, allow all origins
    return true
  }

  return true
}
