-- Add PayPal support to subscriptions table
ALTER TABLE public.subscriptions 
  ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'stripe' CHECK (payment_provider IN ('stripe', 'paypal'));

-- Create index for PayPal subscription ID
CREATE INDEX IF NOT EXISTS idx_subscriptions_paypal_id ON public.subscriptions(paypal_subscription_id);

-- Add PayPal fields to payments table
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS paypal_order_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS paypal_capture_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'stripe' CHECK (payment_provider IN ('stripe', 'paypal'));

-- Create index for PayPal order ID
CREATE INDEX IF NOT EXISTS idx_payments_paypal_order_id ON public.payments(paypal_order_id);

-- Create PayPal webhook events table
CREATE TABLE IF NOT EXISTS public.paypal_webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  summary TEXT,
  resource JSONB NOT NULL,
  links JSONB,
  event_version TEXT,
  create_time TIMESTAMPTZ,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  error TEXT
);

-- Enable RLS
ALTER TABLE public.paypal_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access webhook events
CREATE POLICY "Service role can manage webhook events" ON public.paypal_webhook_events
  FOR ALL USING (auth.role() = 'service_role');

-- Create PayPal products table
CREATE TABLE IF NOT EXISTS public.paypal_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paypal_product_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'SERVICE',
  category TEXT,
  image_url TEXT,
  home_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create PayPal plans table
CREATE TABLE IF NOT EXISTS public.paypal_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paypal_plan_id TEXT UNIQUE NOT NULL,
  paypal_product_id TEXT REFERENCES public.paypal_products(paypal_product_id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'ACTIVE',
  billing_cycles JSONB NOT NULL,
  payment_preferences JSONB,
  taxes JSONB,
  quantity_supported BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for PayPal tables
ALTER TABLE public.paypal_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paypal_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can view active products and plans
CREATE POLICY "Anyone can view active products" ON public.paypal_products
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view active plans" ON public.paypal_plans
  FOR SELECT USING (status = 'ACTIVE');

-- Only admins can manage products and plans
CREATE POLICY "Admins can manage products" ON public.paypal_products
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can manage plans" ON public.paypal_plans
  FOR ALL USING (public.is_admin());

-- Insert default PayPal products and plans
INSERT INTO public.paypal_products (paypal_product_id, name, description) VALUES
  ('PROD_BASIC', 'NewoMen Basic', 'Basic subscription plan with essential features'),
  ('PROD_PREMIUM', 'NewoMen Premium', 'Premium subscription plan with all features')
ON CONFLICT (paypal_product_id) DO NOTHING;

INSERT INTO public.paypal_plans (paypal_plan_id, paypal_product_id, name, description, billing_cycles, payment_preferences) VALUES
  ('PLAN_BASIC_MONTHLY', 'PROD_BASIC', 'Basic Monthly', 'Basic plan billed monthly', 
   '[{"frequency": {"interval_unit": "MONTH", "interval_count": 1}, "tenure_type": "REGULAR", "sequence": 1, "total_cycles": 0, "pricing_scheme": {"fixed_price": {"value": "9.99", "currency_code": "USD"}}}]'::jsonb,
   '{"auto_bill_outstanding": true, "payment_failure_threshold": 3}'::jsonb),
  
  ('PLAN_PREMIUM_MONTHLY', 'PROD_PREMIUM', 'Premium Monthly', 'Premium plan billed monthly',
   '[{"frequency": {"interval_unit": "MONTH", "interval_count": 1}, "tenure_type": "REGULAR", "sequence": 1, "total_cycles": 0, "pricing_scheme": {"fixed_price": {"value": "19.99", "currency_code": "USD"}}}]'::jsonb,
   '{"auto_bill_outstanding": true, "payment_failure_threshold": 3}'::jsonb),
  
  ('PLAN_PREMIUM_YEARLY', 'PROD_PREMIUM', 'Premium Yearly', 'Premium plan billed yearly with discount',
   '[{"frequency": {"interval_unit": "YEAR", "interval_count": 1}, "tenure_type": "REGULAR", "sequence": 1, "total_cycles": 0, "pricing_scheme": {"fixed_price": {"value": "199.99", "currency_code": "USD"}}}]'::jsonb,
   '{"auto_bill_outstanding": true, "payment_failure_threshold": 3}'::jsonb)
ON CONFLICT (paypal_plan_id) DO NOTHING;

-- Grant permissions
GRANT ALL ON public.paypal_webhook_events TO service_role;
GRANT SELECT ON public.paypal_products TO authenticated;
GRANT SELECT ON public.paypal_plans TO authenticated;