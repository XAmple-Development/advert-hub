-- Advanced Analytics & Insights
CREATE TABLE public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    country TEXT,
    city TEXT,
    device_type TEXT,
    browser TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ,
    page_views INTEGER DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    referrer TEXT,
    landing_page TEXT,
    exit_page TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.user_sessions(id) ON DELETE CASCADE,
    page_url TEXT NOT NULL,
    page_title TEXT,
    referrer TEXT,
    time_on_page INTEGER DEFAULT 0,
    scroll_depth INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'click', 'hover', 'scroll', 'search', 'filter'
    target_element TEXT,
    page_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Gamification & Social
CREATE TABLE public.user_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    total_points_earned INTEGER DEFAULT 0,
    level_up_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    category TEXT, -- 'social', 'listings', 'reviews', 'activity'
    points_reward INTEGER DEFAULT 0,
    rarity TEXT DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
    conditions JSONB NOT NULL, -- {type: 'listings_created', count: 5}
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    progress JSONB DEFAULT '{}',
    UNIQUE(user_id, achievement_id)
);

CREATE TABLE public.leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'experience', 'listings', 'reviews', 'followers'
    score INTEGER NOT NULL,
    rank INTEGER,
    period TEXT NOT NULL DEFAULT 'all_time', -- 'daily', 'weekly', 'monthly', 'all_time'
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, category, period)
);

CREATE TABLE public.user_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES public.user_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.user_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, comment_id)
);

-- Management & Moderation Tools
CREATE TABLE public.moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moderator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL, -- 'listing', 'user', 'comment', 'review'
    target_id UUID NOT NULL,
    action_type TEXT NOT NULL, -- 'approve', 'reject', 'ban', 'warn', 'delete', 'feature'
    reason TEXT,
    metadata JSONB DEFAULT '{}',
    auto_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.content_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL,
    target_id UUID NOT NULL,
    flag_type TEXT NOT NULL, -- 'spam', 'inappropriate', 'copyright', 'fake', 'other'
    reason TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'dismissed', 'action_taken'
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_warnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    moderator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    severity TEXT DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Advanced Features
CREATE TABLE public.server_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    organizer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT, -- 'gaming', 'community', 'contest', 'announcement'
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern JSONB,
    status TEXT DEFAULT 'upcoming', -- 'upcoming', 'live', 'ended', 'cancelled'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.event_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.server_events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'registered', -- 'registered', 'attended', 'no_show'
    registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(event_id, user_id)
);

CREATE TABLE public.server_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    stat_date DATE NOT NULL,
    member_count INTEGER,
    online_count INTEGER,
    message_count INTEGER,
    voice_minutes INTEGER,
    new_members INTEGER,
    left_members INTEGER,
    channels_count INTEGER,
    roles_count INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(listing_id, stat_date)
);

-- Real-time Features
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'bump', 'review', 'follow', 'achievement', 'message', 'event'
    title TEXT NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'direct', -- 'direct', 'system', 'broadcast'
    is_read BOOLEAN DEFAULT false,
    thread_id UUID,
    replied_to UUID REFERENCES public.user_messages(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.live_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'viewing', 'listing_created', 'review_posted', 'server_joined'
    target_id UUID,
    target_type TEXT, -- 'listing', 'user', 'review'
    metadata JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enhanced Discord Bot
CREATE TABLE public.bot_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    command_name TEXT NOT NULL UNIQUE,
    description TEXT,
    usage_example TEXT,
    category TEXT, -- 'listings', 'moderation', 'fun', 'utility'
    permissions_required TEXT[], -- Discord permissions
    is_enabled BOOLEAN DEFAULT true,
    cooldown_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.bot_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    command_name TEXT NOT NULL,
    user_discord_id TEXT NOT NULL,
    guild_id TEXT,
    channel_id TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    response_time_ms INTEGER,
    used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.auto_moderation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL, -- 'spam_detection', 'profanity_filter', 'link_validation'
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL, -- {type: 'delete', notify_mods: true}
    is_enabled BOOLEAN DEFAULT true,
    severity INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_started_at ON public.user_sessions(started_at DESC);
CREATE INDEX idx_page_views_user_id ON public.page_views(user_id);
CREATE INDEX idx_page_views_viewed_at ON public.page_views(viewed_at DESC);
CREATE INDEX idx_user_actions_user_id ON public.user_actions(user_id);
CREATE INDEX idx_user_actions_action_type ON public.user_actions(action_type);
CREATE INDEX idx_user_levels_experience_points ON public.user_levels(experience_points DESC);
CREATE INDEX idx_leaderboards_category_score ON public.leaderboards(category, score DESC);
CREATE INDEX idx_notifications_user_id_unread ON public.notifications(user_id, is_read);
CREATE INDEX idx_live_activity_created_at ON public.live_activity(created_at DESC);
CREATE INDEX idx_server_events_start_time ON public.server_events(start_time);
CREATE INDEX idx_bot_usage_stats_command_used_at ON public.bot_usage_stats(command_name, used_at DESC);