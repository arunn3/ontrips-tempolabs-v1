import React from "react";
import DailySchedule from "./DailySchedule";
import MapView from "./MapView";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Calendar, Filter, Map, List } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useItinerary } from "@/context/ItineraryContext";

interface Activity {
  id: string;
  time: string;
  title: string;
  duration: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: "attraction" | "restaurant" | "hotel";
}

interface ScheduleViewProps {
  activities?: Activity[];
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

const defaultActivities: Activity[] = [
  {
    id: "1",
    time: "09:00",
    title: "Breakfast at Tokyo Cafe",
    duration: "1h",
    location: "Shibuya, Tokyo",
    coordinates: { lat: 35.6612, lng: 139.704 },
  },
  {
    id: "2",
    time: "10:30",
    title: "Tokyo National Museum Tour",
    duration: "2h",
    location: "Ueno, Tokyo",
    coordinates: { lat: 35.7188, lng: 139.7765 },
  },
  {
    id: "3",
    time: "13:00",
    title: "Lunch at Tsukiji Market",
    duration: "1.5h",
    location: "Tsukiji, Tokyo",
    coordinates: { lat: 35.6654, lng: 139.7707 },
  },
];

const ScheduleView: React.FC<ScheduleViewProps> = ({
  activities = defaultActivities,
  selectedDate = new Date(),
  onDateChange = () => {},
}) => {
  // Check if there's an itinerary in localStorage
  const {
    itinerary,
    isGenerating: contextIsGenerating,
    generationProgress: contextGenerationProgress,
  } = useItinerary();
  const [selectedDay, setSelectedDay] = React.useState(0);
  const [itineraryDays, setItineraryDays] = React.useState<any[]>([]);
  const [activeTab, setActiveTab] = React.useState("schedule");

  // Use values from context with local state as fallback
  const [localIsGenerating, setLocalIsGenerating] = React.useState(false);
  const [localGenerationProgress, setLocalGenerationProgress] =
    React.useState(0);

  // Combine context values with local state
  const isGeneratingItinerary = contextIsGenerating || localIsGenerating;
  const generationProgress = contextIsGenerating
    ? contextGenerationProgress
    : localGenerationProgress;

  // Define loadStoredItinerary function outside of useEffect
  const loadStoredItinerary = async () => {
    try {
      const storedItinerary = localStorage.getItem("generatedItinerary");
      if (storedItinerary) {
        const parsedItinerary = JSON.parse(storedItinerary);
        console.log("Found stored itinerary:", parsedItinerary);

        // Store all days from the itinerary
        if (parsedItinerary.days && parsedItinerary.days.length > 0) {
          setItineraryDays(parsedItinerary.days);

          // Import location service
          const locationServiceModule = await import("../lib/locationService");

          // Convert the first day's activities to the format expected by DailySchedule
          const firstDay = parsedItinerary.days[0];
          const convertedActivities = await Promise.all(
            firstDay.activities.map(async (activity, index) => {
              // Determine coordinates
              let coordinates;
              if (activity.lat && activity.long) {
                coordinates = {
                  lat: parseFloat(activity.lat),
                  lng: parseFloat(activity.long),
                };
              } else {
                // Query the database for coordinates
                const locationText = activity.location || activity.title || "";
                coordinates =
                  await locationServiceModule.getCoordinatesForLocation(
                    locationText,
                  );
              }

              return {
                id: index.toString(),
                time: activity.time,
                title: activity.title,
                duration: activity.duration,
                location: activity.location,
                description: activity.description,
                type: activity.type,
                coordinates: coordinates,
                city: activity.city || "",
              };
            }),
          );
          setActivitiesList(convertedActivities);
        }
      }
    } catch (error) {
      console.error("Error loading itinerary from localStorage:", error);
    }
  };

  React.useEffect(() => {
    // Define the event handler function
    const handleItineraryUpdate = (event: any) => {
      // Make the handler available globally for direct calls
      window.handleItineraryUpdateGlobal = handleItineraryUpdate;
      console.log("Itinerary update event received:", event.detail);
      console.log("Event detail type:", typeof event.detail);
      console.log("Event detail keys:", Object.keys(event.detail));

      if (event.detail.status === "generating") {
        // Clear current itinerary and show progress
        setActivitiesList([]);
        setItineraryDays([]);
        setActiveTab("schedule"); // Force switch to schedule tab to show progress
        setLocalIsGenerating(true);
        setLocalGenerationProgress(event.detail.progress || 0);
      } else if (event.detail.status === "complete") {
        // Itinerary generation complete
        setLocalIsGenerating(false);
        setLocalGenerationProgress(100);
        setActiveTab("schedule"); // Ensure we're on the schedule tab

        // If the event contains an itinerary directly, use it
        if (event.detail.itinerary) {
          console.log(
            "Found itinerary in event.detail:",
            event.detail.itinerary,
          );
          const itinerary = event.detail.itinerary;
          setItineraryDays(itinerary.days);

          // Process the first day's activities
          if (itinerary.days && itinerary.days.length > 0) {
            const firstDay = itinerary.days[0];
            const processActivities = async () => {
              try {
                const locationServiceModule = await import(
                  "../lib/locationService"
                );

                const convertedActivities = await Promise.all(
                  firstDay.activities.map(async (activity, index) => {
                    // Determine coordinates
                    let coordinates;
                    if (activity.lat && activity.long) {
                      coordinates = {
                        lat: parseFloat(activity.lat),
                        lng: parseFloat(activity.long),
                      };
                    } else {
                      // Query the database for coordinates
                      const locationText =
                        activity.location || activity.title || "";
                      coordinates =
                        await locationServiceModule.getCoordinatesForLocation(
                          locationText,
                        );
                    }

                    return {
                      id: index.toString(),
                      time: activity.time,
                      title: activity.title,
                      duration: activity.duration,
                      location: activity.location,
                      description: activity.description,
                      type: activity.type,
                      coordinates: coordinates,
                      city: activity.city || "",
                    };
                  }),
                );
                setActivitiesList(convertedActivities);
              } catch (error) {
                console.error("Error processing activities:", error);
              }
            };
            processActivities();
          }
        } else {
          // Use the loadStoredItinerary function defined above
          loadStoredItinerary();
        }
      } else if (event.detail.status === "error") {
        // Error in itinerary generation
        setLocalIsGenerating(false);
      } else if (event.detail.status === "clear") {
        // Clear the itinerary
        setActivitiesList([]);
        setItineraryDays([]);
      } else if (event.detail.itinerary) {
        // If the event contains an itinerary directly, use it
        console.log(
          "Found itinerary in event.detail (else if branch):",
          event.detail.itinerary,
        );
        const itinerary = event.detail.itinerary;
        setItineraryDays(itinerary.days);
        setActiveTab("schedule"); // Switch to schedule tab to show the new itinerary

        // Process the first day's activities
        if (itinerary.days && itinerary.days.length > 0) {
          const firstDay = itinerary.days[0];
          const processActivities = async () => {
            try {
              const locationServiceModule = await import(
                "../lib/locationService"
              );

              const convertedActivities = await Promise.all(
                firstDay.activities.map(async (activity, index) => {
                  // Determine coordinates
                  let coordinates;
                  if (activity.lat && activity.long) {
                    coordinates = {
                      lat: parseFloat(activity.lat),
                      lng: parseFloat(activity.long),
                    };
                  } else {
                    // Query the database for coordinates
                    const locationText =
                      activity.location || activity.title || "";
                    coordinates =
                      await locationServiceModule.getCoordinatesForLocation(
                        locationText,
                      );
                  }

                  return {
                    id: index.toString(),
                    time: activity.time,
                    title: activity.title,
                    duration: activity.duration,
                    location: activity.location,
                    description: activity.description,
                    type: activity.type,
                    coordinates: coordinates,
                    city: activity.city || "",
                  };
                }),
              );
              setActivitiesList(convertedActivities);
            } catch (error) {
              console.error("Error processing activities:", error);
            }
          };
          processActivities();
        }
      } else {
        // Default case - just load the itinerary
        loadStoredItinerary();
      }
    };

    // Use a direct function reference without casting
    window.addEventListener("itineraryUpdated", handleItineraryUpdate);

    // Clean up event listener
    return () => {
      window.removeEventListener("itineraryUpdated", handleItineraryUpdate);
    };
  }, []);

  // This useEffect is for initial load and URL changes
  React.useEffect(() => {
    // Check for itineraryUpdate flag in localStorage every second
    const checkForUpdates = setInterval(() => {
      const itineraryUpdateFlag = localStorage.getItem("itineraryUpdate");
      if (itineraryUpdateFlag) {
        console.log("Detected itinerary update flag, reloading itinerary");
        loadStoredItinerary();
        // Clear the flag after processing
        localStorage.removeItem("itineraryUpdate");
      }
    }, 1000);

    // Cleanup interval
    return () => clearInterval(checkForUpdates);
  }, []);

  // Additional useEffect for initial load and event listeners
  React.useEffect(() => {
    // Call the loadStoredItinerary function defined above
    loadStoredItinerary();

    // Also check for the itineraryUpdate flag in localStorage
    const itineraryUpdateFlag = localStorage.getItem("itineraryUpdate");
    if (itineraryUpdateFlag) {
      console.log("Detected itinerary update flag, reloading itinerary");
      loadStoredItinerary();
      // Clear the flag after processing
      localStorage.removeItem("itineraryUpdate");
    }

    // Add event listener for the custom itineraryChanged event
    const handleItineraryChanged = () => {
      console.log("Received itineraryChanged event, reloading itinerary");
      loadStoredItinerary();
    };

    document.addEventListener("itineraryChanged", handleItineraryChanged);

    return () => {
      document.removeEventListener("itineraryChanged", handleItineraryChanged);
    };
  }, [window.location.search, activeTab]); // Re-run when URL search params or active tab changes

  // Import the location service
  const [locationService, setLocationService] = React.useState<any>(null);

  React.useEffect(() => {
    // Dynamically import the location service
    import("../lib/locationService").then((module) => {
      setLocationService(module);
    });
  }, []);

  // Function to change the selected day
  const handleDayChange = async (dayIndex: number) => {
    if (itineraryDays.length > dayIndex) {
      setSelectedDay(dayIndex);
      const dayData = itineraryDays[dayIndex];

      // Extract city from the day's activities to center the map
      let dayCity = "";
      if (dayData.activities && dayData.activities.length > 0) {
        // Try to find a city name in the first few activities
        for (let i = 0; i < Math.min(3, dayData.activities.length); i++) {
          const activity = dayData.activities[i];
          const locationText = activity.location || activity.title || "";

          // Common city extraction logic - look for text after commas
          const parts = locationText.split(",");
          if (parts.length > 1) {
            dayCity = parts[parts.length - 1].trim();
            break;
          }
        }
      }

      const convertedActivities = await Promise.all(
        dayData.activities.map(async (activity, index) => {
          // Use coordinates from the activity if available
          let coordinates;

          if (activity.lat && activity.long) {
            // Use coordinates directly from the API response
            coordinates = {
              lat: parseFloat(activity.lat),
              lng: parseFloat(activity.long),
            };
          } else if (activity.coordinates?.lat && activity.coordinates?.lng) {
            // Use coordinates from the coordinates object if available
            coordinates = {
              lat: activity.coordinates.lat,
              lng: activity.coordinates.lng,
            };
          } else {
            // Query the database for coordinates based on location text
            const locationText = activity.location || activity.title || "";
            coordinates = locationService
              ? await locationService.getCoordinatesForLocation(locationText)
              : {
                  lat: 35.6762 + (Math.random() - 0.5) * 0.02,
                  lng: 139.6503 + (Math.random() - 0.5) * 0.02,
                };
          }

          return {
            id: index.toString(),
            time: activity.time,
            title: activity.title,
            duration: activity.duration,
            location: activity.location,
            description: activity.description,
            type: activity.type,
            coordinates: coordinates,
            city: activity.city || dayCity,
          };
        }),
      );

      setActivitiesList(convertedActivities);
    }
  };

  const [activitiesList, setActivitiesList] = React.useState(activities);
  const [selectedActivity, setSelectedActivity] = React.useState<string>(
    activitiesList[0]?.id,
  );

  const locations: Location[] = activitiesList.map((activity) => {
    // Determine the type based on the activity title or type
    let type: "attraction" | "restaurant" | "hotel" = "attraction";
    if (activity.type) {
      if (activity.type === "meal") type = "restaurant";
      else if (activity.type === "rest") type = "hotel";
    } else if (
      activity.title.toLowerCase().includes("breakfast") ||
      activity.title.toLowerCase().includes("lunch") ||
      activity.title.toLowerCase().includes("dinner") ||
      activity.title.toLowerCase().includes("cafe") ||
      activity.title.toLowerCase().includes("restaurant")
    ) {
      type = "restaurant";
    } else if (
      activity.title.toLowerCase().includes("hotel") ||
      activity.title.toLowerCase().includes("resort") ||
      activity.title.toLowerCase().includes("check-in") ||
      activity.title.toLowerCase().includes("accommodation") ||
      activity.type === "accommodation"
    ) {
      type = "hotel";
    }

    return {
      id: activity.id,
      name: activity.title,
      lat: activity.coordinates?.lat || 0,
      lng: activity.coordinates?.lng || 0,
      type,
    };
  });

  // Removed loadItinerary function as it's now inlined in the useEffects

  return (
    <div className="h-[calc(100vh-120px)] w-full bg-gray-50 p-1 sm:p-4 md:p-6 flex flex-col overflow-hidden">
      <Card className="p-2 sm:p-4 bg-white mb-2 sm:mb-6 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <h2 className="text-base sm:text-lg font-semibold truncate">
              {itineraryDays.length > 0 && itineraryDays[selectedDay]
                ? itineraryDays[selectedDay].date
                : selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
            </h2>
          </div>
          <div className="flex flex-col gap-2 sm:gap-3">
            {itineraryDays.length > 0 && (
              <ScrollArea className="w-full">
                <div className="flex gap-1 py-1 overflow-x-auto max-w-full">
                  {itineraryDays.map((day, index) => (
                    <Button
                      key={index}
                      variant={selectedDay === index ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleDayChange(index)}
                      className="whitespace-nowrap text-xs sm:text-sm px-1.5 sm:px-3 py-1 sm:py-2"
                    >
                      Day {index + 1}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            )}
            <div className="flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm"
              >
                <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="flex-shrink-0 mb-2 sm:mb-4 p-1 self-start">
          <TabsTrigger
            value="schedule"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <List className="h-3 w-3 sm:h-4 sm:w-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger
            value="map"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <Map className="h-3 w-3 sm:h-4 sm:w-4" />
            Map
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="flex-1 h-full overflow-hidden">
          <DailySchedule
            activities={activitiesList}
            onReorder={(newActivities) => {
              console.log("Reordered:", newActivities);
              setActivitiesList(newActivities);
            }}
            onDelete={(id) => {
              console.log("Delete:", id);
              setActivitiesList(activitiesList.filter((a) => a.id !== id));
            }}
            onAdd={() => console.log("Add new activity")}
            isGenerating={isGeneratingItinerary}
            generationProgress={generationProgress}
          />
        </TabsContent>

        <TabsContent value="map" className="flex-1 h-full overflow-hidden">
          <MapView
            locations={locations}
            selectedLocation={selectedActivity}
            onLocationSelect={setSelectedActivity}
            center={{
              lat: locations[0]?.lat || 35.6612,
              lng: locations[0]?.lng || 139.704,
            }}
            mapProvider="openstreetmap"
            onProviderChange={(provider) =>
              console.log(`Map provider changed to ${provider}`)
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScheduleView;
