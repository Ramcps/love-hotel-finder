import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

console.log('🧪 Test connection edge function starting...')

serve(async (req) => {
  console.log('🚀 Test function invoked with method:', req.method)
  
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const locationIqKey = Deno.env.get('LOCATIONIQ_API_KEY')
    
    const result = {
      status: 'success',
      message: 'Edge function is working!',
      timestamp: new Date().toISOString(),
      hasLocationIqKey: !!locationIqKey,
      environment: Deno.env.get('DENO_DEPLOYMENT_ID') ? 'production' : 'local'
    }

    console.log('✅ Test result:', result)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('❌ Error in test function:', error)
    return new Response(
      JSON.stringify({ 
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})