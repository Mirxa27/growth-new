#!/usr/bin/env bash
set -euo pipefail

# Supabase Functions Deployment Script (safe, generic)
# - Reads project ref from SUPABASE_PROJECT_REF
# - Deploys all function directories under supabase/functions (except _shared)

echo "🚀 Deploying Supabase Edge Functions..."

if ! command -v npx >/dev/null 2>&1; then
  echo "❌ npx is required (Node.js)" >&2
  exit 1
fi

PROJECT_REF="${SUPABASE_PROJECT_REF:-}"
if [ -z "$PROJECT_REF" ]; then
  echo "❌ SUPABASE_PROJECT_REF is not set. Export it first (e.g., 'export SUPABASE_PROJECT_REF=yourref')." >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
FUNCS_DIR="$ROOT_DIR/supabase/functions"

if [ ! -d "$FUNCS_DIR" ]; then
  echo "❌ Functions directory not found: $FUNCS_DIR" >&2
  exit 1
fi

# Discover functions: directories containing an index.(ts|js) file excluding _shared
mapfile -t FUNCTIONS < <(find "$FUNCS_DIR" -maxdepth 1 -mindepth 1 -type d \
  -not -name "_shared" \
  -exec bash -lc 'shopt -s nullglob; for f in "$1"/index.*; do echo "$(basename "$1")"; break; done' _ {} \; |
  sort -u)

if [ ${#FUNCTIONS[@]} -eq 0 ]; then
  echo "⚠️  No functions found to deploy in $FUNCS_DIR"
  exit 0
fi

DEPLOYED=0; FAILED=0
for func in "${FUNCTIONS[@]}"; do
  echo "\n📦 Deploying: $func"
  if npx supabase functions deploy "$func" --project-ref "$PROJECT_REF"; then
    echo "✅ $func deployed"
    ((DEPLOYED++))
  else
    echo "❌ $func failed"
    ((FAILED++))
  fi
done

echo "\n🎊 Summary: deployed=$DEPLOYED failed=$FAILED total=${#FUNCTIONS[@]}"
exit 0
