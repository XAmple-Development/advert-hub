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
  console.log('🚀 AUTO-BUMP FUNCTION STARTED');
  console.log('⏰ Timestamp:', new Date().toISOString());
  
  if (req.method === "OPTIONS") {
    console.log('✅ OPTIONS request handled');
    return new Response(null, { headers: corsHeaders });
  }

  // Add detailed logging with timestamp
  console.log('=== AUTO-BUMP FUNCTION CALLED ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  
  try {
    const body = await req.text();
    console.log('Request body:', body);
  } catch (e) {
    console.log('Could not read request body:', e);
  }
  
  console.log('Environment check:');
  console.log('SUPABASE_URL:', Deno.env.get("SUPABASE_URL") ? 'SET' : 'NOT SET');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ? 'SET' : 'NOT SET');

  // Test basic functionality
  try {
    console.log('🔄 Testing basic response...');
    return new Response(JSON.stringify({
      success: true,
      message: 'Auto-bump function is reachable',
      timestamp: new Date().toISOString(),
      test: 'basic_connectivity'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('❌ Error in basic test:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Starting auto-bump process");

    // Get all users with auto-bump enabled and premium subscriptions
    logStep("Fetching auto-bump users");
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
      
      // Get user profile separately
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
      if (!['small', 'medium', 'premium'].includes(profile.subscription_tier)) {
        logStep(`User ${profile.id} does not have premium subscription (tier: ${profile.subscription_tier}), skipping`);
        continue;
      }
      
      // Check if subscription is still active
      if (profile.subscription_expires_at && new Date(profile.subscription_expires_at) < new Date()) {
        logStep(`User ${profile.id} subscription expired, skipping`);
        continue;
      }

      // Check if enough time has passed since last auto-bump
      const now = new Date();
      logStep(`Checking auto-bump timing for user ${profile.id}`);
      logStep(`Current time: ${now.toISOString()}`);
      logStep(`User interval: ${autoBumpUser.interval_hours} hours`);
      
      if (autoBumpUser.last_auto_bump_at) {
        const lastBump = new Date(autoBumpUser.last_auto_bump_at);
        const hoursSinceLastBump = (now.getTime() - lastBump.getTime()) / (1000 * 60 * 60);
        
        logStep(`Last auto-bump: ${lastBump.toISOString()}`);
        logStep(`Hours since last bump: ${hoursSinceLastBump.toFixed(2)}`);
        
        if (hoursSinceLastBump < autoBumpUser.interval_hours) {
          logStep(`User ${profile.id} last auto-bumped ${hoursSinceLastBump.toFixed(1)} hours ago, need to wait ${(autoBumpUser.interval_hours - hoursSinceLastBump).toFixed(1)} more hours`);
          continue;
        } else {
          logStep(`User ${profile.id} ready for auto-bump! ${hoursSinceLastBump.toFixed(1)} hours >= ${autoBumpUser.interval_hours} hours`);
        }
      } else {
        logStep(`User ${profile.id} has never been auto-bumped, proceeding with first auto-bump`);
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

          // Send Discord bump notification
          try {
            logStep(`Sending Discord notification for listing ${listing.id}`);
            const notificationResponse = await supabaseClient.functions.invoke('discord-bump-notification', {
              body: { 
                listingId: listing.id,
                bumpType: 'website'
              }
            });
            
            if (notificationResponse.error) {
              logStep(`Discord notification error for listing ${listing.id}`, notificationResponse.error);
            } else {
              logStep(`Discord notification sent successfully for listing ${listing.id}`);
            }
          } catch (notificationError) {
            logStep(`Failed to send Discord notification for listing ${listing.id}`, notificationError);
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