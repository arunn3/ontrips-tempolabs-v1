import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Loader2, MapPin } from "lucide-react";
import { Badge } from "./ui/badge";

interface Attraction {
  name: string;
  description: string;
  duration: string;
  location: string;
  type: string;
}

interface NearbyAttractionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAttraction: (attraction: Attraction) => void;
  location: { lat: number; lng: number };
  isLoading: boolean;
  attractions: Attraction[];
}

const NearbyAttractionsDialog: React.FC<NearbyAttractionsDialogProps> = ({
  open,
  onOpenChange,
  onSelectAttraction,
  location,
  isLoading,
  attractions,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nearby Attractions</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Finding nearby attractions...</span>
            </div>
          ) : attractions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No attractions found nearby.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-auto pr-2">
              {attractions.map((attraction, index) => (
                <Card
                  key={index}
                  className="p-4 hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => onSelectAttraction(attraction)}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">{attraction.name}</h3>
                      <Badge variant="outline">{attraction.duration}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {attraction.description}
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1" />
                      {attraction.location}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NearbyAttractionsDialog;
