# Project Architecture Rules (Non-Obvious Only)

## Hidden Architectural Constraints

### Testing Architecture
- Test files must be co-located with source (vitest.config.ts excludes separate test folders)
- Integration tests require undocumented `TEST_FUNCTIONS_URL` environment variable
- Test:ci runs custom sequence: unit → integration → e2e (not standard npm test)

### Build & Deployment Architecture
- Extension build process modifies manifest.json at runtime to add `"type": "module"` to content scripts
- Build scripts use `fs-extra` dependency (not standard Node.js fs) - hidden coupling
- Post-build optimization runs via `scripts/optimize-build.js` (not in standard build pipeline)

### Performance Architecture
- Performance thresholds are artificially inflated for development (4s FCP, 5s LCP) - production values differ
- Performance metrics only send to Supabase in production builds (controlled by `import.meta.env.PROD`)
- PerformanceObserver failures are silently swallowed - no error handling for unsupported browsers

### Environment Architecture
- Environment files (.env.production, .env.test) are tracked in git (violates standard security practices)
- Extension build automatically injects `.env.test` for test environment
- Capacitor integration is incomplete despite capacitor.config.ts presence (architectural debt)

### Security Architecture
- CORS headers in supabase/functions/_shared/cors.ts are for live environment only - dev allows all origins
- Migration scripts have directory dependency - must run from project root (architectural constraint)
- Extension manifest is mutated during build process (not immutable)