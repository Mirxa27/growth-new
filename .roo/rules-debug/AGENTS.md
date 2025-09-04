# Project Debug Rules (Non-Obvious Only)

## Hidden Debugging Patterns

### Testing Environment
- Integration tests require `TEST_FUNCTIONS_URL` environment variable (undocumented dependency)
- Test setup automatically loads `.env.test` via dotenv - no manual environment setup needed
- E2E tests hardcode server port 5173 in e2e/playwright.config.ts
- `npm run test:ci` runs tests in sequence: unit → integration → e2e (custom chain)

### Performance Monitoring
- PerformanceObserver failures are silently swallowed with console.warn in src/services/monitoring/performance.service.ts
- Development performance thresholds are artificially inflated (4s FCP, 5s LCP vs production)
- Performance metrics only send to Supabase in production builds (import.meta.env.PROD check)

### Build & Deployment
- Extension manifest.json is modified at build time to add "type": "module" to content scripts
- Capacitor integration is incomplete despite capacitor.config.ts presence (may break builds)
- Build scripts use fs-extra instead of standard Node.js fs module

### Environment Issues
- All migration scripts MUST run from project root (they fail if run from subdirectories)
- CORS headers in supabase/functions/_shared/cors.ts are for live environment only (dev allows all origins)
- Environment files (.env.production, .env.test) are tracked in git (unusual practice)