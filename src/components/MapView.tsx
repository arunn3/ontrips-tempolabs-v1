import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { MapPin, ZoomIn, ZoomOut, Navigation } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: "attraction" | "restaurant" | "hotel";
}

interface MapViewProps {
  locations?: Location[];
  selectedLocation?: string;
  onLocationSelect?: (locationId: string) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
}

const defaultLocations: Location[] = [
  {
    id: "1",
    name: "Eiffel Tower",
    lat: 48.8584,
    lng: 2.2945,
    type: "attraction",
  },
  {
    id: "2",
    name: "Le Cheval Blanc",
    lat: 48.8606,
    lng: 2.3376,
    type: "restaurant",
  },
  { id: "3", name: "Hotel de Ville", lat: 48.8566, lng: 2.3522, type: "hotel" },
];

const MapView: React.FC<MapViewProps> = ({
  locations = defaultLocations,
  selectedLocation = "1",
  onLocationSelect = () => {},
  center = { lat: 48.8584, lng: 2.2945 },
  zoom = 13,
}) => {
  const [currentZoom, setCurrentZoom] = useState(zoom);

  return (
    <Card className="w-full h-[600px] bg-white p-4 relative">
      {/* Map Container */}
      <div className="w-full h-full bg-gray-100 rounded-lg relative">
        {/* Placeholder for actual map implementation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-gray-400">Map View</span>
        </div>

        {/* Map Controls */}
        <div className="absolute right-4 top-4 flex flex-col gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setCurrentZoom(Math.min(currentZoom + 1, 20))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Zoom In</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setCurrentZoom(Math.max(currentZoom - 1, 1))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Zoom Out</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" size="icon">
                  <Navigation className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Current Location</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Location Markers */}
        {locations.map((location) => (
          <Button
            key={location.id}
            variant={selectedLocation === location.id ? "default" : "secondary"}
            size="icon"
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${(location.lng - center.lng + 0.1) * 100}px`,
              top: `${(location.lat - center.lat + 0.1) * 100}px`,
            }}
            onClick={() => onLocationSelect(location.id)}
          >
            <MapPin className="h-4 w-4" />
          </Button>
        ))}
      </div>

      {/* Location List */}
      <div className="absolute left-4 top-4 w-64 bg-white rounded-lg shadow-lg p-4">
        <h3 className="font-semibold mb-2">Points of Interest</h3>
        <div className="space-y-2">
          {locations.map((location) => (
            <Button
              key={location.id}
              variant={selectedLocation === location.id ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => onLocationSelect(location.id)}
            >
              <MapPin className="h-4 w-4 mr-2" />
              {location.name}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default MapView;
