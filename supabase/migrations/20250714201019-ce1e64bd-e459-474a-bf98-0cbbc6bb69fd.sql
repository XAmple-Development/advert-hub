-- Create site_maintenance table for emergency maintenance mode
CREATE TABLE public.site_maintenance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_maintenance_mode boolean NOT NULL DEFAULT false,
  maintenance_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.site_maintenance ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view maintenance status" 
ON public.site_maintenance 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage maintenance status" 
ON public.site_maintenance 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_site_maintenance_updated_at
BEFORE UPDATE ON public.site_maintenance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();