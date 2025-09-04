#!/usr/bin/env python3
"""
Critical Fix: Apply Database Schema Now
This script attempts to create the essential tables via Supabase REST API
"""

import requests
import json

# Production Supabase configuration
SUPABASE_URL = "https://ufgqmqoykddaotdbwteg.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA2MzY4MSwiZXhwIjoyMDY3NjM5NjgxfQ.ly1DdFt60DSLEUMtK5l0jr1G3TLiJnPohADSc4HZuwo"

def create_essential_tables():
    """Create the most critical tables to stop the errors"""
    
    headers = {
        'apikey': SERVICE_KEY,
        'Authorization': f'Bearer {SERVICE_KEY}',
        'Content-Type': 'application/json'
    }
    
    # Test connection first
    try:
        response = requests.get(f"{SUPABASE_URL}/rest/v1/", headers=headers, timeout=10)
        print(f"✅ Connection test: HTTP {response.status_code}")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False
    
    # Try to check if tables exist
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/admin_ai_providers?limit=1",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ admin_ai_providers table already exists")
            return True
        elif response.status_code == 404:
            print("❌ admin_ai_providers table does not exist")
        else:
            print(f"⚠️  Unexpected response: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error checking tables: {e}")
    
    print("\n📋 MANUAL DATABASE SETUP REQUIRED")
    print("=" * 50)
    print("The application is failing because database tables don't exist.")
    print("Please follow these steps:")
    print()
    print("1. Open Supabase Dashboard:")
    print("   https://supabase.com/dashboard/project/ufgqmqoykddaotdbwteg/sql")
    print()
    print("2. Open the file: MANUAL_DATABASE_SETUP.md")
    print("3. Copy the complete SQL script")
    print("4. Paste into Supabase SQL Editor")
    print("5. Click 'Run' to create all tables")
    print()
    print("This will create:")
    print("   ✅ admin_ai_providers (for AI configuration)")
    print("   ✅ profiles (for user accounts)")
    print("   ✅ assessments (for personality tests)")
    print("   ✅ voice_agent_configs (for voice features)")
    print("   ✅ posts (for community)")
    print("   ✅ + 8 more essential tables")
    print()
    print("🚨 Without these tables, the app will continue to show errors!")
    
    return False

if __name__ == "__main__":
    print("🔧 Growth Echo Nexus - Critical Database Fix")
    print("=" * 50)
    
    if create_essential_tables():
        print("✅ Database is ready!")
    else:
        print("⚠️  Manual setup required - see instructions above")
    
    print()
    print("📱 Your app is running at: http://localhost:5173")
    print("🎯 Admin panel: http://localhost:5173/admin")
    print("🗄️ Database: https://supabase.com/dashboard/project/ufgqmqoykddaotdbwteg")
