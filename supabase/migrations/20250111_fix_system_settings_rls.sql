-- Fix system_settings RLS policies to allow authenticated users to manage settings

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;

-- Create new policies that work properly
CREATE POLICY "Authenticated users can read system settings" 
ON public.system_settings 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert system settings" 
ON public.system_settings 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update system settings" 
ON public.system_settings 
FOR UPDATE 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete system settings" 
ON public.system_settings 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Alternative: If you want to make it more permissive for testing
-- DROP POLICY IF EXISTS "Anyone can read system settings" ON public.system_settings;
-- CREATE POLICY "Anyone can read system settings" ON public.system_settings
--     FOR SELECT USING (true);

-- DROP POLICY IF EXISTS "Authenticated users can manage system settings" ON public.system_settings;
-- CREATE POLICY "Authenticated users can manage system settings" ON public.system_settings
--     FOR ALL USING (auth.role() = 'authenticated');