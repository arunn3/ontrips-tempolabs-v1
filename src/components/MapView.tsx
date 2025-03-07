import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { MapPin, ZoomIn, ZoomOut, Navigation } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import MapProviderToggle, { MapProvider } from "./MapProviderToggle";

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
  mapProvider?: MapProvider;
  onProviderChange?: (provider: MapProvider) => void;
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
  mapProvider = "openstreetmap",
  onProviderChange = () => {},
}) => {
  const [currentProvider, setCurrentProvider] =
    useState<MapProvider>(mapProvider);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const initializeOpenStreetMap = useCallback(() => {
    if (!mapRef.current) return;

    try {
      if (!window.L) {
        console.error("Leaflet library not loaded");
        return;
      }

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
    } catch (error) {
      console.error("Error initializing OpenStreetMap:", error);
      if (mapRef.current) {
        mapRef.current.innerHTML =
          '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f0f0f0;border-radius:0.5rem;"><p>Error loading map</p></div>';
      }
    }
  }, [center.lat, center.lng, currentZoom]);

  useEffect(() => {
    // Clean up existing map instance if it exists
    if (mapInstanceRef.current) {
      if (currentProvider === "openstreetmap" && window.L) {
        try {
          if (typeof mapInstanceRef.current.remove === "function") {
            mapInstanceRef.current.remove();
          } else if (
            typeof mapInstanceRef.current._leaflet_id !== "undefined"
          ) {
            // Alternative cleanup for Leaflet maps
            mapInstanceRef.current.off();
            mapInstanceRef.current.remove();
          }
        } catch (error) {
          console.error("Error removing map:", error);
        }
      }
      mapInstanceRef.current = null;
    }

    if (currentProvider === "openstreetmap") {
      // Load OpenStreetMap script
      try {
        // Create a simple placeholder first
        if (mapRef.current) {
          mapRef.current.innerHTML =
            '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f0f0f0;border-radius:0.5rem;"><p>Loading map...</p></div>';
        }

        // Check if Leaflet is already loaded
        if (window.L) {
          initializeOpenStreetMap();
          return;
        }

        // Load Leaflet CSS
        const existingLink = document.querySelector('link[href*="leaflet"]');
        if (!existingLink) {
          const linkEl = document.createElement("link");
          linkEl.rel = "stylesheet";
          linkEl.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(linkEl);
        }

        // Load Leaflet JS
        const existingScript = document.querySelector('script[src*="leaflet"]');
        if (!existingScript) {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.async = true;
          script.onload = initializeOpenStreetMap;
          script.onerror = () => {
            console.error("Failed to load Leaflet script");
            if (mapRef.current) {
              mapRef.current.innerHTML =
                '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f0f0f0;border-radius:0.5rem;"><p>Failed to load map</p></div>';
            }
          };
          document.body.appendChild(script);
        }
      } catch (error) {
        console.error("Error setting up OpenStreetMap:", error);
        if (mapRef.current) {
          mapRef.current.innerHTML =
            '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f0f0f0;border-radius:0.5rem;"><p>Error loading map</p></div>';
        }
      }
    } else if (currentProvider === "google") {
      const loadGoogleMaps = () => {
        // Create a loading placeholder
        if (mapRef.current) {
          mapRef.current.innerHTML =
            '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f0f0f0;border-radius:0.5rem;"><p>Loading Google Maps...</p></div>';
        }

        // Check if Google Maps API is already loaded
        if (window.google?.maps) {
          initializeGoogleMap();
          return;
        }

        // Load Google Maps API
        const apiKey = import.meta.env.VITE_MAPS_API_KEY;
        if (!apiKey) {
          console.error("Google Maps API key is missing");
          if (mapRef.current) {
            mapRef.current.innerHTML =
              '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f0f0f0;border-radius:0.5rem;"><p>Google Maps API key is missing</p></div>';
          }
          return;
        }

        const existingScript = document.querySelector(
          'script[src*="maps.googleapis.com"]',
        );
        if (!existingScript) {
          const script = document.createElement("script");
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
          script.async = true;
          script.defer = true;
          script.onload = initializeGoogleMap;
          script.onerror = () => {
            console.error("Failed to load Google Maps script");
            if (mapRef.current) {
              mapRef.current.innerHTML =
                '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f0f0f0;border-radius:0.5rem;"><p>Failed to load Google Maps</p></div>';
            }
          };
          document.body.appendChild(script);
        }
      };

      const initializeGoogleMap = () => {
        try {
          if (!mapRef.current || !window.google?.maps) return;

          const map = new window.google.maps.Map(mapRef.current, {
            center: { lat: center.lat, lng: center.lng },
            zoom: currentZoom,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });

          mapInstanceRef.current = map;
        } catch (error) {
          console.error("Error initializing Google Maps:", error);
          if (mapRef.current) {
            mapRef.current.innerHTML =
              '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f0f0f0;border-radius:0.5rem;"><p>Error initializing Google Maps</p></div>';
          }
        }
      };

      loadGoogleMaps();
    }

    return () => {
      // Cleanup map instance when component unmounts or provider changes
      if (mapInstanceRef.current) {
        if (currentProvider === "openstreetmap" && window.L) {
          try {
            if (typeof mapInstanceRef.current.remove === "function") {
              mapInstanceRef.current.remove();
            } else if (
              typeof mapInstanceRef.current._leaflet_id !== "undefined"
            ) {
              // Alternative cleanup for Leaflet maps
              mapInstanceRef.current.off();
              mapInstanceRef.current.remove();
            }
          } catch (error) {
            console.error("Error cleaning up map:", error);
          }
        }
        mapInstanceRef.current = null;
      }
    };
  }, [currentProvider, initializeOpenStreetMap]);

  // Update markers when locations or selected location changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      try {
        if (currentProvider === "openstreetmap" && window.L) {
          if (marker && typeof marker.remove === "function") {
            marker.remove();
          }
        } else if (currentProvider === "google" && window.google?.maps) {
          marker.setMap(null);
        }
      } catch (error) {
        console.error("Error removing marker:", error);
      }
    });
    markersRef.current = [];

    // Find the city from the first location to center the map
    let cityCenter = { lat: center.lat, lng: center.lng };
    let cityName = "";

    if (locations.length > 0) {
      // Try to extract city name from the first location
      const firstLocation = locations[0];
      console.log("First location:", firstLocation);
      const locationParts = firstLocation.name.split(",");
      if (locationParts.length > 1) {
        cityName = locationParts[locationParts.length - 1].trim();
      }

      // Find a valid location to center the map
      const validLocation =
        locations.find((loc) => loc.lat !== 0 && loc.lng !== 0) ||
        firstLocation;
      if (validLocation.lat !== 0 && validLocation.lng !== 0) {
        cityCenter = { lat: validLocation.lat, lng: validLocation.lng };
      }
    }

    if (currentProvider === "openstreetmap" && window.L) {
      const map = mapInstanceRef.current;
      const L = window.L;

      // Set view to the city center
      try {
        map.setView([cityCenter.lat, cityCenter.lng], currentZoom);
      } catch (error) {
        console.error("Error setting map view:", error);
      }

      // Create a bounds object to fit all markers
      const bounds = L.latLngBounds();

      // Add markers for each location with valid coordinates
      locations.forEach((location) => {
        // Skip locations with invalid coordinates
        if (location.lat === 0 && location.lng === 0) {
          console.warn(
            `Skipping marker for ${location.name} due to invalid coordinates`,
          );
          return;
        }

        let marker;
        try {
          marker = L.marker([location.lat, location.lng], {
            title: location.name,
          }).addTo(map);
        } catch (error) {
          console.error(`Error adding marker for ${location.name}:`, error);
          return;
        }

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
            map.setView([cityCenter.lat, cityCenter.lng], currentZoom);
          }
        }
      }
    } else if (currentProvider === "google" && window.google?.maps) {
      const map = mapInstanceRef.current;
      if (!map) return;

      // Set center to the city center
      try {
        map.setCenter({ lat: cityCenter.lat, lng: cityCenter.lng });
        map.setZoom(currentZoom);
      } catch (error) {
        console.error("Error setting Google Maps center:", error);
      }

      // Add markers for each location with valid coordinates
      const bounds = new window.google.maps.LatLngBounds();
      const infoWindow = new window.google.maps.InfoWindow();

      locations.forEach((location) => {
        // Skip locations with invalid coordinates
        if (location.lat === 0 && location.lng === 0) {
          console.warn(
            `Skipping marker for ${location.name} due to invalid coordinates`,
          );
          return;
        }

        try {
          // Determine marker icon based on location type
          let icon = null;
          switch (location.type) {
            case "attraction":
              icon = {
                url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              };
              break;
            case "restaurant":
              icon = {
                url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
              };
              break;
            case "hotel":
              icon = {
                url: "https://maps.google.com/mapfiles/ms/icons/orange-dot.png",
              };
              break;
            default:
              icon = {
                url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
              };
          }

          const marker = new window.google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map: map,
            title: location.name,
            icon: icon,
          });

          // Add click handler
          marker.addListener("click", () => {
            infoWindow.setContent(
              `<b>${location.name}</b><br>${location.type}`,
            );
            infoWindow.open(map, marker);
            onLocationSelect(location.id);
          });

          // Highlight selected marker
          if (location.id === selectedLocation) {
            infoWindow.setContent(
              `<b>${location.name}</b><br>${location.type}`,
            );
            infoWindow.open(map, marker);
            map.setCenter({ lat: location.lat, lng: location.lng });
          }

          // Add location to bounds
          bounds.extend({ lat: location.lat, lng: location.lng });
          markersRef.current.push(marker);
        } catch (error) {
          console.error(
            `Error adding Google marker for ${location.name}:`,
            error,
          );
        }
      });

      // If we have multiple locations, fit the map to show all markers
      if (locations.length > 1 && !bounds.isEmpty()) {
        try {
          map.fitBounds(bounds);
          // Add some padding
          const listener = window.google.maps.event.addListenerOnce(
            map,
            "bounds_changed",
            () => {
              map.setZoom(Math.min(map.getZoom(), currentZoom));
            },
          );
        } catch (error) {
          console.error("Error fitting Google Maps bounds:", error);
          // Fallback to just centering on the first location
          if (locations.length > 0) {
            map.setCenter({ lat: cityCenter.lat, lng: cityCenter.lng });
          }
        }
      }
    }
  }, [locations, selectedLocation, currentProvider]);

  // Update zoom when it changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (currentProvider === "openstreetmap" && window.L) {
      mapInstanceRef.current.setZoom(currentZoom);
    } else if (
      currentProvider === "google" &&
      window.google?.maps &&
      mapInstanceRef.current
    ) {
      try {
        mapInstanceRef.current.setZoom(currentZoom);
      } catch (error) {
        console.error("Error setting Google Maps zoom:", error);
      }
    }
  }, [currentZoom, currentProvider]);

  const handleZoomIn = () => {
    const newZoom = Math.min(currentZoom + 1, 18);
    setCurrentZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(currentZoom - 1, 1);
    setCurrentZoom(newZoom);
  };

  const handleProviderChange = (provider: MapProvider) => {
    setCurrentProvider(provider);
    onProviderChange(provider);
  };

  return (
    <Card className="w-full h-full bg-white p-2 sm:p-4 relative">
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full rounded-lg relative" />

      {/* Map Controls */}
      <div className="absolute right-2 sm:right-4 top-2 sm:top-4 flex flex-col gap-1 sm:gap-2 z-[1000]">
        <MapProviderToggle
          currentProvider={currentProvider}
          onProviderChange={handleProviderChange}
        />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={handleZoomIn}
              >
                <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
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
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={handleZoomOut}
              >
                <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
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
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={() => {
                  if (!mapInstanceRef.current || locations.length === 0) return;

                  // Find first valid location
                  const validLocation =
                    locations.find((loc) => loc.lat !== 0 && loc.lng !== 0) ||
                    locations[0];

                  if (currentProvider === "openstreetmap" && window.L) {
                    mapInstanceRef.current.setView(
                      [validLocation.lat, validLocation.lng],
                      currentZoom,
                    );
                  } else if (
                    currentProvider === "google" &&
                    window.google?.maps &&
                    mapInstanceRef.current
                  ) {
                    try {
                      mapInstanceRef.current.setCenter({
                        lat: validLocation.lat,
                        lng: validLocation.lng,
                      });
                    } catch (error) {
                      console.error("Error navigating in Google Maps:", error);
                    }
                  }
                }}
              >
                <Navigation className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>First Location</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Location List */}
      <Card className="absolute left-2 sm:left-4 top-2 sm:top-4 w-36 sm:w-64 p-2 sm:p-4 z-[1000] max-h-[50%] overflow-auto">
        <h3 className="font-semibold text-xs sm:text-sm mb-1 sm:mb-2">
          Points of Interest
        </h3>
        <div className="space-y-1 sm:space-y-2">
          {locations.map((location) => (
            <Button
              key={location.id}
              variant={selectedLocation === location.id ? "default" : "ghost"}
              className="w-full justify-start text-xs sm:text-sm h-auto py-1 px-2"
              onClick={() => onLocationSelect(location.id)}
            >
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="truncate">{location.name}</span>
            </Button>
          ))}
        </div>
      </Card>
    </Card>
  );
};

// Add map library types to Window interface
declare global {
  interface Window {
    L: any;
    google: any;
  }
}

export default MapView;
