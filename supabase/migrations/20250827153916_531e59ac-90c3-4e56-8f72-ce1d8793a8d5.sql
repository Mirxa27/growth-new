-- Fix security_audit_log table structure
ALTER TABLE security_audit_log 
DROP COLUMN IF EXISTS resource_type,
DROP COLUMN IF EXISTS resource_id;

-- Add missing columns for proper audit logging
ALTER TABLE security_audit_log 
ADD COLUMN IF NOT EXISTS resource TEXT,
ADD COLUMN IF NOT EXISTS method TEXT,
ADD COLUMN IF NOT EXISTS status_code INTEGER DEFAULT 200;