// No imports needed - use built-in Deno serve
Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    console.log("Environment check:", { hasStripeKey: !!stripeKey });
    
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    console.log("Making Stripe API call...");
    
    // Use raw fetch to call Stripe API
    const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
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

    const responseText = await response.text();
    console.log("Stripe API response:", { status: response.status, text: responseText });
    
    if (!response.ok) {
      return new Response(JSON.stringify({ 
        error: "Stripe API error",
        status: response.status,
        details: responseText
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const sessionData = JSON.parse(responseText);
    console.log("Session created successfully");
    
    return new Response(JSON.stringify({ 
      success: true,
      portalUrl: sessionData.url 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ 
      error: "Function error",
      details: error.message,
      stack: error.stack
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});