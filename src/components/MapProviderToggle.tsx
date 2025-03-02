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
          className="flex items-center gap-2"
        >
          <Map className="h-4 w-4" />
          {currentProvider === "openstreetmap"
            ? "OpenStreetMap"
            : "Google Maps"}
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
