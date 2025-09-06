#!/bin/bash

# Assessment System Deployment Script
# Run this to set up the complete assessment system in your Supabase database

echo "🚀 Starting Assessment System Deployment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "\n${BLUE}📋 Instructions for Manual Database Setup:${NC}"
echo -e "${YELLOW}Since automatic migration failed, please follow these steps:${NC}\n"

echo -e "1. ${GREEN}Open your Supabase Dashboard${NC}"
echo -e "   🔗 https://supabase.com/dashboard/project/ufgqmqoykddaotdbwteg/sql/editor\n"

echo -e "2. ${GREEN}Copy and paste the following SQL files in order:${NC}"

echo -e "\n${BLUE}Step 1: Apply the Assessment System Schema${NC}"
echo -e "📁 File: supabase/migrations/20250906000000_comprehensive_assessment_quiz_system.sql"
echo -e "📝 This creates all the database tables, indexes, and security policies\n"

echo -e "${BLUE}Step 2: Apply the Sample Assessment Data${NC}"
echo -e "📁 File: supabase/migrations/20250906000001_sample_assessment_data.sql"
echo -e "📝 This adds a complete 15-question personality assessment with AI-driven feedback\n"

echo -e "${BLUE}Step 3: Deploy the AI Processing Edge Function${NC}"
echo -e "📁 Function: supabase/functions/process-assessment-results/index.ts"
echo -e "📝 Deploy via: npx supabase functions deploy process-assessment-results\n"

echo -e "${RED}⚠️  Important Notes:${NC}"
echo -e "• Make sure to run the SQL files in the SQL editor"
echo -e "• Check that all tables are created successfully"
echo -e "• Verify that the sample assessment appears in the assessments table"
echo -e "• The edge function requires OpenAI API key in Supabase secrets\n"

echo -e "${GREEN}✅ After completing these steps, you'll have:${NC}"
echo -e "• Complete assessment database with 7 interconnected tables"
echo -e "• 15-question personality assessment with 4 options each"
echo -e "• AI-driven results processing with personalized feedback"
echo -e "• Comprehensive admin interface for assessment management"
echo -e "• User-friendly assessment taking interface with animations\n"

echo -e "${BLUE}🎯 Testing the System:${NC}"
echo -e "• Visit /assessment in your app to take assessments"
echo -e "• Visit /admin to manage assessments"
echo -e "• Check the ComprehensiveAssessmentSystem component for full functionality\n"

# Display the SQL files for easy copying
echo -e "${YELLOW}📋 SQL File Contents:${NC}\n"

echo -e "${BLUE}=== ASSESSMENT SCHEMA SQL ===${NC}"
cat supabase/migrations/20250906000000_comprehensive_assessment_quiz_system.sql

echo -e "\n${BLUE}=== SAMPLE DATA SQL ===${NC}"
cat supabase/migrations/20250906000001_sample_assessment_data.sql

echo -e "\n${GREEN}🎉 Assessment System Ready for Deployment!${NC}"
echo -e "Copy the SQL content above and run it in your Supabase SQL editor."
