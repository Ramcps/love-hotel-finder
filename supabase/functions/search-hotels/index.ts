import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

console.log('Edge function starting...')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Function invoked with method:', req.method)
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { location, radius = 5000, type = 'lodging' } = await req.json()
    console.log('Request params:', { location, radius, type })
    
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    console.log('API Key exists:', !!apiKey)
    
    if (!apiKey) {
      console.error('Google Places API key not found')
      throw new Error('Google Places API key not found')
    }

    // First, get coordinates for the location
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`
    console.log('Geocoding URL created')
    
    const geocodeResponse = await fetch(geocodeUrl)
    const geocodeData = await geocodeResponse.json()
    console.log('Geocode response status:', geocodeData.status)

    if (geocodeData.status !== 'OK' || !geocodeData.results.length) {
      console.error('Geocoding failed:', geocodeData.status)
      throw new Error('Location not found')
    }

    const { lat, lng } = geocodeData.results[0].geometry.location

    // Search for nearby hotels
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${apiKey}`
    const placesResponse = await fetch(placesUrl)
    const placesData = await placesResponse.json()

    if (placesData.status !== 'OK') {
      throw new Error('Failed to fetch places')
    }

    // Get detailed information for each hotel
    const hotels = await Promise.all(
      placesData.results.slice(0, 20).map(async (place: any) => {
        try {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,rating,formatted_address,formatted_phone_number,website,photos,price_level,reviews,types,opening_hours&key=${apiKey}`
          const detailsResponse = await fetch(detailsUrl)
          const detailsData = await detailsResponse.json()
          
          const details = detailsData.result
          
          // Get photo URL if available
          let photoUrl = null
          if (details.photos && details.photos.length > 0) {
            photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${details.photos[0].photo_reference}&key=${apiKey}`
          }

          // Calculate price range based on price_level
          let priceRange = '$50-100'
          if (details.price_level === 0) priceRange = '$25-50'
          else if (details.price_level === 1) priceRange = '$50-100'
          else if (details.price_level === 2) priceRange = '$100-200'
          else if (details.price_level === 3) priceRange = '$200-400'
          else if (details.price_level === 4) priceRange = '$400+'

          // Calculate distance from search center
          const distance = calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng)

          return {
            id: place.place_id,
            name: details.name || place.name,
            rating: details.rating || 0,
            address: details.formatted_address || place.vicinity,
            distance: `${distance.toFixed(1)} km`,
            priceRange,
            image: photoUrl || '/placeholder.svg',
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
            phone: details.formatted_phone_number || 'Not available',
            website: details.website || null,
            types: details.types || [],
            openingHours: details.opening_hours?.weekday_text || [],
            reviews: details.reviews?.slice(0, 3) || [],
            priceLevel: details.price_level || 1
          }
        } catch (error) {
          console.error('Error fetching place details:', error)
          return null
        }
      })
    )

    const validHotels = hotels.filter(hotel => hotel !== null)
    console.log('Found hotels:', validHotels.length)

    return new Response(
      JSON.stringify({ hotels: validHotels }),
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