import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

console.log('🏨 Search hotels edge function starting...')

serve(async (req) => {
  console.log('🚀 Function invoked with method:', req.method)
  console.log('📡 Request URL:', req.url)
  
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    let requestBody;
    try {
      requestBody = await req.json()
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError)
      throw new Error('Invalid JSON in request body')
    }
    
    const { location, radius = 5000 } = requestBody
    console.log('Request params:', { location, radius })
    
    if (!location) {
      throw new Error('Location parameter is required')
    }
    
    const locationIqKey = Deno.env.get('LOCATIONIQ_API_KEY')
    console.log('🔑 LocationIQ API Key exists:', !!locationIqKey)
    console.log('🌍 Environment:', Deno.env.get('DENO_DEPLOYMENT_ID') ? 'production' : 'local')
    
    if (!locationIqKey) {
      console.error('LocationIQ API key not found')
      throw new Error('LocationIQ API key not found')
    }

    // First, get coordinates for the location using LocationIQ
    const geocodeUrl = `https://eu1.locationiq.com/v1/search.php?key=${locationIqKey}&q=${encodeURIComponent(location)}&format=json&limit=1`
    console.log('Geocoding with LocationIQ:', geocodeUrl.replace(locationIqKey, '***'))
    
    let geocodeResponse, geocodeData;
    try {
      geocodeResponse = await fetch(geocodeUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Supabase Edge Function'
        }
      })
      
      if (!geocodeResponse.ok) {
        throw new Error(`LocationIQ geocoding failed: ${geocodeResponse.status} ${geocodeResponse.statusText}`)
      }
      
      geocodeData = await geocodeResponse.json()
      console.log('LocationIQ geocode response:', geocodeData?.length || 0)
    } catch (fetchError) {
      console.error('Geocoding fetch error:', fetchError)
      throw new Error(`Failed to geocode location: ${fetchError.message}`)
    }

    if (!geocodeData || geocodeData.length === 0) {
      console.error('Geocoding failed: No results')
      throw new Error('Location not found')
    }

    const { lat, lon: lng } = geocodeData[0]
    console.log('Coordinates found:', { lat, lng })

    // Search for nearby hotels using LocationIQ Nearby API
    const nearbyUrl = `https://eu1.locationiq.com/v1/nearby.php?key=${locationIqKey}&lat=${lat}&lon=${lng}&tag=tourism.hotel,tourism.motel,tourism.guest_house&radius=${radius}&format=json&limit=20`
    const nearbyResponse = await fetch(nearbyUrl)
    const nearbyData = await nearbyResponse.json()

    console.log('Nearby search results:', nearbyData.length || 0)

    // Generate mock hotels since LocationIQ nearby API has limited hotel data
    const mockHotels = [
      "Grand Palace Hotel", "City Center Inn", "Luxury Suites", "Business Hotel", 
      "Boutique Resort", "Heritage Hotel", "Royal Gardens", "Metro Hotel", 
      "Premium Stay", "Comfort Lodge", "Ocean View Resort", "Mountain Lodge"
    ].slice(0, 8).map((name, index) => {
      // Calculate distance from search center
      const hotelLat = parseFloat(lat) + (Math.random() - 0.5) * 0.02
      const hotelLng = parseFloat(lng) + (Math.random() - 0.5) * 0.02
      const distance = calculateDistance(parseFloat(lat), parseFloat(lng), hotelLat, hotelLng)

      return {
        id: `hotel_${index + 1}`,
        name,
        rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        address: `${Math.floor(Math.random() * 999) + 1} ${location.split(',')[0]} Street, ${location}`,
        distance: `${distance.toFixed(1)} km`,
        priceRange: ["₹2,000-3,000", "₹3,000-5,000", "₹5,000-8,000", "₹1,500-2,500", "₹8,000-12,000"][Math.floor(Math.random() * 5)],
        image: `https://images.unsplash.com/photo-${[
          '1566073771259-6a8506099945', '1582719478250-c4b3b6e2636', '1564501049412-61c2332789a3',
          '1571003123894-1f0594d2b5d9', '1542314831-068cd1dbfeeb', '1590490360182-c33d57733427'
        ][index % 6]}?w=400&h=300&fit=crop`,
        lat: hotelLat,
        lng: hotelLng,
        phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        website: `www.${name.toLowerCase().replace(/\s+/g, '')}.com`,
        types: ['lodging', 'establishment'],
        openingHours: ['Monday: 24 hours', 'Tuesday: 24 hours', 'Wednesday: 24 hours', 'Thursday: 24 hours', 'Friday: 24 hours', 'Saturday: 24 hours', 'Sunday: 24 hours'],
        reviews: [
          { author_name: 'John D.', text: 'Great service and location!', rating: 5 },
          { author_name: 'Sarah M.', text: 'Clean rooms and friendly staff.', rating: 4 }
        ],
        priceLevel: Math.floor(Math.random() * 4) + 1
      }
    })

    console.log('✅ Generated mock hotels:', mockHotels.length)

    const result = { 
      hotels: mockHotels,
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      searchRadius: radius,
      timestamp: new Date().toISOString()
    }

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
    console.error('Error in edge function:', error)
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

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}