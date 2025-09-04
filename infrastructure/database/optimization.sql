-- Database Optimization and Scaling Configuration
-- Newomen.me Production Database Setup

-- Enable performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pg_buffercache;

-- Create monitoring user
CREATE USER monitoring_user WITH PASSWORD 'env(MONITORING_PASSWORD)';
GRANT CONNECT ON DATABASE postgres TO monitoring_user;
GRANT USAGE ON SCHEMA public TO monitoring_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitoring_user;
GRANT SELECT ON ALL TABLES IN SCHEMA pg_catalog TO monitoring_user;

-- Performance configuration settings
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.max = 10000;
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET effective_cache_size = '6GB';
ALTER SYSTEM SET maintenance_work_mem = '512MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_category_visibility ON assessments (category, visibility) WHERE visibility = 'public';
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_user_id ON assessment_results USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_assessment_id ON assessment_results USING btree (assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_completed_at ON assessment_results USING btree (completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users USING btree (email);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_activity_type ON user_activities (activity_type);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_assessment_composite ON assessments (category, difficulty_level, visibility) WHERE visibility = 'public';
CREATE INDEX IF NOT EXISTS idx_user_progress_composite ON user_progress (user_id, assessment_id, completed_at DESC);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_assessments_search ON assessments USING gin(to_tsvector('english', title || ' ' || description));
CREATE INDEX IF NOT EXISTS idx_community_posts_search ON community_posts USING gin(to_tsvector('english', title || ' ' || content));

-- Partition large tables for performance
CREATE TABLE IF NOT EXISTS assessment_results_archive (
    LIKE assessment_results INCLUDING ALL
) PARTITION BY RANGE (completed_at);

-- Create monthly partitions
DO $$
DECLARE
    month_start date;
    month_end date;
    partition_name text;
    start_date date := '2024-01-01';
    end_date date := '2026-12-31';
BEGIN
    WHILE start_date < end_date LOOP
        month_start := date_trunc('month', start_date);
        month_end := month_start + interval '1 month';
        partition_name := 'assessment_results_' || to_char(month_start, 'YYYY_MM');
        
        EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF assessment_results_archive FOR VALUES FROM (%L) TO (%L)',
            partition_name, month_start, month_end);
        
        start_date := month_end;
    END LOOP;
END $$;

-- Row Level Security Policies
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Policies for public assessments
CREATE POLICY "Public assessments are viewable by everyone" ON assessments
    FOR SELECT USING (visibility = 'public');

CREATE POLICY "Users can view their own private assessments" ON assessments
    FOR SELECT USING (auth.uid() = user_id OR visibility = 'public');

CREATE POLICY "Users can create their own assessments" ON assessments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assessments" ON assessments
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies for assessment results
CREATE POLICY "Users can view their own results" ON assessment_results
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own results" ON assessment_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for community posts
CREATE POLICY "Community posts are viewable by everyone" ON community_posts
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts" ON community_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON community_posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON community_posts
    FOR DELETE USING (auth.uid() = user_id);

-- Performance monitoring views
CREATE OR REPLACE VIEW performance_metrics AS
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation,
    most_common_vals,
    most_common_freqs
FROM pg_stats
WHERE schemaname = 'public';

-- Database size monitoring
CREATE OR REPLACE VIEW database_size AS
SELECT 
    pg_database_size(current_database()) as total_size,
    pg_size_pretty(pg_database_size(current_database())) as pretty_size;

-- Query performance monitoring
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    stddev_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 10;

-- User activity analytics
CREATE OR REPLACE VIEW user_analytics AS
SELECT 
    u.id,
    u.email,
    u.created_at,
    COUNT(ar.id) as total_assessments,
    MAX(ar.completed_at) as last_assessment,
    AVG(ar.score) as avg_score
FROM users u
LEFT JOIN assessment_results ar ON u.id = ar.user_id
GROUP BY u.id, u.email, u.created_at;

-- Grant permissions to monitoring user
GRANT SELECT ON performance_metrics TO monitoring_user;
GRANT SELECT ON database_size TO monitoring_user;
GRANT SELECT ON slow_queries TO monitoring_user;
GRANT SELECT ON user_analytics TO monitoring_user;