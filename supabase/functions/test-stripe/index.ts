import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Testing Stripe connection...");
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    
    console.log("Stripe key found, length:", stripeKey.length);
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Test by getting customer
    const customer = await stripe.customers.retrieve("cus_Sbi94AuknuJJnm");
    console.log("Customer retrieved:", customer.email);
    
    // Test portal session creation
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: "cus_Sbi94AuknuJJnm",
      return_url: "https://2b712818-fe7b-4d50-8a53-c875975112ef.lovableproject.com/",
    });
    
    console.log("Portal session created:", portalSession.id);
    
    return new Response(JSON.stringify({ 
      success: true, 
      customerId: customer.id,
      customerEmail: customer.email,
      portalUrl: portalSession.url
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Stripe test error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});