#!/bin/bash

# This script deploys all Supabase Edge Functions.

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
# Set your Supabase Project ID here if it's not in your environment variables.
# You can find this in your Supabase project's dashboard URL: https://app.supabase.com/project/YOUR_PROJECT_ID
PROJECT_ID="ufgqmqoykddaotdbwteg"

# --- Pre-flight Checks ---
echo "🚀 Starting Supabase Edge Functions deployment..."

# 1. Check for Supabase Access Token
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "❌ Error: SUPABASE_ACCESS_TOKEN is not set."
    echo "Please create a token at https://app.supabase.com/account/tokens and set it as an environment variable:"
    echo "export SUPABASE_ACCESS_TOKEN=\"your-token\""
    exit 1
fi

# 3. Check for Project ID
if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: Project ID is not configured in the script."
    echo "Please set the PROJECT_ID variable at the top of this script."
    exit 1
fi

# --- Deployment ---
FUNCTIONS_DIR="supabase/functions"

if [ ! -d "$FUNCTIONS_DIR" ]; then
    echo "❌ Error: Directory '$FUNCTIONS_DIR' not found."
    exit 1
fi

echo "🔍 Found functions in '$FUNCTIONS_DIR'. Deploying now..."

# Loop through each directory in the functions folder
for FUNCTION_NAME in "$FUNCTIONS_DIR"/*/; do
    # Extract the function name from the path
    FUNCTION_NAME=$(basename "$FUNCTION_NAME")

    # Skip the _shared directory
    if [ "$FUNCTION_NAME" == "_shared" ]; then
        echo "⏩ Skipping '_shared' directory."
        continue
    fi

    echo "📦 Deploying function: $FUNCTION_NAME..."

    # Deploy the function
    npx supabase functions deploy "$FUNCTION_NAME" --project-ref "$PROJECT_ID"

    if [ $? -eq 0 ]; then
        echo "✅ Successfully deployed '$FUNCTION_NAME'."
    else
        echo "❌ Failed to deploy '$FUNCTION_NAME'."
        # Decide if you want the script to exit on failure or continue
        # exit 1 # Uncomment to stop on first failure
    fi
    echo "----------------------------------------"
done

echo "✨ All functions have been processed."
echo "✅ Deployment script finished!"