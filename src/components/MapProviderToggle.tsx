import React from "react";
import { Button } from "./ui/button";
import { Map } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export type MapProvider = "openstreetmap" | "google";

interface MapProviderToggleProps {
  currentProvider: MapProvider;
  onProviderChange: (provider: MapProvider) => void;
}

const MapProviderToggle: React.FC<MapProviderToggleProps> = ({
  currentProvider,
  onProviderChange,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
        >
          <Map className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">
            {currentProvider === "openstreetmap"
              ? "OpenStreetMap"
              : "Google Maps"}
          </span>
          <span className="sm:hidden">
            {currentProvider === "openstreetmap" ? "OSM" : "GMaps"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => onProviderChange("openstreetmap")}
          className={currentProvider === "openstreetmap" ? "bg-muted" : ""}
        >
          OpenStreetMap
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onProviderChange("google")}
          className={currentProvider === "google" ? "bg-muted" : ""}
        >
          Google Maps
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MapProviderToggle;
