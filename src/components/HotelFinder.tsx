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


export const HotelFinder = () => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [hotels, setHotels] = useState<HotelData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<HotelData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();

  const handleLocationSelect = async (location: Location) => {
    setCurrentLocation(location);
    setIsLoading(true);
    setHotels([]);

    try {
      console.log('Searching for hotels near:', location);
      
      const { data, error } = await supabase.functions.invoke('search-hotels', {
        body: { 
          location: location.address,
          radius: 5000
        }
      });

      if (error) {
        throw error;
      }

      if (data && data.hotels) {
        setHotels(data.hotels);
        toast({
          title: "Hotels Found",
          description: `Found ${data.hotels.length} hotels near ${location.address} using LocationIQ`,
        });
      } else {
        setHotels([]);
        toast({
          title: "No hotels found",
          description: "No hotels found in this location. Try a different search.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
      toast({
        title: "Error",
        description: "Failed to search for hotels. Please try again.",
        variant: "destructive",
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
      description: `Getting directions to ${hotel.name} (${hotel.distance} away)`
    });

    // Open in new tab/window
    window.open(directionsUrl, '_blank', 'noopener,noreferrer');
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
            <p className="text-muted-foreground">Finding hotels near you using LocationIQ...</p>
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