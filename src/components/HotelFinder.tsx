import { useState } from "react";
import { LocationInput } from "./LocationInput";
import { HotelCard } from "./HotelCard";
import { HotelDetails } from "./HotelDetails";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hotel, MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hotel-hero.jpg";

interface Location {
  lat: number;
  lng: number;
  address: string;
  country?: string;
}

interface HotelData {
  id: string;
  name: string;
  rating: number;
  address: string;
  distance: string;
  priceRange: string;
  image: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  types?: string[];
  openingHours?: string[];
  reviews?: any[];
  priceLevel?: number;
}

const generateMockHotels = (location: Location): HotelData[] => {
  const hotelNames = [
    "Grand Palace Hotel", "City Center Inn", "Luxury Suites", "Business Hotel", 
    "Boutique Resort", "Heritage Hotel", "Royal Gardens", "Metro Hotel"
  ];

  return hotelNames.map((name, index) => {
    const hotelLat = location.lat + (Math.random() - 0.5) * 0.02;
    const hotelLng = location.lng + (Math.random() - 0.5) * 0.02;
    const distance = calculateDistance(location.lat, location.lng, hotelLat, hotelLng);

    return {
      id: `mock_hotel_${index + 1}`,
      name,
      rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
      address: `${Math.floor(Math.random() * 999) + 1} ${location.address.split(',')[0]} Street`,
      distance: `${distance.toFixed(1)} km`,
      priceRange: ["₹2,000-3,000", "₹3,000-5,000", "₹5,000-8,000", "₹1,500-2,500"][Math.floor(Math.random() * 4)],
      image: `https://images.unsplash.com/photo-${[
        '1566073771259-6a8506099945', '1582719478250-c4b3b6e2636', '1564501049412-61c2332789a3',
        '1571003123894-1f0594d2b5d9', '1542314831-068cd1dbfeeb', '1590490360182-c33d57733427'
      ][index % 6]}?w=400&h=300&fit=crop`,
      lat: hotelLat,
      lng: hotelLng,
      phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      website: `www.${name.toLowerCase().replace(/\s+/g, '')}.com`,
      types: ['lodging', 'establishment'],
      openingHours: ['Open 24 hours'],
      reviews: [
        { author_name: 'John D.', text: 'Great service!', rating: 5 },
        { author_name: 'Sarah M.', text: 'Clean and comfortable.', rating: 4 }
      ],
      priceLevel: Math.floor(Math.random() * 4) + 1
    };
  });
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};


