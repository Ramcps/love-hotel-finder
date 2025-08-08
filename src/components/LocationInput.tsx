import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LocationInputProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  isLoading?: boolean;
}

export const LocationInput = ({ onLocationSelect, isLoading }: LocationInputProps) => {
  const [address, setAddress] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { toast } = useToast();

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      const data = await response.json();
      
      if (data.locality && data.countryName) {
        return `${data.locality}, ${data.principalSubdivision || data.countryName}`;
      } else if (data.city && data.countryName) {
        return `${data.city}, ${data.countryName}`;
      } else {
        return `${data.countryName || 'Unknown location'}`;
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services",
        variant: "destructive"
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        toast({
          title: "Getting location details...",
          description: "Finding your exact address..."
        });

        const address = await reverseGeocode(latitude, longitude);
        
        onLocationSelect({
          lat: latitude,
          lng: longitude,
          address: address
        });
        setIsGettingLocation(false);
        toast({
          title: "Location found!",
          description: `Searching for hotels near ${address}...`
        });
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = "Unable to get your location. Please enter an address manually.";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please allow location access and try again.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable. Please try again.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
        }
        
        toast({
          title: "Location error",
          description: errorMessage,
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    // Simulate geocoding with realistic coordinates for common cities
    const cityCoordinates: { [key: string]: { lat: number; lng: number } } = {
      "new york": { lat: 40.7128, lng: -74.0060 },
      "london": { lat: 51.5074, lng: -0.1278 },
      "paris": { lat: 48.8566, lng: 2.3522 },
      "tokyo": { lat: 35.6762, lng: 139.6503 },
      "dubai": { lat: 25.2048, lng: 55.2708 },
      "mumbai": { lat: 19.0760, lng: 72.8777 },
      "delhi": { lat: 28.7041, lng: 77.1025 },
      "bangalore": { lat: 12.9716, lng: 77.5946 }
    };

    const searchKey = address.toLowerCase();
    let coordinates = cityCoordinates[searchKey];
    
    // If not found, use default coordinates with slight variation
    if (!coordinates) {
      coordinates = { 
        lat: 40.7128 + (Math.random() - 0.5) * 0.1, 
        lng: -74.0060 + (Math.random() - 0.5) * 0.1 
      };
    }

    onLocationSelect({
      ...coordinates,
      address: address
    });
    
    toast({
      title: "Location set!",
      description: `Searching for hotels near ${address}...`
    });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAddressSubmit} className="flex gap-2">
        <Input
          placeholder="Enter area name or address..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="flex-1"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          variant="outline"
          disabled={isLoading || !address.trim()}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </form>
      
      <div className="text-center">
        <span className="text-sm text-muted-foreground">or</span>
      </div>
      
      <Button
        onClick={handleCurrentLocation}
        disabled={isGettingLocation || isLoading}
        className="w-full bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-hotel"
      >
        {isGettingLocation ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Getting location...
          </>
        ) : (
          <>
            <MapPin className="w-4 h-4 mr-2" />
            Use my current location
          </>
        )}
      </Button>
    </div>
  );
};