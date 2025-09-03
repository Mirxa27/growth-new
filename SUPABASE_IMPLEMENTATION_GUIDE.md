# Supabase Implementation Guide

## Overview

This guide documents the complete Supabase implementation for the Life Navigation System, including authentication, database, storage, realtime, and edge functions.

## Table of Contents

1. [Authentication](#authentication)
2. [Database](#database)
3. [Storage](#storage)
4. [Realtime](#realtime)
5. [Edge Functions](#edge-functions)
6. [Deployment](#deployment)

## Authentication

### Services Implemented

#### AuthService (`src/services/supabase/auth.service.ts`)
- Complete authentication flow with email/password
- OAuth providers (Google, GitHub, etc.)
- Magic link authentication
- Password reset functionality
- User profile management
- Session management with auto-refresh

### Usage Examples

```typescript
import { authService } from '@/services/supabase/auth.service';

// Sign up
const { user, error } = await authService.signUp({
  email: 'user@example.com',
  password: 'password123',
  full_name: 'John Doe'
});

// Sign in
const { user, error } = await authService.signIn({
  email: 'user@example.com',
  password: 'password123'
});

// OAuth sign in
await authService.signInWithOAuth('google');

// Get current user
const user = authService.getUser();
const profile = authService.getProfile();
```

## Database

### Tables and RLS Policies

All tables have Row Level Security (RLS) enabled with appropriate policies:

1. **user_profiles** - User profile information
2. **assessments** - User assessments and results
3. **goals** - Personal goals and progress
4. **journal_entries** - Journal entries
5. **chat_sessions** & **chat_messages** - Chat history
6. **voice_sessions** - Voice interaction sessions
7. **notifications** - User notifications
8. **subscriptions** & **payments** - Billing information
9. **performance_metrics** - Application performance data
10. **error_logs** - Error tracking

### Database Functions

Key functions implemented:

```sql
-- Get user statistics
SELECT * FROM get_user_statistics('user-id');

-- Search user content
SELECT * FROM search_user_content('user-id', 'search query');

-- Get recent activity
SELECT * FROM get_recent_activity('user-id', 10);

-- Check subscription status
SELECT * FROM get_user_subscription_status('user-id');
```

### Automatic Triggers

- `handle_updated_at()` - Updates timestamp on record changes
- `handle_new_user()` - Creates profile and preferences for new users

## Storage

### Buckets Configured

1. **avatars** (public) - User profile pictures
2. **documents** (private) - User documents
3. **voice-recordings** (private) - Voice session recordings
4. **exports** (private) - Data exports

### Storage Service (`src/services/supabase/storage.service.ts`)

```typescript
import { storageService } from '@/services/supabase/storage.service';

// Upload avatar
const { url, error } = await storageService.uploadAvatar(file);

// Upload document
const { url, error } = await storageService.uploadDocument(file, 'folder-name');

// Get signed URL
const { url, error } = await storageService.getSignedUrl('documents', 'path/to/file');

// Export user data
const { url, error } = await storageService.exportUserData();
```

## Realtime

### Realtime Service (`src/services/supabase/realtime.service.ts`)

```typescript
import { realtimeService } from '@/services/supabase/realtime.service';

// Subscribe to table changes
const subscriptionId = realtimeService.subscribe('goals', (payload) => {
  console.log('Goal changed:', payload);
}, {
  event: 'INSERT',
  filter: 'user_id=eq.user-id'
});

// Subscribe to user data
const ids = realtimeService.subscribeToUserData(userId, {
  onGoalChange: (payload) => console.log('Goal:', payload),
  onNotificationChange: (payload) => console.log('Notification:', payload)
});

// Presence channels
const channel = realtimeService.createPresenceChannel('room-name', {
  onJoin: (key, current, joined) => console.log('User joined:', key),
  onLeave: (key, current, left) => console.log('User left:', key)
});

// Unsubscribe
await realtimeService.unsubscribe(subscriptionId);
```

## Edge Functions

### Deployed Functions

1. **get-realtime-token** - Generate ephemeral tokens for Realtime API
2. **realtime-voice-proxy** - Proxy for voice interactions
3. **create-checkout-session** - Stripe checkout sessions
4. **stripe-webhook** - Handle Stripe webhooks
5. **process-assessment** - Process assessment results
6. **analytics** - User analytics and insights

### Deployment

```bash
# Deploy all functions
supabase functions deploy get-realtime-token --no-verify-jwt
supabase functions deploy realtime-voice-proxy --no-verify-jwt
supabase functions deploy create-checkout-session --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy process-assessment --no-verify-jwt
supabase functions deploy analytics --no-verify-jwt
```

### Required Secrets

Set these in your Supabase dashboard:
- `OPENAI_API_KEY` - For AI features
- `STRIPE_SECRET_KEY` - For payments
- `STRIPE_WEBHOOK_SECRET` - For Stripe webhooks

## Deployment

### 1. Environment Variables

Create `.env.local`:
```env
VITE_SUPABASE_URL=https://ufgqmqoykddaotdbwteg.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Apply Migrations

```bash
# Apply all migrations
supabase db push --db-url "postgresql://postgres:password@db.project.supabase.co:5432/postgres"

# Or apply individually
supabase migration up
```

### 3. Deploy Edge Functions

```bash
# Link project
supabase link --project-ref ufgqmqoykddaotdbwteg

# Deploy functions
npm run deploy:functions
```

### 4. Configure Authentication Providers

In Supabase Dashboard:
1. Enable Email auth
2. Configure OAuth providers (Google, GitHub)
3. Set up redirect URLs

### 5. Set Storage Policies

Storage policies are automatically created by migrations.

## Best Practices

1. **Always use RLS** - Never disable RLS on production tables
2. **Service Role Key** - Only use in server-side/edge functions
3. **Error Handling** - Use the error handler service
4. **Caching** - Leverage cache service for frequently accessed data
5. **Realtime** - Unsubscribe when components unmount
6. **Storage** - Always validate file types and sizes

## Monitoring

1. **Performance Metrics** - Automatically tracked to `performance_metrics` table
2. **Error Logs** - Stored in `error_logs` table
3. **Analytics** - Use the analytics edge function for insights

## Security Checklist

- [x] All tables have RLS enabled
- [x] Sensitive operations use service role in edge functions
- [x] API keys stored as secrets, not in code
- [x] File uploads validated for type and size
- [x] User can only access their own data
- [x] Admin functions check user role

## Troubleshooting

### Common Issues

1. **406 Not Acceptable** - Check RLS policies
2. **CORS errors** - Ensure edge functions include CORS headers
3. **Auth errors** - Verify redirect URLs in Supabase dashboard
4. **Storage errors** - Check bucket policies and file size limits

### Debug Commands

```bash
# Check function logs
supabase functions logs get-realtime-token

# Test edge function locally
supabase functions serve get-realtime-token

# Check migration status
supabase db migrations list
```

## Next Steps

1. Monitor usage in Supabase dashboard
2. Set up alerts for errors
3. Configure backup schedule
4. Plan for scaling (connection pooling, read replicas)