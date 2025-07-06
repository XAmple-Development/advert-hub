-- Add foreign key constraint between subscribers and profiles tables
ALTER TABLE public.subscribers 
ADD CONSTRAINT subscribers_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;