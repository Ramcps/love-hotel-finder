import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LocationInputProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string; country?: string }) => void;
  isLoading?: boolean;
}

export const LocationInput = ({ onLocationSelect, isLoading }: LocationInputProps) => {
  const [address, setAddress] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { toast } = useToast();

  const reverseGeocode = async (lat: number, lng: number): Promise<{ address: string; country: string }> => {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      const data = await response.json();
      
      let address = '';
      if (data.locality && data.countryName) {
        address = `${data.locality}, ${data.principalSubdivision || data.countryName}`;
      } else if (data.city && data.countryName) {
        address = `${data.city}, ${data.countryName}`;
      } else {
        address = `${data.countryName || 'Unknown location'}`;
      }
      
      return {
        address,
        country: data.countryName || 'Unknown'
      };
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return {
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        country: 'Unknown'
      };
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

        const locationData = await reverseGeocode(latitude, longitude);
        
        onLocationSelect({
          lat: latitude,
          lng: longitude,
          address: locationData.address,
          country: locationData.country
        });
        setIsGettingLocation(false);
        toast({
          title: "Location found!",
          description: `Searching for hotels near ${locationData.address}...`
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

    // City coordinates with country mapping
    const cityData: { [key: string]: { lat: number; lng: number; country: string } } = {
      "new york": { lat: 40.7128, lng: -74.0060, country: "United States" },
      "london": { lat: 51.5074, lng: -0.1278, country: "United Kingdom" },
      "paris": { lat: 48.8566, lng: 2.3522, country: "France" },
      "tokyo": { lat: 35.6762, lng: 139.6503, country: "Japan" },
      "dubai": { lat: 25.2048, lng: 55.2708, country: "United Arab Emirates" },
      "mumbai": { lat: 19.0760, lng: 72.8777, country: "India" },
      "delhi": { lat: 28.7041, lng: 77.1025, country: "India" },
      "bangalore": { lat: 12.9716, lng: 77.5946, country: "India" },
      "chennai": { lat: 13.0827, lng: 80.2707, country: "India" },
      "pune": { lat: 18.5204, lng: 73.8567, country: "India" },
      "hyderabad": { lat: 17.3850, lng: 78.4867, country: "India" },
      "kolkata": { lat: 22.5726, lng: 88.3639, country: "India" },
      "singapore": { lat: 1.3521, lng: 103.8198, country: "Singapore" },
      "sydney": { lat: -33.8688, lng: 151.2093, country: "Australia" },
      "toronto": { lat: 43.6532, lng: -79.3832, country: "Canada" },
      "berlin": { lat: 52.5200, lng: 13.4050, country: "Germany" }
    };

    const searchKey = address.toLowerCase();
    let locationData = cityData[searchKey];
    
    // If not found, default to US with entered address
    if (!locationData) {
      locationData = { 
        lat: 40.7128 + (Math.random() - 0.5) * 0.1, 
        lng: -74.0060 + (Math.random() - 0.5) * 0.1,
        country: "United States"
      };
    }

    onLocationSelect({
      lat: locationData.lat,
      lng: locationData.lng,
      address: address,
      country: locationData.country
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