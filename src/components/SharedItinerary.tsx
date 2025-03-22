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
  // Function to save changes to the database
  const saveChanges = async (
    newEditedActivities: Record<string, Activity[]>,
  ) => {
    if (!itinerary) return;

    try {
      // Create a copy of the itinerary data
      const updatedItineraryData = { ...itinerary.itinerary_data };

      // Update the activities for each day
      updatedItineraryData.days = updatedItineraryData.days.map(
        (day, index) => ({
          ...day,
          activities: newEditedActivities[index.toString()] || day.activities,
        }),
      );

      console.log("Saving changes to database for itinerary ID:", itinerary.id);
      console.log("Updated itinerary data:", updatedItineraryData);

      // Update the itinerary in the database
      const { data, error } = await supabase
        .from("itineraries")
        .update({ itinerary_data: updatedItineraryData })
        .eq("id", itinerary.id)
        .select();

      if (error) throw error;

      console.log("Database update response:", data);

      // Update local state with a completely new object to force re-render
      const updatedItinerary = {
        ...itinerary,
        itinerary_data: updatedItineraryData,
      };
      setItinerary(updatedItinerary);

      // Dispatch event to update planner view
      const updateEvent = new CustomEvent("sharedItineraryUpdate", {
        detail: {
          itinerary: updatedItineraryData,
          timestamp: Date.now(),
        },
      });
      window.dispatchEvent(updateEvent);

      // Also update localStorage directly to ensure consistency
      localStorage.setItem(
        "generatedItinerary",
        JSON.stringify(updatedItineraryData),
      );
      localStorage.setItem("itineraryUpdate", Date.now().toString());

      toast({
        title: "Changes saved",
        description: "Your changes have been saved successfully",
      });
    } catch (error) {
      console.error("Error saving changes:", error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    }
  };
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditable, setIsEditable] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedActivities, setEditedActivities] = useState<
    Record<string, Activity[]>
  >({});

  // Add debug logging for component state
  useEffect(() => {
    console.log("Component state changed:", {
      isLoading,
      error,
      itinerary: itinerary
        ? `${itinerary.id} with ${itinerary.itinerary_data?.days?.length} days`
        : null,
      shareId,
    });
  }, [isLoading, error, itinerary, shareId]);

  useEffect(() => {
    let isMounted = true;
    console.log("Starting fetchItinerary effect with shareId:", shareId);

    // Set loading state at the beginning of the effect
    setIsLoading(true);
    console.log("Set isLoading to true at start of effect");

    const fetchItinerary = async () => {
      if (!shareId) {
        if (isMounted) {
          setError("No share ID provided");
          setIsLoading(false);
        }
        return;
      }

      try {
        console.log("Fetching itinerary with share_id:", shareId);

        // Skip edge function due to CORS issues
        let itineraryData = null;

        // If edge function failed, try direct query
        if (!itineraryData) {
          // Fetch the itinerary by share_id
          const { data, error } = await supabase
            .from("itineraries")
            .select("*")
            .eq("share_id", shareId);

          console.log("Direct query result:", { data, error });

          if (error) {
            throw new Error("Failed to fetch itinerary: " + error.message);
          }

          if (!data || data.length === 0) {
            console.log("Throwing Itin Not Found exception 1");
            throw new Error("Itinerary not found");
          }

          // Use the first matching itinerary
          itineraryData = data[0];
          console.log("Found itinerary data:", itineraryData);
          console.log("FOUND ITINERARY DATA ID:", itineraryData.id);
        }

        if (!itineraryData) {
          console.log("Throwing Itin Not Found exception 2");
          throw new Error("Itinerary not found");
        }

        // Check if itinerary is editable
        setIsEditable(itineraryData.is_editable || false);

        // Initialize edited activities with the current activities
        if (itineraryData.itinerary_data && itineraryData.itinerary_data.days) {
          const initialEditedActivities: Record<string, Activity[]> = {};
          itineraryData.itinerary_data.days.forEach(
            (day: ItineraryDay, index: number) => {
              initialEditedActivities[index.toString()] = [...day.activities];
            },
          );
          setEditedActivities(initialEditedActivities);
        }
        console.log("Setting up realtime subscription....");
        // Set up realtime subscription if itinerary is editable
        let channel;
        if (itineraryData.is_editable) {
          try {
            channel = supabase
              .channel(`itinerary-${itineraryData.id}`)
              .on(
                "postgres_changes",
                {
                  event: "UPDATE",
                  schema: "public",
                  table: "itineraries",
                  filter: `id=eq.${itineraryData.id}`,
                },
                (payload) => {
                  console.log("Itinerary updated via realtime:", payload);
                  // Update the itinerary with the new data
                  if (payload.new && payload.new.itinerary_data) {
                    // Force a re-render by creating a completely new object
                    const updatedItinerary = {
                      ...payload.new,
                      user_name: itineraryData.user_name, // Preserve the user name
                    };

                    console.log(
                      "Setting updated itinerary from realtime:",
                      updatedItinerary,
                    );
                    setItinerary(updatedItinerary);

                    // Update edited activities
                    if (payload.new.itinerary_data.days) {
                      const updatedEditedActivities: Record<
                        string,
                        Activity[]
                      > = {};
                      payload.new.itinerary_data.days.forEach(
                        (day: ItineraryDay, index: number) => {
                          updatedEditedActivities[index.toString()] = [
                            ...day.activities,
                          ];
                        },
                      );
                      setEditedActivities(updatedEditedActivities);

                      // Force UI update
                      setTimeout(() => {
                        console.log("Forcing UI update after realtime change");
                        setIsEditing((isEditing) => !isEditing);
                        setIsEditing((isEditing) => !isEditing);

                        // Dispatch event to update planner view
                        const updateEvent = new CustomEvent(
                          "sharedItineraryUpdate",
                          {
                            detail: {
                              itinerary: payload.new.itinerary_data,
                              timestamp: Date.now(),
                            },
                          },
                        );
                        window.dispatchEvent(updateEvent);

                        // Also update localStorage directly to ensure consistency
                        localStorage.setItem(
                          "generatedItinerary",
                          JSON.stringify(payload.new.itinerary_data),
                        );
                        localStorage.setItem(
                          "itineraryUpdate",
                          Date.now().toString(),
                        );
                      }, 100);
                    }
                  }
                },
              )
              .subscribe();
            console.log("Realtime subscription set up successfully");
          } catch (subError) {
            console.error("Error setting up realtime subscription:", subError);
          }
        }
        console.log("Fetching User Data....");
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

        // Ensure we set the itinerary data properly
        console.log("SETTING ITINERARY DATA NOW:", itineraryData.id);
        setItinerary(itineraryData);
        setIsLoading(false);
        console.log("Set itinerary data in state and turned off loading");
      } catch (err: any) {
        console.error("Error fetching shared itinerary:", err);
        if (isMounted) {
          setError(err.message || "Failed to load itinerary");
          console.log("Setting isLoading to false after error");
          setIsLoading(false);
        }
      }

      // Clean up subscription on unmount if channel was created
      return () => {
        if (channel) {
          console.log("Removing channel on cleanup");
          supabase.removeChannel(channel);
        }
      };
    };

    fetchItinerary();
    console.log("After fetchItinerary call");
    return () => {
      isMounted = false;
    };
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

  // Loading state - add a console.log to debug
  console.log("Render state:", {
    isLoading,
    error,
    itinerary: itinerary ? "present" : null,
    shareId,
  });
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Loading itinerary...</h2>
        <p className="text-muted-foreground mb-6">
          Please wait while we retrieve the shared itinerary.
        </p>
        <Button onClick={() => navigate("/")}>Back to Home</Button>
      </div>
    );
  }

  // Show error if we have an explicit error or if loading is complete but no itinerary was found
  console.log("Error or Itinerary?", error, itinerary);
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
          <div className="flex gap-2 mt-4 md:mt-0">
            {isEditable && (
              <Button
                variant={isEditing ? "default" : "outline"}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Save Changes" : "Edit Itinerary"}
              </Button>
            )}
            <Button onClick={handleUseItinerary}>Use This Itinerary</Button>
          </div>
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
                    <div
                      className={`bg-white p-4 rounded-lg border ${isEditing ? "border-blue-300" : "hover:border-blue-200"} transition-colors`}
                    >
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

                      {isEditing && (
                        <div className="mt-2 pt-2 border-t flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Edit activity logic
                              const dayActivities = [
                                ...editedActivities[dayIndex.toString()],
                              ];
                              // Remove this activity
                              dayActivities.splice(actIndex, 1);

                              // Update edited activities
                              const newEditedActivities = {
                                ...editedActivities,
                              };
                              newEditedActivities[dayIndex.toString()] =
                                dayActivities;
                              setEditedActivities(newEditedActivities);

                              // Save changes to database
                              saveChanges(newEditedActivities);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
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
            {isEditable && " • Collaborative editing enabled"}
          </p>
          <div className="flex gap-2">
            {isEditing && (
              <Button
                onClick={() => {
                  setIsEditing(false);
                  // Reset edited activities to original
                  if (
                    itinerary.itinerary_data &&
                    itinerary.itinerary_data.days
                  ) {
                    const resetEditedActivities: Record<string, Activity[]> =
                      {};
                    itinerary.itinerary_data.days.forEach(
                      (day: ItineraryDay, index: number) => {
                        resetEditedActivities[index.toString()] = [
                          ...day.activities,
                        ];
                      },
                    );
                    setEditedActivities(resetEditedActivities);
                  }
                }}
                variant="outline"
              >
                Cancel
              </Button>
            )}
            <Button onClick={handleUseItinerary}>Use This Itinerary</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedItinerary;
