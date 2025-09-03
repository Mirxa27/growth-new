All-App Monorepo

## Apps
- apps/web: Vite React client
- apps/server: Express API (TypeScript)

## Development
- Copy env examples to .env files and fill keys
  - apps/server/.env: OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PORT
  - apps/web/web/.env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- Run server and web in separate terminals:
  - npm --workspace @all-app/server run dev
  - npm --workspace web run dev

## Voice Agent
- Client calls /api/realtime/token to get ephemeral key
- Uses @openai/agents/realtime to connect via WebRTC

## Supabase Schema
- apps/server/src/schema.sql contains initial tables

## iOS (Capacitor)
- Build web assets first: npm --workspace web run build
- Sync: npx cap sync ios
- Open Xcode: npx cap open ios
- Ensure microphone permission (NSMicrophoneUsageDescription) is present

