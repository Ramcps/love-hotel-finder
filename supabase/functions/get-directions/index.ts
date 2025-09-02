import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

console.log('Get directions edge function starting...')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log('Function invoked with method:', req.method)
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    const { origin, destination, hotel_name } = requestBody
    
    console.log('Request params:', { origin, destination, hotel_name })
    
    if (!origin || !destination) {
      throw new Error('Origin and destination coordinates are required')
    }
    
    const locationIqKey = Deno.env.get('LOCATIONIQ_API_KEY')
    console.log('LocationIQ API Key exists:', !!locationIqKey)
    
    if (!locationIqKey) {
      console.error('LocationIQ API key not found')
      throw new Error('LocationIQ API key not found')
    }

    // Use LocationIQ directions API
    const directionsUrl = `https://eu1.locationiq.com/v1/directions/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?key=${locationIqKey}&steps=true&geometries=polyline&overview=full`
    
    console.log('Getting directions from LocationIQ')
    
    const directionsResponse = await fetch(directionsUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Supabase Edge Function'
      }
    })
    
    if (!directionsResponse.ok) {
      throw new Error(`LocationIQ directions failed: ${directionsResponse.status}`)
    }
    
    const directionsData = await directionsResponse.json()
    console.log('LocationIQ directions response received')
    
    // Create a web-friendly directions URL using OpenStreetMap
    const webDirectionsUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${origin.lat}%2C${origin.lng}%3B${destination.lat}%2C${destination.lng}`
    
    // Extract route information
    const route = directionsData.routes?.[0]
    const duration = route?.duration || 0
    const distance = route?.distance || 0
    
    const result = {
      directions_url: webDirectionsUrl,
      route_info: {
        duration: Math.round(duration / 60), // Convert to minutes
        distance: Math.round(distance / 1000 * 10) / 10, // Convert to km with 1 decimal
        hotel_name
      },
      raw_directions: directionsData
    }

    console.log('Returning directions result')

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
    console.error('Error in get-directions function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
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