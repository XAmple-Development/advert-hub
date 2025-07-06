-- Create a trigger to store Discord access tokens when users sign in
CREATE OR REPLACE FUNCTION public.handle_discord_auth()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    discord_identity RECORD;
    access_token TEXT;
BEGIN
    -- Only process if this is a Discord authentication
    IF NEW.raw_user_meta_data->>'provider' = 'discord' OR 
       NEW.app_metadata->'providers' ? 'discord' THEN
        
        -- Try to get access token from various sources
        access_token := NEW.raw_user_meta_data->>'provider_token';
        
        -- Update profile with Discord access token
        UPDATE public.profiles
        SET 
            discord_access_token = access_token,
            discord_token_updated_at = now(),
            updated_at = now()
        WHERE id = NEW.id;
        
        -- If profile doesn't exist, the handle_new_user trigger will create it
        IF NOT FOUND THEN
            -- Insert will be handled by handle_new_user trigger
            NULL;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for auth updates (when tokens are refreshed)
DROP TRIGGER IF EXISTS on_auth_discord_token_update ON auth.users;
CREATE TRIGGER on_auth_discord_token_update
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
    EXECUTE FUNCTION public.handle_discord_auth();

-- Also create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_discord_token_insert ON auth.users;
CREATE TRIGGER on_auth_discord_token_insert
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_discord_auth();