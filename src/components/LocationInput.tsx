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
      (position) => {
        const { latitude, longitude } = position.coords;
        onLocationSelect({
          lat: latitude,
          lng: longitude,
          address: "Current location"
        });
        setIsGettingLocation(false);
        toast({
          title: "Location found!",
          description: "Searching for hotels near you..."
        });
      },
      (error) => {
        setIsGettingLocation(false);
        toast({
          title: "Location error",
          description: "Unable to get your location. Please enter an address manually.",
          variant: "destructive"
        });
      }
    );
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    // For demo purposes, we'll use a mock geocoding
    // In real app, this would call Google Geocoding API
    onLocationSelect({
      lat: 40.7128,
      lng: -74.0060,
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