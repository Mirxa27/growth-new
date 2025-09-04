# Deploy & Migrate — Realtime Voice Agent

Overview
This document explains how to apply the database migration created in this branch, how to deploy the app to Vercel using the included GitHub Actions workflow, and how to test the get-realtime-token serverless function.

Prerequisites
- A machine with network access to your Supabase project (psql or Supabase Dashboard).
- Supabase project credentials and DB connection string (SUPABASE_DB_URL).
- Vercel account and project.
- GitHub repository with branch `feat/realtime-voice-agent` pushed.

Migration files
- [`supabase/migrations/20250904041000_add_voice_agent_config_columns.sql`](supabase/migrations/20250904041000_add_voice_agent_config_columns.sql:1)
- Rollback: [`supabase/migrations/20250904041001_rollback_voice_agent_config_columns.sql`](supabase/migrations/20250904041001_rollback_voice_agent_config_columns.sql:1)

Apply migration via psql (recommended)
1. Export DB URL locally:
   export DATABASE_URL="postgresql://postgres:<PASSWORD>@db.<project>.supabase.co:5432/postgres"
2. Run the migration:
   psql "$DATABASE_URL" -f supabase/migrations/20250904041000_add_voice_agent_config_columns.sql

If you store the DB URL in your .env as SUPABASE_DB_URL:
   DB_URL=$(sed -n 's/^SUPABASE_DB_URL=//p' .env)
   psql "$DB_URL" -f supabase/migrations/20250904041000_add_voice_agent_config_columns.sql

Apply migration via Supabase Studio
- Go to Supabase → Database → SQL editor
- Open [`supabase/migrations/20250904041000_add_voice_agent_config_columns.sql`](supabase/migrations/20250904041000_add_voice_agent_config_columns.sql:1), paste the SQL, and run.

Verification queries
- Confirm columns:
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'voice_agent_configs'
    AND column_name IN ('api_base_url','openai_api_key','openai_organization','openai_project','max_tokens','top_p','frequency_penalty','presence_penalty','enable_realtime','use_proxy','proxy_url','input_audio_transcription_model','language','arabic_support','emotion_detection');

- Check boolean defaults:
  SELECT COUNT(*) FROM public.voice_agent_configs WHERE enable_realtime IS NULL OR use_proxy IS NULL OR arabic_support IS NULL OR emotion_detection IS NULL;

Rollback
- To revert the migration:
  psql "$DATABASE_URL" -f supabase/migrations/20250904041001_rollback_voice_agent_config_columns.sql

Vercel: GitHub Actions deploy
- Workflow added: [`.github/workflows/vercel-deploy.yml`](.github/workflows/vercel-deploy.yml:1)
- Add the following repository secrets in GitHub:
  - VERCEL_TOKEN
  - VERCEL_ORG_ID
  - VERCEL_PROJECT_ID
- Also add environment variables as needed (Settings → Variables):
  - SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY / SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY (server only)
  - OPENAI_API_KEY (for server-side)

Triggering deploy
- Push to branch `feat/realtime-voice-agent`. The workflow will build and deploy a preview to Vercel automatically.
- Monitor the Actions run in GitHub Actions and the Vercel preview URL in the workflow logs.

Testing the get-realtime-token function (curl)
- Replace <PROJECT_FUNCTIONS_HOST> and <ADMIN_JWT> then run:
  curl -i -X POST "https://<PROJECT_FUNCTIONS_HOST>/get-realtime-token" \
    -H "Authorization: Bearer <ADMIN_JWT>" \
    -H "Content-Type: application/json" \
    -d '{}'

- Please paste the full terminal output (HTTP response headers + body) if troubleshooting is needed.

Common failures & troubleshooting
- "No client secret received": upstream OpenAI returned unexpected JSON shape — check OpenAI API key, and view Action logs for the exact upstream error.
- PGRST204 PostgREST "Could not find column": run the migration and refresh the Supabase schema cache.
- Network errors when running psql from CI/workspace: ensure your environment can reach the Supabase DB host or use Supabase Studio.

Post-deploy validation
- Run the Playwright E2E tests included: npm run test:e2e
- Smoke test the Admin panel: sign in as admin → Settings → Voice Agent → Start Live Session / Test Config

PR & next steps
- Feature branch: `feat/realtime-voice-agent` (pushed)
- Create a PR on GitHub and add reviewers. Link: https://github.com/Mirxa27/growth-new/pull/new/feat/realtime-voice-agent

If you want, I can:
- Add the curl reproduction command output parser into CI to auto-detect token issues.
- Run Playwright tests in CI once Vercel preview is available.

End of document.