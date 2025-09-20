-- PayPal Configuration Tables
-- Migration: Create PayPal payment settings and related tables

-- Admin Payment Settings (for PayPal configuration)
CREATE TABLE IF NOT EXISTS public.admin_payment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) UNIQUE NOT NULL, -- 'paypal', 'stripe', etc.
    configuration JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- PayPal Plans
CREATE TABLE IF NOT EXISTS public.paypal_plans (
    id VARCHAR(255) PRIMARY KEY, -- PayPal Plan ID
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'CREATED',
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    interval VARCHAR(20) NOT NULL, -- DAY, WEEK, MONTH, YEAR
    interval_count INTEGER DEFAULT 1,
    product_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- PayPal Subscriptions
CREATE TABLE IF NOT EXISTS public.paypal_subscriptions (
    id VARCHAR(255) PRIMARY KEY, -- PayPal Subscription ID
    plan_id VARCHAR(255) REFERENCES public.paypal_plans(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    subscriber_email VARCHAR(255) NOT NULL,
    subscriber_name JSONB,
    start_time TIMESTAMP WITH TIME ZONE,
    next_billing_time TIMESTAMP WITH TIME ZONE,
    last_payment JSONB,
    billing_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PayPal Webhook Events Log
CREATE TABLE IF NOT EXISTS public.paypal_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(255) NOT NULL,
    resource_type VARCHAR(255),
    resource_id VARCHAR(255),
    event_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_payment_settings_provider ON public.admin_payment_settings(provider);
CREATE INDEX IF NOT EXISTS idx_paypal_plans_status ON public.paypal_plans(status);
CREATE INDEX IF NOT EXISTS idx_paypal_subscriptions_user ON public.paypal_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_paypal_subscriptions_status ON public.paypal_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_paypal_webhook_events_type ON public.paypal_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_paypal_webhook_events_processed ON public.paypal_webhook_events(processed);

-- Enable Row Level Security
ALTER TABLE public.admin_payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paypal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paypal_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paypal_webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Admin Payment Settings (Admin only)
CREATE POLICY "Admins can manage payment settings" ON public.admin_payment_settings
    FOR ALL USING (public.check_admin_access());

-- PayPal Plans (Admin only)
CREATE POLICY "Admins can manage PayPal plans" ON public.paypal_plans
    FOR ALL USING (public.check_admin_access());

-- PayPal Subscriptions (Users can view their own, admins can view all)
CREATE POLICY "Users can view own subscriptions" ON public.paypal_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions" ON public.paypal_subscriptions
    FOR ALL USING (public.check_admin_access());

-- PayPal Webhook Events (Admin only)
CREATE POLICY "Admins can manage webhook events" ON public.paypal_webhook_events
    FOR ALL USING (public.check_admin_access());

-- Update triggers
CREATE TRIGGER update_admin_payment_settings_updated_at
    BEFORE UPDATE ON public.admin_payment_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_paypal_plans_updated_at
    BEFORE UPDATE ON public.paypal_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_paypal_subscriptions_updated_at
    BEFORE UPDATE ON public.paypal_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Stored procedures for PayPal operations

-- Function to get active PayPal configuration
CREATE OR REPLACE FUNCTION get_paypal_config()
RETURNS TABLE(
    client_id TEXT,
    client_secret TEXT,
    mode TEXT,
    webhook_id TEXT,
    currency TEXT,
    business_name TEXT,
    return_url TEXT,
    cancel_url TEXT,
    is_active BOOLEAN
) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (configuration->>'client_id')::TEXT,
        (configuration->>'client_secret')::TEXT,
        (configuration->>'mode')::TEXT,
        (configuration->>'webhook_id')::TEXT,
        (configuration->>'currency')::TEXT,
        (configuration->>'business_name')::TEXT,
        (configuration->>'return_url')::TEXT,
        (configuration->>'cancel_url')::TEXT,
        aps.is_active
    FROM admin_payment_settings aps
    WHERE provider = 'paypal' AND is_active = true
    LIMIT 1;
END;
$$;

-- Function to log webhook events
CREATE OR REPLACE FUNCTION log_paypal_webhook(
    p_event_type TEXT,
    p_resource_type TEXT,
    p_resource_id TEXT,
    p_event_data JSONB
)
RETURNS UUID
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO paypal_webhook_events (event_type, resource_type, resource_id, event_data)
    VALUES (p_event_type, p_resource_type, p_resource_id, p_event_data)
    RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$;

-- Function to update subscription status
CREATE OR REPLACE FUNCTION update_paypal_subscription_status(
    p_subscription_id TEXT,
    p_status TEXT,
    p_billing_info JSONB DEFAULT NULL
)
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE paypal_subscriptions 
    SET 
        status = p_status,
        billing_info = COALESCE(p_billing_info, billing_info),
        updated_at = NOW()
    WHERE id = p_subscription_id;
    
    RETURN FOUND;
END;
$$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_payment_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.paypal_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.paypal_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.paypal_webhook_events TO authenticated;

GRANT EXECUTE ON FUNCTION get_paypal_config() TO authenticated;
GRANT EXECUTE ON FUNCTION log_paypal_webhook(TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION update_paypal_subscription_status(TEXT, TEXT, JSONB) TO authenticated;

-- Insert default PayPal configuration placeholder
INSERT INTO public.admin_payment_settings (provider, configuration, is_active)
VALUES (
    'paypal',
    '{
        "client_id": "",
        "client_secret": "",
        "mode": "sandbox",
        "webhook_id": "",
        "currency": "USD",
        "business_name": "",
        "return_url": "",
        "cancel_url": ""
    }'::jsonb,
    false
)
ON CONFLICT (provider) DO NOTHING;