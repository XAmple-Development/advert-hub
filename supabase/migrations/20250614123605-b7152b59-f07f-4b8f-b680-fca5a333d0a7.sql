
-- First, let's add RLS policies for the bumps table only (since it's missing them)
ALTER TABLE public.bumps ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert bumps for any listing
CREATE POLICY "Authenticated users can create bumps" 
  ON public.bumps 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to view all bumps (for counting/analytics)
CREATE POLICY "Anyone can view bumps" 
  ON public.bumps 
  FOR SELECT 
  TO public 
  USING (true);