export const HotelFinder = () => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [hotels, setHotels] = useState<HotelData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<HotelData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();

  const testEdgeFunctionConnection = async () => {
    try {
      console.log('🧪 Testing edge function connection...');
      const { data, error } = await supabase.functions.invoke('test-connection');
      console.log('🧪 Test result:', { data, error });
      return { data, error };
    } catch (err) {
      console.error('🧪 Test connection failed:', err);
      return { data: null, error: err };
    }
  };

  const handleLocationSelect = async (location: Location) => {
    setCurrentLocation(location);
    setIsLoading(true);
    setHotels([]);

    try {
      console.log('🔍 Searching for hotels near:', location);
      
      // First test edge function connectivity
      const testResult = await testEdgeFunctionConnection();
      if (testResult.error) {
        console.warn('⚠️ Edge functions not deployed, using fallback');
        throw new Error('Edge functions not deployed');
      }
      
      console.log('🌐 Edge functions are live, fetching real data...');
      
      const { data, error } = await supabase.functions.invoke('search-hotels', {
        body: { 
          location: location.address,
          radius: 5000
        }
      });

      console.log('📡 Edge function response:', { data, error });
      console.log('📊 Response data type:', typeof data);
      console.log('❌ Response error details:', error);

      if (error) {
        console.error('🚨 Supabase edge function error:', error);
        throw error; // Let catch block handle fallback
      }

      if (data && data.hotels && data.hotels.length > 0) {
        setHotels(data.hotels);
        toast({
          title: "🎉 Real Hotels Found!",
          description: `Found ${data.hotels.length} real hotels near ${location.address} using LocationIQ`,
        });
        console.log('✅ Successfully loaded real hotel data');
      } else {
        console.warn('⚠️ No hotels in response data:', data);
        throw new Error('No hotels found in response');
      }
    } catch (error) {
      console.error('🚨 Error fetching hotels:', error);
      
      // Fallback to mock data
      console.log('📋 Using fallback mock data');
      const mockHotels = generateMockHotels(location);
      setHotels(mockHotels);
      
      const isDeploymentIssue = error.message?.includes('not deployed') || error.message?.includes('FunctionsRelayError');
      
      toast({
        title: isDeploymentIssue ? "📡 Deploy Edge Functions" : "🔄 Using Sample Data",
        description: isDeploymentIssue 
          ? `Edge functions need deployment. Run: supabase functions deploy search-hotels`
          : `Showing ${mockHotels.length} sample hotels near ${location.address}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };


  const handleGetDirections = async (hotel: HotelData) => {
    if (!currentLocation) {
      toast({
        title: "Location required",
        description: "Please set your location first to get directions",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🧭 Getting directions to:', hotel.name);
      
      // Try edge function first for enhanced directions
      try {
        const { data, error } = await supabase.functions.invoke('get-directions', {
          body: {
            origin: { lat: currentLocation.lat, lng: currentLocation.lng },
            destination: { lat: hotel.lat, lng: hotel.lng },
            hotel_name: hotel.name
          }
        });

        if (!error && data?.directions_url) {
          console.log('✅ Using enhanced directions from edge function');
          toast({
            title: "🚗 Enhanced Directions",
            description: `Route to ${hotel.name}: ${data.route_info?.duration}min, ${data.route_info?.distance}km`
          });
          window.open(data.directions_url, '_blank', 'noopener,noreferrer');
          return;
        }
      } catch (edgeFunctionError) {
        console.warn('⚠️ Edge function directions failed, using fallback');
      }

      // Fallback to direct OpenStreetMap directions
      const osmUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${currentLocation.lat}%2C${currentLocation.lng}%3B${hotel.lat}%2C${hotel.lng}`;
      toast({
        title: "🗺️ Opening Directions",
        description: `Getting directions to ${hotel.name} (${hotel.distance} away)`
      });
      window.open(osmUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('🚨 Error opening directions:', error);
      toast({
        title: "Error",
        description: "Failed to open directions. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleShowDetails = (hotel: HotelData) => {
    setSelectedHotel(hotel);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedHotel(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img 
          src={heroImage} 
          alt="Hotel finder hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <Hotel className="w-12 h-12 mx-auto mb-4 text-hotel-primary" />
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Find Hotels Near You
            </h1>
            <p className="text-lg opacity-90">
              Discover great hotels with ratings and get instant directions
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Location Input */}
        <Card className="mb-8 shadow-card-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-hotel-primary" />
              Where are you looking for hotels?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LocationInput 
              onLocationSelect={handleLocationSelect}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Current Location Display */}
        {currentLocation && (
          <div className="mb-6 p-4 bg-hotel-primary/10 rounded-lg border border-hotel-primary/20">
            <div className="flex items-center gap-2 text-hotel-primary">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">
                Searching near: {currentLocation.address}
              </span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-hotel-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Finding hotels near you...</p>
          </div>
        )}

        {/* Hotel Results */}
        {hotels.length > 0 && !isLoading && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">
              Hotels near you ({hotels.length} found)
            </h2>
            {hotels.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                onGetDirections={handleGetDirections}
                onShowDetails={handleShowDetails}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!currentLocation && !isLoading && (
          <div className="text-center py-12">
            <Hotel className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">Ready to find hotels?</h3>
            <p className="text-muted-foreground">
              Share your location or enter an area name to get started
            </p>
          </div>
        )}

        {/* Hotel Details Modal */}
        <HotelDetails
          hotel={selectedHotel}
          isOpen={isDetailsOpen}
          onClose={handleCloseDetails}
          onGetDirections={handleGetDirections}
        />
      </div>
    </div>
  );
};