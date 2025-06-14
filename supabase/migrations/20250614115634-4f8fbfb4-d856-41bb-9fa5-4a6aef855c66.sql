
-- Create enum types for better data consistency
CREATE TYPE listing_type AS ENUM ('server', 'bot');
CREATE TYPE subscription_tier AS ENUM ('free', 'premium');
CREATE TYPE listing_status AS ENUM ('active', 'pending', 'suspended');

-- User profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  discord_id TEXT UNIQUE,
  discord_username TEXT,
  discord_avatar TEXT,
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Server and bot listings table
CREATE TABLE public.listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type listing_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  discord_id TEXT NOT NULL,
  invite_url TEXT,
  website_url TEXT,
  support_server_url TEXT,
  tags TEXT[] DEFAULT '{}',
  member_count INTEGER DEFAULT 0,
  online_count INTEGER DEFAULT 0,
  boost_level INTEGER DEFAULT 0,
  verification_level TEXT,
  nsfw BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  status listing_status NOT NULL DEFAULT 'pending',
  avatar_url TEXT,
  banner_url TEXT,
  last_bumped_at TIMESTAMP WITH TIME ZONE,
  bump_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  join_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Categories for listings
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Junction table for listing categories (many-to-many)
CREATE TABLE public.listing_categories (
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (listing_id, category_id)
);

-- Bump history tracking
CREATE TABLE public.bumps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bumped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  bump_type TEXT DEFAULT 'manual'
);

-- Reviews/ratings for listings
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(listing_id, user_id)
);

-- Payment/subscription history
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier subscription_tier NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Bot servers that have our promotion bot
CREATE TABLE public.network_servers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discord_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  member_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert some default categories
INSERT INTO public.categories (name, description, icon, color) VALUES
('Gaming', 'Gaming communities and servers', '🎮', '#7289da'),
('Community', 'General community servers', '👥', '#43b581'),
('Music', 'Music and entertainment servers', '🎵', '#faa61a'),
('Education', 'Learning and educational content', '📚', '#f04747'),
('Technology', 'Tech, programming, and development', '💻', '#36393f'),
('Art & Design', 'Creative and artistic communities', '🎨', '#9266cc'),
('Anime & Manga', 'Anime and manga communities', '🎌', '#ff6b9d'),
('Sports', 'Sports and fitness communities', '⚽', '#00d4aa'),
('Trading & Finance', 'Trading, crypto, and finance', '💰', '#fed85d'),
('Roleplay', 'Roleplay and storytelling servers', '🎭', '#e91e63');

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bumps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_servers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for listings
CREATE POLICY "Anyone can view active listings" ON public.listings FOR SELECT USING (status = 'active' OR auth.uid() = user_id);
CREATE POLICY "Users can create their own listings" ON public.listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own listings" ON public.listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own listings" ON public.listings FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for categories (public read)
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);

-- RLS Policies for listing_categories
CREATE POLICY "Anyone can view listing categories" ON public.listing_categories FOR SELECT USING (true);
CREATE POLICY "Users can manage their listing categories" ON public.listing_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND user_id = auth.uid())
);

-- RLS Policies for bumps
CREATE POLICY "Users can view bumps for their listings" ON public.bumps FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create bumps for their listings" ON public.bumps FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND user_id = auth.uid())
);

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own subscriptions" ON public.subscriptions FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for network_servers (public read for stats)
CREATE POLICY "Anyone can view network servers" ON public.network_servers FOR SELECT USING (true);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, discord_username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', NEW.email),
    NEW.raw_user_meta_data ->> 'discord_username'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update listing bump count and timestamp
CREATE OR REPLACE FUNCTION public.update_listing_bump()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.listings 
  SET 
    last_bumped_at = NEW.bumped_at,
    bump_count = bump_count + 1,
    updated_at = now()
  WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update listing when bumped
CREATE TRIGGER on_bump_created
  AFTER INSERT ON public.bumps
  FOR EACH ROW EXECUTE FUNCTION public.update_listing_bump();

-- Create indexes for better performance
CREATE INDEX idx_listings_user_id ON public.listings(user_id);
CREATE INDEX idx_listings_type ON public.listings(type);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_last_bumped ON public.listings(last_bumped_at DESC);
CREATE INDEX idx_listings_created_at ON public.listings(created_at DESC);
CREATE INDEX idx_bumps_listing_id ON public.bumps(listing_id);
CREATE INDEX idx_bumps_user_id ON public.bumps(user_id);
CREATE INDEX idx_reviews_listing_id ON public.reviews(listing_id);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
