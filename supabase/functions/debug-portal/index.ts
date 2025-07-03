import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Test 1: Check environment variables
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    const envTest = {
      hasStripeKey: !!stripeKey,
      stripeKeyPrefix: stripeKey ? stripeKey.substring(0, 7) : "MISSING",
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseServiceKey: !!supabaseServiceKey,
    };
    
    if (!stripeKey) {
      return new Response(JSON.stringify({ 
        error: "STRIPE_SECRET_KEY not found",
        envTest 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Test 2: Try to import and initialize Stripe
    let stripe;
    try {
      const StripeModule = await import("https://esm.sh/stripe@14.21.0");
      stripe = new StripeModule.default(stripeKey, { apiVersion: "2023-10-16" });
    } catch (stripeImportError) {
      return new Response(JSON.stringify({ 
        error: "Failed to import or initialize Stripe",
        details: stripeImportError.message,
        envTest 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Test 3: Try to retrieve your specific customer
    let customer;
    try {
      customer = await stripe.customers.retrieve("cus_Sbi94AuknuJJnm");
    } catch (customerError) {
      return new Response(JSON.stringify({ 
        error: "Failed to retrieve Stripe customer",
        details: customerError.message,
        envTest 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Test 4: Try to create portal session
    let portalSession;
    try {
      portalSession = await stripe.billingPortal.sessions.create({
        customer: "cus_Sbi94AuknuJJnm",
        return_url: "https://2b712818-fe7b-4d50-8a53-c875975112ef.lovableproject.com/",
      });
    } catch (portalError) {
      return new Response(JSON.stringify({ 
        error: "Failed to create portal session",
        details: portalError.message,
        customer: customer ? { id: customer.id, email: customer.email } : "no customer",
        envTest 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Success!
    return new Response(JSON.stringify({ 
      success: true,
      portalUrl: portalSession.url,
      customer: { id: customer.id, email: customer.email },
      envTest
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: "Unexpected error",
      details: error.message,
      stack: error.stack
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});