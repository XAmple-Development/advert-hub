
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
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also manually insert the current user's profile data
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
