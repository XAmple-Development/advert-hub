-- Update RLS policy to allow admins to create events for any listing
DROP POLICY IF EXISTS "Users can create events for their listings" ON public.server_events;

CREATE POLICY "Users can create events for their listings or admins can create any events" 
ON public.server_events 
FOR INSERT 
WITH CHECK (
  -- Allow if user owns the listing OR user is admin OR no listing specified
  (listing_id IS NULL) OR
  (EXISTS (SELECT 1 FROM public.listings WHERE listings.id = server_events.listing_id AND listings.user_id = auth.uid())) OR
  (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
);

-- Also allow admins to create events without requiring organizer_id check
DROP POLICY IF EXISTS "Event organizers can update their events" ON public.server_events;

CREATE POLICY "Event organizers and admins can update events" 
ON public.server_events 
FOR UPDATE 
USING (
  (auth.uid() = organizer_id) OR
  (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
);