import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Navigation } from "lucide-react";

interface Hotel {
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

interface HotelCardProps {
  hotel: Hotel;
  onGetDirections: (hotel: Hotel) => void;
}

export const HotelCard = ({ hotel, onGetDirections }: HotelCardProps) => {
  return (
    <Card className="bg-gradient-card shadow-card-soft hover:shadow-hotel transition-all duration-300 border-0">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            <img 
              src={hotel.image} 
              alt={hotel.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-foreground truncate pr-2">
                {hotel.name}
              </h3>
              <div className="flex items-center gap-1 bg-rating-gold/10 px-2 py-1 rounded-full">
                <Star className="w-3 h-3 fill-rating-gold text-rating-gold" />
                <span className="text-sm font-medium text-rating-gold">
                  {hotel.rating}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1 text-muted-foreground mb-2">
              <MapPin className="w-3 h-3" />
              <span className="text-xs truncate">{hotel.address}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {hotel.distance}km away • {hotel.priceRange}
              </div>
              
              <Button
                size="sm"
                onClick={() => onGetDirections(hotel)}
                className="bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-hotel"
              >
                <Navigation className="w-3 h-3 mr-1" />
                Directions
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};