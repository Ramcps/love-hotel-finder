import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Star, 
  MapPin, 
  Phone, 
  Wifi, 
  Car, 
  Utensils, 
  Dumbbell, 
  Waves,
  Coffee,
  Navigation,
  Clock,
  Users
} from "lucide-react";

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

interface HotelDetailsProps {
  hotel: Hotel | null;
  isOpen: boolean;
  onClose: () => void;
  onGetDirections: (hotel: Hotel) => void;
}

// Mock detailed hotel data
const getHotelDetails = (hotel: Hotel) => {
  const amenities = [
    { icon: Wifi, label: "Free WiFi" },
    { icon: Car, label: "Parking" },
    { icon: Utensils, label: "Restaurant" },
    { icon: Dumbbell, label: "Fitness Center" },
    { icon: Waves, label: "Swimming Pool" },
    { icon: Coffee, label: "Room Service" }
  ];

  const images = [
    "/placeholder.svg",
    "/placeholder.svg", 
    "/placeholder.svg",
    "/placeholder.svg"
  ];

  const details = {
    description: "Experience luxury and comfort at this premium hotel. Our elegantly appointed rooms and suites offer modern amenities and stunning views, perfect for both business and leisure travelers.",
    phone: "+1 (555) 123-4567",
    checkIn: "3:00 PM",
    checkOut: "11:00 AM",
    rooms: "250 rooms available",
    images,
    amenities,
    reviews: Math.floor(Math.random() * 500) + 100,
    highlights: [
      "24/7 Front Desk Service",
      "Business Center",
      "Pet Friendly",
      "Airport Shuttle",
      "Spa & Wellness Center"
    ]
  };

  return details;
};

export const HotelDetails = ({ hotel, isOpen, onClose, onGetDirections }: HotelDetailsProps) => {
  if (!hotel) return null;

  const details = getHotelDetails(hotel);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            {hotel.name}
          </DialogTitle>
        </DialogHeader>

        {/* Hotel Images */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          {details.images.map((image, index) => (
            <div key={index} className="aspect-square rounded-lg overflow-hidden bg-muted">
              <img 
                src={image} 
                alt={`${hotel.name} - Image ${index + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>

        {/* Rating and Basic Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-rating-gold/10 px-3 py-1 rounded-full">
              <Star className="w-4 h-4 fill-rating-gold text-rating-gold" />
              <span className="font-semibold text-rating-gold">{hotel.rating}</span>
              <span className="text-sm text-muted-foreground">({details.reviews} reviews)</span>
            </div>
            <Badge variant="secondary" className="bg-hotel-primary/10 text-hotel-primary">
              {hotel.distance}km away
            </Badge>
          </div>
          <div className="text-right">
            <div className="font-semibold text-lg text-foreground">{hotel.priceRange}</div>
            <div className="text-sm text-muted-foreground">per night</div>
          </div>
        </div>

        {/* Address and Contact */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{hotel.address}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-4 h-4" />
            <span>{details.phone}</span>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-2 text-foreground">About This Hotel</h3>
          <p className="text-muted-foreground leading-relaxed">{details.description}</p>
        </div>

        <Separator className="my-6" />

        {/* Quick Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-hotel-primary" />
            <div>
              <div className="font-medium text-sm">Check-in</div>
              <div className="text-xs text-muted-foreground">{details.checkIn}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-hotel-primary" />
            <div>
              <div className="font-medium text-sm">Check-out</div>
              <div className="text-xs text-muted-foreground">{details.checkOut}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-hotel-primary" />
            <div>
              <div className="font-medium text-sm">Rooms</div>
              <div className="text-xs text-muted-foreground">{details.rooms}</div>
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-3 text-foreground">Amenities</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {details.amenities.map((amenity, index) => (
              <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <amenity.icon className="w-4 h-4 text-hotel-primary" />
                <span className="text-sm text-foreground">{amenity.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Highlights */}
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-3 text-foreground">Hotel Highlights</h3>
          <div className="space-y-2">
            {details.highlights.map((highlight, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-hotel-primary"></div>
                <span className="text-sm text-muted-foreground">{highlight}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={() => onGetDirections(hotel)}
            className="flex-1 bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-hotel"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Get Directions
          </Button>
          <Button variant="outline" onClick={onClose} className="px-6">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};