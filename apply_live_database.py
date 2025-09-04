import psycopg2
import os
from psycopg2.extras import RealDictCursor

# Database connection parameters
DB_HOST = "db.ufgqmqoykddaotdbwteg.supabase.co"
DB_PORT = 5432
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASSWORD = "Mirxa420$"

def apply_voice_tables():
    """Apply voice tables to live Supabase database"""
    
    # Connection string
    conn_string = f"host={DB_HOST} port={DB_PORT} dbname={DB_NAME} user={DB_USER} password={DB_PASSWORD}"
    
    try:
        # Connect to the database
        conn = psycopg2.connect(conn_string)
        cursor = conn.cursor()
        
        print("🚀 Connecting to live Supabase database...")
        
        # Read and execute the SQL file
        with open('apply_voice_tables.sql', 'r') as file:
            sql_content = file.read()
        
        # Split into individual statements
        statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
        
        print(f"📋 Found {len(statements)} SQL statements to execute")
        
        # Execute each statement
        for i, statement in enumerate(statements, 1):
            if statement and not statement.startswith('--'):
                try:
                    cursor.execute(statement)
                    print(f"✅ Statement {i} executed successfully")
                except Exception as e:
                    # Skip if table already exists
                    if "already exists" in str(e).lower():
                        print(f"ℹ️ Statement {i} skipped (already exists)")
                    else:
                        print(f"⚠️ Statement {i} warning: {e}")
        
        # Commit changes
        conn.commit()
        
        # Verify tables exist
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('voice_sessions', 'voice_agent_configs')
        """)
        
        tables = cursor.fetchall()
        print(f"✅ Tables verified: {[t[0] for t in tables]}")
        
        # Check default configuration
        cursor.execute("SELECT name FROM voice_agent_configs WHERE name = 'NewMe Default Voice'")
        config = cursor.fetchone()
        if config:
            print("✅ Default voice configuration exists")
        else:
            print("⚠️ Default voice configuration not found")
        
        cursor.close()
        conn.close()
        
        print("🎉 Voice tables successfully applied to live database!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    apply_voice_tables()
