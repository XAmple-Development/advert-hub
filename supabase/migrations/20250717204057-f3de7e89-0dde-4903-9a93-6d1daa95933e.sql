-- Fix foreign key constraints for content_flags
DO $$ 
BEGIN
    -- Drop existing constraints if they exist
    ALTER TABLE public.content_flags DROP CONSTRAINT IF EXISTS content_flags_reporter_id_fkey;
    ALTER TABLE public.content_flags DROP CONSTRAINT IF EXISTS content_flags_reviewed_by_fkey;
    ALTER TABLE public.moderation_actions DROP CONSTRAINT IF EXISTS moderation_actions_moderator_id_fkey;
    
    -- Add the new constraints
    ALTER TABLE public.content_flags 
    ADD CONSTRAINT content_flags_reporter_id_fkey 
    FOREIGN KEY (reporter_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

    ALTER TABLE public.content_flags 
    ADD CONSTRAINT content_flags_reviewed_by_fkey 
    FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

    ALTER TABLE public.moderation_actions 
    ADD CONSTRAINT moderation_actions_moderator_id_fkey 
    FOREIGN KEY (moderator_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
EXCEPTION 
    WHEN OTHERS THEN 
        -- Ignore if constraints already exist
        NULL;
END $$;