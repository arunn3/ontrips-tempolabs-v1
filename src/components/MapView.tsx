import React, { useState, useEffect, useRef } from "react";
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
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    // Load OpenStreetMap script
    const loadLeaflet = async () => {
      if (!window.L) {
        // Load Leaflet CSS
        const linkEl = document.createElement("link");
        linkEl.rel = "stylesheet";
        linkEl.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(linkEl);

        // Load Leaflet JS
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.async = true;
        script.onload = initializeMap;
        document.body.appendChild(script);
      } else {
        initializeMap();
      }
    };

    const initializeMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const L = window.L;

      // Initialize the map
      const map = L.map(mapRef.current).setView(
        [center.lat, center.lng],
        currentZoom,
      );
      mapInstanceRef.current = map;

      // Add OpenStreetMap tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
    };

    loadLeaflet();

    return () => {
      // Cleanup map instance when component unmounts
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when locations or selected location changes
  useEffect(() => {
    if (mapInstanceRef.current && window.L) {
      const map = mapInstanceRef.current;

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      // Add new markers
      const L = window.L;

      // Find the city from the first location to center the map
      let cityCenter = { lat: center.lat, lng: center.lng };
      let cityName = "";

      if (locations.length > 0) {
        // Try to extract city name from the first location
        const firstLocation = locations[0];
        console.log(firstLocation);
        const locationParts = firstLocation.name.split(",");
        if (locationParts.length > 1) {
          cityName = locationParts[locationParts.length - 1].trim();
        }

        // Set initial view to the first location
        cityCenter = { lat: firstLocation.lat, lng: firstLocation.lng };
        map.setView([cityCenter.lat, cityCenter.lng], currentZoom);
      }

      // Create a bounds object to fit all markers
      const bounds = L.latLngBounds();

      // Add markers for each location
      locations.forEach((location) => {
        const marker = L.marker([location.lat, location.lng], {
          title: location.name,
        }).addTo(map);

        marker.bindPopup(`<b>${location.name}</b><br>${location.type}`);

        // Add location to bounds
        bounds.extend([location.lat, location.lng]);

        // Highlight selected marker
        if (location.id === selectedLocation) {
          marker.openPopup();
          map.setView([location.lat, location.lng], currentZoom);
        }

        // Add click handler
        marker.on("click", () => {
          onLocationSelect(location.id);
        });

        markersRef.current.push(marker);
      });

      // If we have multiple locations, fit the map to show all markers
      if (locations.length > 1 && bounds.isValid()) {
        try {
          map.fitBounds(bounds, { padding: [50, 50] });
        } catch (error) {
          console.error("Error fitting bounds:", error);
          // Fallback to just centering on the first location
          if (locations.length > 0) {
            map.setView([locations[0].lat, locations[0].lng], currentZoom);
          }
        }
      }
    }
  }, [locations, selectedLocation]);

  // Update zoom when it changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(currentZoom);
    }
  }, [currentZoom]);

  const handleZoomIn = () => {
    const newZoom = Math.min(currentZoom + 1, 18);
    setCurrentZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(currentZoom - 1, 1);
    setCurrentZoom(newZoom);
  };

  return (
    <Card className="w-full h-full bg-white p-4 relative">
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full rounded-lg relative" />

      {/* Map Controls */}
      <div className="absolute right-4 top-4 flex flex-col gap-2 z-[1000]">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" size="icon" onClick={handleZoomIn}>
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
              <Button variant="secondary" size="icon" onClick={handleZoomOut}>
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
              <Button
                variant="secondary"
                size="icon"
                onClick={() => {
                  if (mapInstanceRef.current && locations.length > 0) {
                    mapInstanceRef.current.setView(
                      [locations[0].lat, locations[0].lng],
                      currentZoom,
                    );
                  }
                }}
              >
                <Navigation className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>First Location</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Location List */}
      <Card className="absolute left-4 top-4 w-64 p-4 z-[1000]">
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
      </Card>
    </Card>
  );
};

// Add Leaflet types to Window interface
declare global {
  interface Window {
    L: any;
  }
}

export default MapView;
