-- Enable RLS on server_verification table
ALTER TABLE public.server_verification ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view server verification status (public information)
CREATE POLICY "Anyone can view server verification status" 
ON public.server_verification 
FOR SELECT 
USING (true);

-- Allow admins to manage server verification
CREATE POLICY "Admins can manage server verification" 
ON public.server_verification 
FOR ALL 
USING (get_user_role(auth.uid()) = true);