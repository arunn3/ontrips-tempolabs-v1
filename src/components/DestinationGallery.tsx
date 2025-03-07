import React, { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Heart, MapPin, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "./ui/use-toast";
import { useNavigate } from "react-router-dom";

interface Destination {
  id: string;
  title: string;
  description: string;
  image: string;
  match_percentage: number;
  rating: number;
  price_range: string;
  created_at: string;
}

const DestinationGallery = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("destinations")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data) {
          setDestinations(data);
        }
      } catch (error) {
        console.error("Error fetching destinations:", error);
        toast({
          title: "Error",
          description: "Failed to load destinations",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDestinations();
  }, [toast]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id],
    );
  };

  const handleDestinationClick = (destination: Destination) => {
    // Navigate to destination details page
    navigate(`/destination/${destination.id}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-96 animate-pulse bg-gray-200">
              <div className="h-48 bg-gray-300 rounded-t-lg"></div>
              <div className="p-4 space-y-3">
                <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-20 bg-gray-300 rounded"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Explore Destinations
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {destinations.map((destination) => (
          <Card
            key={destination.id}
            className="overflow-hidden transition-all hover:shadow-lg cursor-pointer"
            onClick={() => handleDestinationClick(destination)}
          >
            <div className="relative h-48">
              <img
                src={destination.image}
                alt={destination.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=800&q=80";
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(destination.id);
                }}
              >
                <Heart
                  className={`h-5 w-5 ${favorites.includes(destination.id) ? "fill-red-500 text-red-500" : ""}`}
                />
              </Button>
            </div>

            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{destination.title}</h3>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-sm">
                    {destination.rating.toFixed(1)}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {destination.description}
              </p>

              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>Explore</span>
                </div>

                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  {destination.match_percentage}% Match
                </Badge>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-sm font-medium">{destination.price_range}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DestinationGallery;
