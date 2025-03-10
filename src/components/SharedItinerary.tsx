import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Clock, MapPin, ArrowLeft, Calendar, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "./ui/use-toast";
import { format } from "date-fns";

interface Activity {
  time: string;
  title: string;
  duration: string;
  location: string;
  description?: string;
  type?: string;
}

interface ItineraryDay {
  date: string;
  activities: Activity[];
}

interface Itinerary {
  id: string;
  user_id: string;
  destination: string;
  summary: string;
  total_activities: number;
  estimated_cost: string;
  created_at: string;
  itinerary_data: {
    days: ItineraryDay[];
  };
  share_id: string;
  user_name?: string;
}

const SharedItinerary = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItinerary = async () => {
      if (!shareId) {
        setError("No share ID provided");
        setIsLoading(false);
        return;
      }

      try {
        console.log("Fetching itinerary with share_id:", shareId);
        // Fetch the itinerary by share_id
        const { data, error } = await supabase
          .from("itineraries")
          .select("*")
          .eq("share_id", shareId);

        console.log("Fetch result:", { data, error });

        if (error) {
          throw new Error("Failed to fetch itinerary: " + error.message);
        }

        if (!data || data.length === 0) {
          throw new Error("Itinerary not found");
        }

        // Use the first matching itinerary
        const itineraryData = data[0];

        // Fetch user name if available
        if (itineraryData.user_id) {
          try {
            const { data: userData, error: userError } = await supabase
              .from("profiles")
              .select("id, full_name")
              .eq("id", itineraryData.user_id)
              .single();

            if (!userError && userData && userData.full_name) {
              itineraryData.user_name = userData.full_name;
            } else {
              itineraryData.user_name = "Anonymous User";
            }
          } catch (userError) {
            console.error("Error fetching user data:", userError);
            // Continue without user data
            itineraryData.user_name = "Anonymous User";
          }
        }

        setItinerary(itineraryData);
      } catch (err: any) {
        console.error("Error fetching shared itinerary:", err);
        setError(err.message || "Failed to load itinerary");
      } finally {
        setIsLoading(false);
      }
    };

    fetchItinerary();
  }, [shareId]);

  const handleUseItinerary = () => {
    if (!itinerary) return;

    // Store the itinerary in localStorage
    localStorage.setItem(
      "generatedItinerary",
      JSON.stringify(itinerary.itinerary_data),
    );

    // Create a destination object
    const destination = {
      title: itinerary.destination,
      description: `Shared itinerary for ${itinerary.destination}`,
      image: `https://source.unsplash.com/featured/?${encodeURIComponent(itinerary.destination)},travel&w=800&q=80`,
      matchPercentage: 100,
      rating: 4.8,
      priceRange: itinerary.estimated_cost,
      itinerary: itinerary.itinerary_data,
    };

    localStorage.setItem("selectedDestination", JSON.stringify(destination));
    localStorage.setItem("itineraryUpdate", Date.now().toString());

    // Navigate to the planner page
    navigate("/planner");
  };

  const getActivityTypeColor = (type?: string) => {
    switch (type) {
      case "attraction":
        return "bg-blue-100 text-blue-800";
      case "meal":
        return "bg-green-100 text-green-800";
      case "transport":
        return "bg-purple-100 text-purple-800";
      case "rest":
        return "bg-amber-100 text-amber-800";
      case "accommodation":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">
          {error || "Itinerary not found"}
        </h2>
        <p className="text-muted-foreground mb-6">
          The shared itinerary you're looking for might have been removed or is
          no longer available.
        </p>
        <Button onClick={() => navigate("/")}>Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Button
        variant="ghost"
        className="mb-6 flex items-center gap-2"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Button>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{itinerary.destination}</h1>
            <p className="text-muted-foreground">{itinerary.summary}</p>
            {itinerary.user_name && (
              <div className="flex items-center gap-2 mt-2 text-sm">
                <User className="h-4 w-4" />
                <span>Created by {itinerary.user_name}</span>
              </div>
            )}
          </div>
          <Button className="mt-4 md:mt-0" onClick={handleUseItinerary}>
            Use This Itinerary
          </Button>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              {itinerary.itinerary_data.days.length} days
            </span>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
            <Clock className="h-4 w-4" />
            <span className="text-sm">
              {itinerary.total_activities} activities
            </span>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
            <span className="text-sm font-medium">
              {itinerary.estimated_cost}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Itinerary Schedule</h2>

        <ScrollArea className="h-[600px] pr-4">
          {itinerary.itinerary_data.days.map((day, dayIndex) => (
            <div key={dayIndex} className="mb-8 last:mb-0">
              <h3 className="font-medium text-lg mb-4 sticky top-0 bg-white py-2 border-b z-10">
                Day {dayIndex + 1}:{" "}
                {format(new Date(day.date), "EEEE, MMMM d, yyyy")}
              </h3>

              <div className="space-y-4 pl-4 border-l border-gray-200">
                {day.activities.map((activity, actIndex) => (
                  <div key={actIndex} className="relative pl-6">
                    <div className="absolute left-[-13px] top-1.5 w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                      <span className="text-xs text-primary font-medium">
                        {actIndex + 1}
                      </span>
                    </div>
                    <div className="bg-white p-4 rounded-lg border hover:border-blue-200 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {activity.time}
                        </span>
                        <span className="text-sm text-gray-400">
                          ({activity.duration})
                        </span>
                        {activity.type && (
                          <Badge
                            variant="secondary"
                            className={getActivityTypeColor(activity.type)}
                          >
                            {activity.type}
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-medium">{activity.title}</h4>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{activity.location}</span>
                      </div>
                      {activity.description && (
                        <p className="mt-2 pt-2 border-t text-sm text-gray-600">
                          {activity.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </ScrollArea>

        <div className="mt-6 pt-6 border-t flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Shared on {format(new Date(itinerary.created_at), "MMMM d, yyyy")}
          </p>
          <Button onClick={handleUseItinerary}>Use This Itinerary</Button>
        </div>
      </div>
    </div>
  );
};

export default SharedItinerary;
