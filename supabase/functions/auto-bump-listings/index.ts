import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://cdn.skypack.dev/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AUTO-BUMP] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== AUTO-BUMP FUNCTION CALLED ===');
  console.log('Timestamp:', new Date().toISOString());

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Starting auto-bump process");

    // Get all users with auto-bump enabled
    const { data: autoBumpUsers, error: usersError } = await supabaseClient
      .from('auto_bump_settings')
      .select('*')
      .eq('enabled', true);

    if (usersError) {
      logStep("Error fetching auto-bump users", usersError);
      throw new Error(`Error fetching auto-bump users: ${usersError.message}`);
    }

    if (!autoBumpUsers || autoBumpUsers.length === 0) {
      logStep("No users with auto-bump enabled found");
      return new Response(JSON.stringify({ message: "No users to process" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep(`Found ${autoBumpUsers.length} users with auto-bump enabled`);

    let totalBumped = 0;

    for (const autoBumpUser of autoBumpUsers) {
      logStep(`Processing user ${autoBumpUser.user_id}`);
      
      // Get user profile
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('id, subscription_tier, subscription_expires_at')
        .eq('id', autoBumpUser.user_id)
        .single();

      if (profileError || !profile) {
        logStep(`Error fetching profile for user ${autoBumpUser.user_id}`, profileError);
        continue;
      }

      // Check if user has premium subscription
      if (!['gold', 'premium', 'platinum'].includes(profile.subscription_tier)) {
        logStep(`User ${profile.id} does not have premium subscription (tier: ${profile.subscription_tier}), skipping`);
        continue;
      }
      
      // Check if subscription is active
      if (profile.subscription_expires_at && new Date(profile.subscription_expires_at) < new Date()) {
        logStep(`User ${profile.id} subscription expired, skipping`);
        continue;
      }

      // Check if enough time has passed since last auto-bump
      const now = new Date();
      if (autoBumpUser.last_auto_bump_at) {
        const lastBump = new Date(autoBumpUser.last_auto_bump_at);
        const hoursSinceLastBump = (now.getTime() - lastBump.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastBump < autoBumpUser.interval_hours) {
          logStep(`User ${profile.id} last auto-bumped ${hoursSinceLastBump.toFixed(1)} hours ago, need to wait ${(autoBumpUser.interval_hours - hoursSinceLastBump).toFixed(1)} more hours`);
          continue;
        }
      }

      // Get active listings for this user
      const { data: listings, error: listingsError } = await supabaseClient
        .from('listings')
        .select('id, name, user_id')
        .eq('user_id', profile.id)
        .eq('status', 'active');

      if (listingsError) {
        logStep(`Error fetching listings for user ${profile.id}`, listingsError.message);
        continue;
      }

      if (!listings || listings.length === 0) {
        logStep(`No active listings found for user ${profile.id}`);
        continue;
      }

      logStep(`Processing ${listings.length} listings for user ${profile.id}`);

      // Bump each listing
      for (const listing of listings) {
        try {
          // Update listing
          const { data: currentListing } = await supabaseClient
            .from('listings')
            .select('bump_count')
            .eq('id', listing.id)
            .single();

          const { error: listingUpdateError } = await supabaseClient
            .from('listings')
            .update({
              last_bumped_at: now.toISOString(),
              bump_count: (currentListing?.bump_count || 0) + 1,
              updated_at: now.toISOString()
            })
            .eq('id', listing.id);

          if (listingUpdateError) {
            logStep(`Error updating listing ${listing.id}`, listingUpdateError.message);
            continue;
          }

          // Create bump record
          const { error: bumpError } = await supabaseClient
            .from('bumps')
            .insert({
              listing_id: listing.id,
              user_id: profile.id,
              bump_type: 'auto',
              bumped_at: now.toISOString()
            });

          if (bumpError) {
            logStep(`Error creating bump record for listing ${listing.id}`, bumpError.message);
            continue;
          }

          // Trigger Discord bump notification
          try {
            logStep(`Triggering Discord notification for listing: ${listing.name}`);
            const { error: notificationError } = await supabaseClient.functions.invoke('discord-bump-notification', {
              body: {
                listingId: listing.id,
                bumpType: 'auto'
              }
            });

            if (notificationError) {
              logStep(`Error sending Discord notification for listing ${listing.id}`, notificationError);
            } else {
              logStep(`Successfully sent Discord notification for listing: ${listing.name}`);
            }
          } catch (notificationError) {
            logStep(`Error triggering Discord notification for listing ${listing.id}`, notificationError);
          }

          totalBumped++;
          logStep(`Successfully auto-bumped listing: ${listing.name} (${listing.id})`);

        } catch (error) {
          logStep(`Error processing listing ${listing.id}`, error.message);
        }
      }

      // Update last auto-bump timestamp
      const { error: updateError } = await supabaseClient
        .from('auto_bump_settings')
        .update({
          last_auto_bump_at: now.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('user_id', profile.id);

      if (updateError) {
        logStep(`Error updating auto-bump timestamp for user ${profile.id}`, updateError.message);
      }
    }

    logStep(`Auto-bump process completed. Total listings bumped: ${totalBumped}`);

    return new Response(JSON.stringify({
      success: true,
      totalUsersBumped: autoBumpUsers.length,
      totalListingsBumped: totalBumped
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in auto-bump-listings", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
