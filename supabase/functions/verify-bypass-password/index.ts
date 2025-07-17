import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { password } = await req.json()

    if (!password) {
      return Response.json(
        { valid: false, error: 'Password is required' },
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get the bypass password from Supabase secrets
    const bypassPassword = Deno.env.get('ADMIN_BYPASS_PASSWORD')

    if (!bypassPassword) {
      console.error('ADMIN_BYPASS_PASSWORD not configured')
      return Response.json(
        { valid: false, error: 'Bypass password not configured' },
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Simple password comparison
    const isValid = password === bypassPassword

    return Response.json(
      { valid: isValid },
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error verifying bypass password:', error)
    return Response.json(
      { valid: false, error: 'Internal server error' },
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})