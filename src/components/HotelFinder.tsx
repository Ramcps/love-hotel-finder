import { useState } from "react";
import { LocationInput } from "./LocationInput";
import { HotelCard } from "./HotelCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hotel, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hotel-hero.jpg";

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface HotelData {
  id: string;
  name: string;
  rating: number;
  address: string;
  distance: number;
  priceRange: string;
  image: string;
  lat: number;
  lng: number;
}

// Mock hotel data - in real app this would come from Google Places API
const generateMockHotels = (location: Location): HotelData[] => {
  const baseHotels = [
    {
      name: "Grand Plaza Hotel",
      rating: 4.5,
      priceRange: "$$$",
      type: "luxury"
    },
    {
      name: "Business Suites",
      rating: 4.2,
      priceRange: "$$$$",
      type: "business"
    },
    {
      name: "Comfort Inn & Suites",
      rating: 4.0,
      priceRange: "$$",
      type: "budget"
    },
    {
      name: "Boutique Hotel Downtown",
      rating: 4.7,
      priceRange: "$$$",
      type: "boutique"
    },
    {
      name: "City Center Lodge",
      rating: 3.8,
      priceRange: "$",
      type: "budget"
    }
  ];

  return baseHotels.map((hotel, index) => {
    // Generate realistic coordinates within 2km radius
    const randomOffset = () => (Math.random() - 0.5) * 0.02; // ~2km radius
    const distance = Math.random() * 2; // 0-2km
    
    return {
      id: (index + 1).toString(),
      name: hotel.name,
      rating: hotel.rating,
      address: `${100 + index * 50} Main St, Near ${location.address}`,
      distance: Math.round(distance * 10) / 10, // Round to 1 decimal
      priceRange: hotel.priceRange,
      image: "/placeholder.svg",
      lat: location.lat + randomOffset(),
      lng: location.lng + randomOffset()
    };
  }).sort((a, b) => a.distance - b.distance); // Sort by distance
};

export const HotelFinder = () => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [hotels, setHotels] = useState<HotelData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLocationSelect = async (location: Location) => {
    setCurrentLocation(location);
    setIsLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate realistic hotels based on the actual location
      const nearbyHotels = generateMockHotels(location);
      setHotels(nearbyHotels);
      
      toast({
        title: "Hotels found!",
        description: `Found ${nearbyHotels.length} hotels within 2km of ${location.address}`
      });
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Unable to find hotels. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetDirections = (hotel: HotelData) => {
    if (!currentLocation) {
      toast({
        title: "Location required",
        description: "Please set your location first to get directions",
        variant: "destructive"
      });
      return;
    }

    // Create accurate Google Maps directions URL
    const directionsUrl = `https://www.google.com/maps/dir/${currentLocation.lat},${currentLocation.lng}/${hotel.lat},${hotel.lng}/@${hotel.lat},${hotel.lng},15z`;
    
    toast({
      title: "Opening Google Maps",
      description: `Getting directions to ${hotel.name} (${hotel.distance}km away)`
    });

    // Open in new tab/window
    window.open(directionsUrl, '_blank', 'noopener,noreferrer');
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
            <div className="animate-spin w-8 h-8 border-4 border-hotel-primary border-t-transparent rounded-full mx-auto mb-4"></div>
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
      </div>
    </div>
  );
};