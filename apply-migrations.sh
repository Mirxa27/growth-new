#!/bin/bash

echo "🔧 Applying Database Migrations..."
echo ""
echo "This script will apply all necessary database migrations to fix:"
echo "  - Missing avatar_url column in profiles table"
echo "  - Missing last_login_at column in profiles table"
echo "  - Missing voice and chat related tables"
echo "  - RLS policies for all tables"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo "📝 To apply migrations, run the following commands:"
echo ""
echo "1. Link to your Supabase project:"
echo "   supabase link --project-ref YOUR_PROJECT_REF"
echo ""
echo "2. Apply the migrations:"
echo "   supabase db push"
echo ""
echo "Or apply manually in Supabase Dashboard SQL Editor:"
echo ""
echo "-- Run these SQL files in order:"
echo "1. supabase/migrations/20250111_fix_profiles_schema.sql"
echo "2. supabase/migrations/20250111_complete_schema_fix.sql"
echo ""
echo "📌 Note: After applying migrations, restart your development server."