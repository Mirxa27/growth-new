# Project Coding Rules (Non-Obvious Only)

## Critical Patterns Discovered

### Test Configuration
- Test files must be co-located with source files (not in separate test folders) - vitest.config.ts excludes `src/components/ui/` from coverage
- `TEST_FUNCTIONS_URL` environment variable is required for integration tests but undocumented
- Test environment automatically loads `.env.test` via dotenv in test/setup.ts

### Build Process
- Extension build script (`scripts/build-extension.js`) automatically modifies manifest.json to add `"type": "module"` to content scripts
- Build process requires `fs-extra` package instead of standard Node.js `fs` module
- Extension build copies files to `dist/extension/` with runtime manifest modification

### Performance Monitoring
- `performanceMonitor` singleton auto-initializes on import in src/services/monitoring/performance.service.ts (side effect)
- Performance thresholds are artificially inflated for development (FCP: 4s, LCP: 5s vs production values)
- Metrics only send to Supabase in production builds (checked via `import.meta.env.PROD`)

### Environment Variables
- `.env.production` and `.env.test` are tracked in git (unusual practice for environment files)
- Extension build process automatically injects `.env.test` for test environment
- Capacitor configuration exists in `capacitor.config.ts` but integration is incomplete