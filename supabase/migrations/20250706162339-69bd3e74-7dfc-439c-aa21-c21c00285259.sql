-- Add foreign key constraint between forum_topics and profiles
ALTER TABLE public.forum_topics 
ADD CONSTRAINT forum_topics_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;