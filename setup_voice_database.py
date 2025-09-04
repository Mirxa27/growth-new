#!/usr/bin/env python3
import psycopg2
import os
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Database connection details
DB_URL = "postgresql://postgres:Mirxa420$@db.ufgqmqoykddaotdbwteg.supabase.co:5432/postgres"

def create_tables():
    """Create voice-related tables in the database"""
    
    conn = psycopg2.connect(DB_URL)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    # Read and execute the SQL migration
    with open('supabase/migrations/20240104_create_voice_sessions_table.sql', 'r') as f:
        sql_content = f.read()
    
    try:
        cursor.execute(sql_content)
        print("✅ Voice tables created successfully")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
    finally:
        cursor.close()
        conn.close()

def verify_tables():
    """Verify that tables were created"""
    
    conn = psycopg2.connect(DB_URL)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('voice_sessions', 'voice_agent_configs')
        """)
        
        tables = cursor.fetchall()
        print("✅ Tables found:", [table[0] for table in tables])
        
        # Check if default config exists
        cursor.execute("SELECT COUNT(*) FROM voice_agent_configs WHERE name = 'NewMe Default Voice'")
        count = cursor.fetchone()[0]
        if count > 0:
            print("✅ Default voice configuration exists")
        else:
            print("⚠️ Default voice configuration not found")
            
    except Exception as e:
        print(f"❌ Error verifying tables: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    print("🚀 Setting up voice database...")
    create_tables()
    verify_tables()
    print("✅ Voice database setup complete!")
