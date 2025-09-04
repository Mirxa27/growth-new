# Project Documentation Rules (Non-Obvious Only)

## Hidden Documentation Patterns

### Directory Structure Gotchas
- `test/` directory contains setup.ts which auto-loads .env.test - no manual setup required
- `src/components/ui/` is excluded from test coverage (shadcn components)
- Capacitor config exists (`capacitor.config.ts`) but integration is incomplete - may break builds

### Environment & Configuration
- Environment files (.env.production, .env.test) are tracked in git (unusual for env files)
- Extension build process automatically injects .env.test for test environment
- `TEST_FUNCTIONS_URL` environment variable is required for integration tests but undocumented

### Build Process
- Extension manifest.json is modified at build time by scripts/build-extension.js to add "type": "module"
- Build scripts require fs-extra package (not standard Node.js fs)
- Post-build optimization runs via scripts/optimize-build.js

### Testing Setup
- Test files must be co-located with source (not in separate test folders)
- E2E tests hardcode server port 5173 in e2e/playwright.config.ts
- Test:ci runs unit → integration → e2e in sequence (custom chain not standard npm test)

### Deployment Constraints
- Migration scripts must run from project root (fail if run from subdirectories)
- CORS configuration in supabase/functions/_shared/cors.ts is for live environment only