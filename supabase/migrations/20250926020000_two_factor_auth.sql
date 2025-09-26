-- Add two-factor authentication fields to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_method VARCHAR(20),
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
ADD COLUMN IF NOT EXISTS backup_codes TEXT[],
ADD COLUMN IF NOT EXISTS two_factor_backup_codes_used TEXT[],
ADD COLUMN IF NOT EXISTS two_factor_last_used TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS two_factor_enabled_at TIMESTAMP WITH TIME ZONE;

-- Create user_2fa_setup table for temporary 2FA setup data
CREATE TABLE IF NOT EXISTS user_2fa_setup (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    totp_secret TEXT NOT NULL,
    backup_codes TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_2fa_setup_user_id ON user_2fa_setup(user_id);
CREATE INDEX IF NOT EXISTS idx_user_2fa_setup_expires_at ON user_2fa_setup(expires_at);

-- Add RLS policies
ALTER TABLE user_2fa_setup ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own 2FA setup data
CREATE POLICY "Users can access own 2FA setup" ON user_2fa_setup
    FOR ALL USING (auth.uid() = user_id);

-- Policy: Anonymous users cannot access 2FA setup data
CREATE POLICY "Anonymous users cannot access 2FA setup" ON user_2fa_setup
    FOR ALL TO ANONYMOUS USING (false);

-- Create function to clean up expired 2FA setup data
CREATE OR REPLACE FUNCTION cleanup_expired_2fa_setup()
RETURNS void AS $$
BEGIN
    DELETE FROM user_2fa_setup
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to revoke all user sessions (placeholder for future implementation)
CREATE OR REPLACE FUNCTION revoke_all_user_sessions(p_user_id UUID)
RETURNS boolean AS $$
BEGIN
    -- This is a placeholder function. In a real implementation,
    -- you would use Supabase auth.admin to revoke sessions
    -- or implement a custom session management system
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;