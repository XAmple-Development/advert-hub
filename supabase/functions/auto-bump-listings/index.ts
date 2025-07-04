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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Starting auto-bump process");

    // Get all users with auto-bump enabled and premium subscriptions
    const { data: autoBumpUsers, error: usersError } = await supabaseClient
      .from('auto_bump_settings')
      .select(`
        *,
        profiles!inner(
          id,
          subscription_tier,
          subscription_expires_at
        )
      `)
      .eq('enabled', true)
      .in('profiles.subscription_tier', ['small', 'medium', 'premium']);

    if (usersError) {
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
      const profile = autoBumpUser.profiles;
      
      // Check if subscription is still active
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
          logStep(`User ${profile.id} last auto-bumped ${hoursSinceLastBump.toFixed(1)} hours ago, skipping`);
          continue;
        }
      }

      // Get all active listings for this user
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
          // Update listing bump count and timestamp
          const { error: listingUpdateError } = await supabaseClient
            .from('listings')
            .update({
              last_bumped_at: now.toISOString(),
              bump_count: (await supabaseClient.from('listings').select('bump_count').eq('id', listing.id).single()).data?.bump_count || 0 + 1,
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

          // Update listing analytics
          const { error: analyticsError } = await supabaseClient
            .rpc('update_listing_analytics', {
              p_listing_id: listing.id,
              p_event_type: 'bump',
              p_metadata: { auto_bump: true }
            });

          if (analyticsError) {
            logStep(`Error updating analytics for listing ${listing.id}`, analyticsError.message);
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