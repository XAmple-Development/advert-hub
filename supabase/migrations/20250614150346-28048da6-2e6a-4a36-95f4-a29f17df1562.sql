
-- First, let's check if the trigger exists and recreate it to ensure it's working
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the handle_new_user function to properly extract Discord user data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username, 
    discord_username,
    discord_id,
    discord_avatar
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'provider_id',
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture')
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    discord_username = EXCLUDED.discord_username,
    discord_id = EXCLUDED.discord_id,
    discord_avatar = EXCLUDED.discord_avatar,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to ensure it's active
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also manually insert/update the current user's profile data if they exist
INSERT INTO public.profiles (
  id,
  username,
  discord_username, 
  discord_id,
  discord_avatar
)
SELECT 
  id,
  COALESCE(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name', email),
  COALESCE(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name'),
  raw_user_meta_data ->> 'provider_id',
  COALESCE(raw_user_meta_data ->> 'avatar_url', raw_user_meta_data ->> 'picture')
FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  discord_username = EXCLUDED.discord_username,
  discord_id = EXCLUDED.discord_id,
  discord_avatar = EXCLUDED.discord_avatar,
  updated_at = now();
