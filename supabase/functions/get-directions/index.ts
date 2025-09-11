import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

console.log('🧭 Get directions edge function starting...')

import { corsHeaders, handleCors } from '../_shared/cors.ts'

serve(async (req) => {
  console.log('🚀 Directions function invoked with method:', req.method)
  console.log('📡 Request URL:', req.url)
  
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    let requestBody;
    try {
      requestBody = await req.json()
    } catch (parseError) {
      console.error('❌ JSON parsing error in directions:', parseError)
      throw new Error('Invalid JSON in request body')
    }
    
    const { origin, destination, hotel_name } = requestBody
    
    console.log('🧭 Directions request params:', { origin, destination, hotel_name })
    
    // Validate coordinates
    if (!origin || !destination || 
        typeof origin.lat !== 'number' || typeof origin.lng !== 'number' ||
        typeof destination.lat !== 'number' || typeof destination.lng !== 'number') {
      throw new Error('Valid origin and destination coordinates (lat, lng) are required')
    }
    
    const locationIqKey = Deno.env.get('LOCATIONIQ_API_KEY')
    console.log('🔑 LocationIQ API Key exists:', !!locationIqKey)
    
    if (!locationIqKey) {
      console.error('❌ LocationIQ API key not found in environment')
      throw new Error('LocationIQ API key not configured')
    }

    // Use LocationIQ directions API with timeout and error handling
    const directionsUrl = `https://eu1.locationiq.com/v1/directions/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?key=${locationIqKey}&steps=true&geometries=polyline&overview=full&alternatives=false`
    
    console.log('🗺️ Getting optimized directions from LocationIQ')
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 12000) // 12 second timeout for directions
    
    let directionsData;
    try {
      const directionsResponse = await fetch(directionsUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Supabase Edge Function v1.0'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!directionsResponse.ok) {
        const errorText = await directionsResponse.text()
        console.error('❌ LocationIQ directions error:', errorText)
        throw new Error(`LocationIQ directions failed: ${directionsResponse.status} - ${errorText}`)
      }
      
      directionsData = await directionsResponse.json()
      console.log('✅ LocationIQ directions response received successfully')
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        throw new Error('Directions request timed out')
      }
      throw fetchError
    }
    
    // Create multiple web-friendly directions URLs
    const osmUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${origin.lat}%2C${origin.lng}%3B${destination.lat}%2C${destination.lng}`
    const googleMapsUrl = `https://www.google.com/maps/dir/${origin.lat},${origin.lng}/${destination.lat},${destination.lng}/`
    
    // Extract comprehensive route information
    const route = directionsData.routes?.[0]
    const duration = route?.duration || 0
    const distance = route?.distance || 0
    const steps = route?.legs?.[0]?.steps || []
    
    // Calculate estimated fuel cost (rough estimate for Indian context)
    const fuelCostPer100km = 800 // Average ₹800 per 100km
    const estimatedFuelCost = Math.round((distance / 1000 / 100) * fuelCostPer100km)
    
    const result = {
      directions_url: osmUrl,
      google_maps_url: googleMapsUrl,
      route_info: {
        duration_minutes: Math.round(duration / 60),
        duration_text: `${Math.floor(duration / 3600)}h ${Math.round((duration % 3600) / 60)}m`,
        distance_km: Math.round(distance / 1000 * 10) / 10,
        distance_text: `${Math.round(distance / 1000 * 10) / 10} km`,
        estimated_fuel_cost: estimatedFuelCost,
        hotel_name,
        steps_count: steps.length
      },
      navigation_options: {
        osm_directions: osmUrl,
        google_maps: googleMapsUrl
      },
      raw_directions: directionsData,
      timestamp: new Date().toISOString()
    }

    console.log('✅ Returning enhanced directions result:', {
      duration: `${Math.round(duration / 60)}min`,
      distance: `${Math.round(distance / 1000 * 10) / 10}km`,
      hotel: hotel_name
    })

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=600' // Cache for 10 minutes
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