import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Customer portal using built-in Deno.serve with proper authentication
Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  console.log("Customer portal function called, method:", req.method);

  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting customer portal execution");
    
    // Check environment variables
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    console.log("Environment check:", { 
      hasStripeKey: !!stripeKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });
    
    if (!stripeKey) {
      console.log("No Stripe key found");
      return new Response(JSON.stringify({ 
        error: "STRIPE_SECRET_KEY not found"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Get user from authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("No authorization header");
      return new Response(JSON.stringify({ 
        error: "No authorization header provided"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user?.email) {
      console.log("User authentication failed:", userError);
      return new Response(JSON.stringify({ 
        error: "User not authenticated"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    console.log("User authenticated:", userData.user.email);

    // Find Stripe customer by email
    const customersResponse = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(userData.user.email)}`, {
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
      }
    });

    if (!customersResponse.ok) {
      console.log("Failed to fetch customers from Stripe");
      return new Response(JSON.stringify({ 
        error: "Failed to fetch customer from Stripe"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const customersData = await customersResponse.json();
    
    if (!customersData.data || customersData.data.length === 0) {
      console.log("No Stripe customer found for email:", userData.user.email);
      return new Response(JSON.stringify({ 
        error: "No Stripe customer found for this user"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const customerId = customersData.data[0].id;
    console.log("Found Stripe customer:", customerId);

    // Create portal session
    const origin = req.headers.get("origin") || req.headers.get("referer") || "https://2b712818-fe7b-4d50-8a53-c875975112ef.lovableproject.com";
    
    console.log("Making Stripe API call to create portal session...");
    
    const stripeResponse = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'customer': customerId,
        'return_url': origin
      })
    });

    const responseText = await stripeResponse.text();
    console.log("Stripe response:", { status: stripeResponse.status, hasText: !!responseText });
    
    if (!stripeResponse.ok) {
      console.log("Stripe API error:", responseText);
      return new Response(JSON.stringify({ 
        error: "Stripe API error",
        status: stripeResponse.status,
        details: responseText
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const sessionData = JSON.parse(responseText);
    console.log("SUCCESS: Stripe portal session created");
    
    return new Response(JSON.stringify({ 
      url: sessionData.url
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ 
      error: "Function error",
      details: error.message,
      stack: error.stack,
      name: error.name
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});