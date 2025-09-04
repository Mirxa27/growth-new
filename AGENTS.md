# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Non-Obvious Rules (Discovered by File Analysis)

### Build & Test Commands (Non-Standard)
- `npm run test:unit` - runs vitest on `src/**/*.test.ts` (not the standard `npm test`)
- `TEST_FUNCTIONS_URL` env var required for integration tests (not mentioned in docs)
- `npm run test:ci` - runs unit → integration → e2e in sequence (custom chain)

### Database & Migration Gotchas
- All migration scripts MUST run from project root (scripts fail if run from subdirs)
- `supabase/functions/_shared/cors.ts` enforces CORS only for live environment (dev allows all origins)
- Edge functions require explicit `type: 'module'` in manifest.json for content scripts

### Performance Monitoring Traps
- Performance thresholds in `src/services/monitoring/performance.service.ts` are **development-inflated** (FCP: 4s, LCP: 5s) - will change in production
- Metrics only send to Supabase in production builds (`import.meta.env.PROD` check)
- PerformanceObserver fails silently on unsupported browsers (wrapped in try/catch)

### Testing Configuration Quirks
- Vitest excludes `src/components/ui/` from coverage (shadcn components)
- Test files MUST be co-located with source (not in separate test folders)
- E2E tests expect server on port 5173 (hardcoded in e2e/playwright.config.ts)

### Environment & Secrets
- Extension build process automatically injects `.env.test` for test environment
- `.env.production` and `.env.test` are tracked in git (unusual for env files)
- Build scripts modify extension manifest.json to add module type (runtime mutation)

### Hidden Dependencies
- `capacitor.config.ts` exists but Capacitor integration is incomplete (may break builds)
- Extension build requires `fs-extra` package (not standard fs)
- `performanceMonitor` singleton auto-initializes on import (side effect)