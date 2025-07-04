-- Add auto-bump settings to profiles table
ALTER TABLE public.profiles 
ADD COLUMN auto_bump_enabled BOOLEAN DEFAULT false,
ADD COLUMN auto_bump_interval_hours INTEGER DEFAULT 6;

-- Create auto-bump settings table for more granular control
CREATE TABLE public.auto_bump_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  interval_hours INTEGER DEFAULT 6,
  last_auto_bump_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.auto_bump_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for auto_bump_settings
CREATE POLICY "Users can manage their own auto-bump settings"
ON public.auto_bump_settings
FOR ALL
USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_auto_bump_settings_updated_at
  BEFORE UPDATE ON public.auto_bump_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();