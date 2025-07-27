import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple in-memory rate limiting (for production, use Redis or database)
const attemptTracker = new Map<string, { attempts: number, lastAttempt: number }>()

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown'

    // Rate limiting: max 5 attempts per IP per 15 minutes
    const now = Date.now()
    const rateLimit = attemptTracker.get(clientIP) || { attempts: 0, lastAttempt: 0 }
    
    // Reset attempts if 15 minutes have passed
    if (now - rateLimit.lastAttempt > 15 * 60 * 1000) {
      rateLimit.attempts = 0
    }
    
    if (rateLimit.attempts >= 5) {
      return Response.json(
        { valid: false, error: 'Too many attempts. Please try again later.' },
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

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

    // Update rate limiting tracker
    rateLimit.attempts += 1
    rateLimit.lastAttempt = now
    attemptTracker.set(clientIP, rateLimit)

    // Log security events
    console.log(`Password verification attempt from IP ${clientIP}: ${isValid ? 'SUCCESS' : 'FAILED'}`)

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