// Minimal test - no external dependencies
Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  console.log("Function called, method:", req.method);

  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting function execution");
    
    // Step 1: Test basic function execution
    const testResponse = {
      step: "basic_test",
      timestamp: new Date().toISOString(),
      success: true
    };
    
    console.log("Basic test successful");
    
    // Step 2: Test environment variable access
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    testResponse.hasStripeKey = !!stripeKey;
    testResponse.stripeKeyLength = stripeKey ? stripeKey.length : 0;
    
    console.log("Environment check:", { hasStripeKey: !!stripeKey, length: stripeKey ? stripeKey.length : 0 });
    
    if (!stripeKey) {
      console.log("No Stripe key found");
      return new Response(JSON.stringify({ 
        error: "STRIPE_SECRET_KEY not found",
        testResponse 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Step 3: Test basic fetch (to a simple endpoint first)
    console.log("Testing basic fetch...");
    const testFetch = await fetch('https://httpbin.org/get');
    const testFetchResult = await testFetch.text();
    console.log("Test fetch result:", { status: testFetch.status, hasResult: !!testFetchResult });
    
    testResponse.testFetch = {
      status: testFetch.status,
      success: testFetch.ok
    };

    // Step 4: If all above works, try Stripe API
    console.log("Attempting Stripe API call...");
    
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
        details: responseText,
        testResponse
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const sessionData = JSON.parse(responseText);
    console.log("SUCCESS: Stripe session created");
    
    return new Response(JSON.stringify({ 
      success: true,
      portalUrl: sessionData.url,
      testResponse
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