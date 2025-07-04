-- Enable RLS on all new tables
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_moderation_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user data
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage sessions" ON public.user_sessions
FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Users can view their own page views" ON public.page_views
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage page views" ON public.page_views
FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Users can view their own actions" ON public.user_actions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own actions" ON public.user_actions
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Gamification policies
CREATE POLICY "Anyone can view user levels" ON public.user_levels
FOR SELECT USING (true);

CREATE POLICY "Users can view their own level details" ON public.user_levels
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage user levels" ON public.user_levels
FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Anyone can view achievements" ON public.achievements
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage achievements" ON public.achievements
FOR ALL USING (public.get_user_role(auth.uid()) = true);

CREATE POLICY "Users can view their own achievements" ON public.user_achievements
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public achievements" ON public.user_achievements
FOR SELECT USING (true);

CREATE POLICY "Service role can manage user achievements" ON public.user_achievements
FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Anyone can view leaderboards" ON public.leaderboards
FOR SELECT USING (true);

-- Social features policies
CREATE POLICY "Anyone can view comments" ON public.user_comments
FOR SELECT USING (is_deleted = false);

CREATE POLICY "Users can create comments" ON public.user_comments
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.user_comments
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own comment likes" ON public.comment_likes
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view comment likes" ON public.comment_likes
FOR SELECT USING (true);

-- Moderation policies
CREATE POLICY "Admins can view all moderation actions" ON public.moderation_actions
FOR SELECT USING (public.get_user_role(auth.uid()) = true);

CREATE POLICY "Admins can create moderation actions" ON public.moderation_actions
FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = true);

CREATE POLICY "Anyone can create content flags" ON public.content_flags
FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own flags" ON public.content_flags
FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all flags" ON public.content_flags
FOR SELECT USING (public.get_user_role(auth.uid()) = true);

CREATE POLICY "Admins can update flags" ON public.content_flags
FOR UPDATE USING (public.get_user_role(auth.uid()) = true);

CREATE POLICY "Users can view their own warnings" ON public.user_warnings
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage warnings" ON public.user_warnings
FOR ALL USING (public.get_user_role(auth.uid()) = true);

-- Events policies
CREATE POLICY "Anyone can view public events" ON public.server_events
FOR SELECT USING (true);

CREATE POLICY "Users can create events for their listings" ON public.server_events
FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.listings 
    WHERE id = listing_id AND user_id = auth.uid()
));

CREATE POLICY "Event organizers can update their events" ON public.server_events
FOR UPDATE USING (auth.uid() = organizer_id);

CREATE POLICY "Anyone can view event participants" ON public.event_participants
FOR SELECT USING (true);

CREATE POLICY "Users can register for events" ON public.event_participants
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their event participation" ON public.event_participants
FOR ALL USING (auth.uid() = user_id);

-- Statistics policies
CREATE POLICY "Listing owners can view their statistics" ON public.server_statistics
FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.listings 
    WHERE id = listing_id AND user_id = auth.uid()
));

CREATE POLICY "Service role can manage statistics" ON public.server_statistics
FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Real-time features policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can create notifications" ON public.notifications
FOR INSERT WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Users can view their messages" ON public.user_messages
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" ON public.user_messages
FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Anyone can view public activity" ON public.live_activity
FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create their own activity" ON public.live_activity
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Bot commands policies
CREATE POLICY "Anyone can view enabled bot commands" ON public.bot_commands
FOR SELECT USING (is_enabled = true);

CREATE POLICY "Admins can manage bot commands" ON public.bot_commands
FOR ALL USING (public.get_user_role(auth.uid()) = true);

CREATE POLICY "Service role can manage bot usage stats" ON public.bot_usage_stats
FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Admins can manage auto moderation rules" ON public.auto_moderation_rules
FOR ALL USING (public.get_user_role(auth.uid()) = true);