-- Create site_maintenance table for controlling maintenance mode
CREATE TABLE public.site_maintenance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  maintenance_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_maintenance ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage maintenance mode" 
ON public.site_maintenance 
FOR ALL 
USING (get_user_role(auth.uid()) = true);

CREATE POLICY "Anyone can view maintenance status" 
ON public.site_maintenance 
FOR SELECT 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_site_maintenance_updated_at
BEFORE UPDATE ON public.site_maintenance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial record
INSERT INTO public.site_maintenance (is_maintenance_mode, maintenance_message)
VALUES (false, 'System maintenance in progress. Please check back soon!');