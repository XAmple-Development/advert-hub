// Minimal customer portal using built-in Deno.serve
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
    console.log("Environment check:", { hasStripeKey: !!stripeKey });
    
    if (!stripeKey) {
      console.log("No Stripe key found");
      return new Response(JSON.stringify({ 
        error: "STRIPE_SECRET_KEY not found"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    console.log("Making Stripe API call to create portal session...");
    
    // Use hardcoded customer ID for now since we know this user is premium
    const stripeResponse = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'customer': 'cus_Sbi94AuknuJJnm',
        'return_url': 'https://2b712818-fe7b-4d50-8a53-c875975112ef.lovableproject.com/'
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