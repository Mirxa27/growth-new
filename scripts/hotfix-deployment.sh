#!/bin/bash

# Hotfix Deployment Script
# Fixes critical deployment issues identified in production

set -e

echo "🔥 Newomen Platform - Critical Hotfix Deployment"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Applying critical fixes...${NC}"

# Fix 1: Create missing user_profiles table migration
echo -e "${BLUE}📝 Creating user_profiles table migration...${NC}"
cat > supabase/migrations/20250907120000_fix_user_profiles.sql << 'EOF'
-- Fix missing user_profiles table
-- This table is referenced by auth.service.ts

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    is_admin BOOLEAN DEFAULT FALSE,
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)
        )
    );

-- Grant permissions
GRANT ALL ON public.user_profiles TO authenticated;

-- Create trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing profiles data if profiles table exists
INSERT INTO public.user_profiles (id, email, display_name, avatar_url, role, is_admin, created_at, updated_at)
SELECT 
    p.id, 
    u.email,
    p.display_name,
    p.avatar_url,
    COALESCE(p.role, 'user'),
    COALESCE(p.is_admin, false),
    p.created_at,
    p.updated_at
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    role = EXCLUDED.role,
    is_admin = EXCLUDED.is_admin,
    updated_at = NOW();

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_admin ON public.user_profiles(is_admin) WHERE is_admin = true;
EOF

echo -e "${GREEN}✅ Created user_profiles migration${NC}"

# Fix 2: Update auth service to handle missing table gracefully
echo -e "${BLUE}📝 Creating auth service fallback...${NC}"
cat > src/services/auth-fallback.service.ts << 'EOF'
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/**
 * Auth Service Fallback
 * Handles missing user_profiles table gracefully
 */
export class AuthFallbackService {
  static async ensureUserProfile(userId: string, userData: any) {
    try {
      // Try to get from user_profiles first
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code === '42P01') {
        // Table doesn't exist, try profiles table
        logger.warn('user_profiles table not found, trying profiles table');
        
        const { data: profile, error: fallbackError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (fallbackError && fallbackError.code === '42P01') {
          // Neither table exists, create minimal profile
          logger.warn('No profile tables found, creating minimal profile');
          return {
            id: userId,
            email: userData.email,
            display_name: userData.display_name || userData.email?.split('@')[0],
            role: 'user',
            is_admin: false,
            created_at: new Date().toISOString()
          };
        }

        return profile;
      }

      return userProfile;
    } catch (error) {
      logger.error('Failed to load user profile', 'AuthFallbackService', error);
      
      // Return minimal profile as fallback
      return {
        id: userId,
        email: userData.email,
        display_name: userData.display_name || 'User',
        role: 'user',
        is_admin: false,
        created_at: new Date().toISOString()
      };
    }
  }

  static async createOrUpdateProfile(userId: string, userData: any) {
    try {
      // Try user_profiles first
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          email: userData.email,
          display_name: userData.display_name,
          avatar_url: userData.avatar_url,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error && error.code === '42P01') {
        // Fallback to profiles table
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email: userData.email,
            display_name: userData.display_name,
            avatar_url: userData.avatar_url,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (fallbackError) {
          throw fallbackError;
        }

        return fallbackData;
      }

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to create/update profile', 'AuthFallbackService', error);
      throw error;
    }
  }
}

export default AuthFallbackService;
EOF

echo -e "${GREEN}✅ Created auth fallback service${NC}"

# Fix 3: Create environment variable template with proper API key format
echo -e "${BLUE}📝 Creating environment template...${NC}"
cat > .env.example << 'EOF'
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenAI Configuration (Required for AI features)
# Get your API key from: https://platform.openai.com/account/api-keys
# Format: sk-proj-... (new format) or sk-... (legacy format)
OPENAI_API_KEY=sk-proj-your_openai_api_key_here

# Other AI Providers (Optional)
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key_here
GOOGLE_AI_API_KEY=your_google_ai_key_here

# App Configuration
VITE_APP_URL=https://your-domain.vercel.app
VITE_ENVIRONMENT=production

# Push Notifications (Optional)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key

# Analytics (Optional)
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
EOF

echo -e "${GREEN}✅ Created environment template${NC}"

# Fix 4: Create Chrome extension protection script
echo -e "${BLUE}📝 Creating extension protection...${NC}"
cat > public/extension-protection.js << 'EOF'
// Chrome Extension Protection Script
// Prevents extension conflicts with the application

