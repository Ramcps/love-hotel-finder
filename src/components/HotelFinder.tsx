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
const mockHotels: HotelData[] = [
  {
    id: "1",
    name: "Grand Plaza Hotel",
    rating: 4.5,
    address: "123 Main Street, Downtown",
    distance: 0.8,
    priceRange: "$$$",
    image: "/placeholder.svg",
    lat: 40.7589,
    lng: -73.9851
  },
  {
    id: "2", 
    name: "Luxury Suites",
    rating: 4.8,
    address: "456 Park Avenue, Midtown",
    distance: 1.2,
    priceRange: "$$$$",
    image: "/placeholder.svg",
    lat: 40.7505,
    lng: -73.9934
  },
  {
    id: "3",
    name: "Budget Inn",
    rating: 4.1,
    address: "789 Broadway, Theater District",
    distance: 1.5,
    priceRange: "$$",
    image: "/placeholder.svg",
    lat: 40.7505,
    lng: -73.9934
  }
];

export const HotelFinder = () => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [hotels, setHotels] = useState<HotelData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLocationSelect = async (location: Location) => {
    setCurrentLocation(location);
    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      setHotels(mockHotels);
      setIsLoading(false);
      toast({
        title: "Hotels found!",
        description: `Found ${mockHotels.length} hotels near ${location.address}`
      });
    }, 1500);
  };

  const handleGetDirections = (hotel: HotelData) => {
    if (!currentLocation) return;

    // Create Google Maps directions URL
    const directionsUrl = `https://www.google.com/maps/dir/${currentLocation.lat},${currentLocation.lng}/${hotel.lat},${hotel.lng}`;
    
    toast({
      title: "Opening directions",
      description: `Getting directions to ${hotel.name}`
    });

    // Open in new tab
    window.open(directionsUrl, '_blank');
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