(function() {
  'use strict';
  
  // Prevent extension script injection
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName) {
    const element = originalCreateElement.call(this, tagName);
    
    // Block suspicious script elements
    if (tagName.toLowerCase() === 'script') {
      const originalSetSrc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src').set;
      Object.defineProperty(element, 'src', {
        set: function(value) {
          if (value && (
            value.includes('chrome-extension://') ||
            value.includes('moz-extension://') ||
            value.includes('safari-extension://')
          )) {
            console.warn('Blocked extension script:', value);
            return;
          }
          originalSetSrc.call(this, value);
        },
        get: function() {
          return this.getAttribute('src');
        }
      });
    }
    
    return element;
  };
  
  // Protect against extension content script errors
  window.addEventListener('error', function(event) {
    if (event.filename && (
      event.filename.includes('extension://') ||
      event.filename.includes('content.js') ||
      event.filename.includes('contentSelector') ||
      event.filename.includes('floatingSphere')
    )) {
      event.preventDefault();
      event.stopPropagation();
      console.warn('Blocked extension error:', event.filename);
      return false;
    }
  }, true);
  
  // Protect against extension module errors
  const originalImport = window.import;
  if (originalImport) {
    window.import = function(specifier) {
      if (specifier && specifier.includes('extension://')) {
        console.warn('Blocked extension import:', specifier);
        return Promise.reject(new Error('Extension imports blocked'));
      }
      return originalImport.call(this, specifier);
    };
  }
  
  console.log('Extension protection initialized');
})();
EOF

echo -e "${GREEN}✅ Created extension protection${NC}"

# Fix 5: Update index.html to include extension protection
echo -e "${BLUE}📝 Updating index.html...${NC}"
if ! grep -q "extension-protection.js" index.html; then
    sed -i 's|</head>|  <script src="/extension-protection.js"></script>\n  </head>|' index.html
    echo -e "${GREEN}✅ Added extension protection to index.html${NC}"
fi

# Fix 6: Create API key validation script
echo -e "${BLUE}📝 Creating API key validation...${NC}"
cat > scripts/validate-api-keys.js << 'EOF'
#!/usr/bin/env node

import { config } from 'dotenv';
import fetch from 'node-fetch';

config({ path: '.env.local' });

const validateOpenAIKey = async (apiKey) => {
  if (!apiKey) {
    return { valid: false, error: 'API key not provided' };
  }

  if (!apiKey.startsWith('sk-')) {
    return { valid: false, error: 'Invalid API key format. Must start with sk-' };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      return { valid: false, error: 'Invalid API key or insufficient permissions' };
    }

    if (response.status === 429) {
      return { valid: true, warning: 'API key valid but rate limited' };
    }

    if (response.ok) {
      return { valid: true, message: 'API key is valid and working' };
    }

    return { valid: false, error: `API returned status ${response.status}` };
  } catch (error) {
    return { valid: false, error: `Network error: ${error.message}` };
  }
};

const main = async () => {
  console.log('🔑 Validating API Keys...\n');

  const openaiKey = process.env.OPENAI_API_KEY;
  
  if (openaiKey) {
    console.log('🔍 Checking OpenAI API key...');
    const result = await validateOpenAIKey(openaiKey);
    
    if (result.valid) {
      console.log('✅ OpenAI API key is valid');
      if (result.warning) {
        console.log(`⚠️ Warning: ${result.warning}`);
      }
    } else {
      console.log(`❌ OpenAI API key invalid: ${result.error}`);
      console.log('💡 Get a valid key from: https://platform.openai.com/account/api-keys');
    }
  } else {
    console.log('⚠️ OpenAI API key not configured');
    console.log('💡 Set OPENAI_API_KEY in your .env.local file');
  }

  console.log('\n🔑 API key validation complete');
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
EOF

echo -e "${GREEN}✅ Created API key validation script${NC}"

# Fix 7: Build and test
echo -e "${BLUE}🔨 Building with fixes...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful with all fixes applied${NC}"
else
    echo -e "${RED}❌ Build failed even with fixes${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 All critical fixes applied successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Configure valid OpenAI API key in environment"
echo "2. Apply database migrations to create missing tables"
echo "3. Deploy to Vercel: npm run deploy:vercel"
echo "4. Verify deployment: node scripts/verify-deployment.js"
echo ""
echo -e "${BLUE}💡 For API key issues:${NC}"
echo "   • Get key from: https://platform.openai.com/account/api-keys"
echo "   • Use format: sk-proj-... or sk-..."
echo "   • Set in .env.local: OPENAI_API_KEY=your_key_here"
echo ""