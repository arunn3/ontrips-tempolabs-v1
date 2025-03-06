import React from "react";
import DailySchedule from "./DailySchedule";
import MapView from "./MapView";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Calendar, Filter, Map, List } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

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
  const [selectedDay, setSelectedDay] = React.useState(0);
  const [itineraryDays, setItineraryDays] = React.useState<any[]>([]);
  const [activeTab, setActiveTab] = React.useState("schedule");
  const [isGeneratingItinerary, setIsGeneratingItinerary] =
    React.useState(false);
  const [generationProgress, setGenerationProgress] = React.useState(0);

  React.useEffect(() => {
    // Define the event handler function
    const handleItineraryUpdate = (event: CustomEvent) => {
      console.log("Itinerary update event received:", event.detail);

      if (event.detail.status === "generating") {
        // Clear current itinerary and show progress
        setActivitiesList([]);
        setItineraryDays([]);
        setActiveTab("schedule"); // Force switch to schedule tab to show progress
        setIsGeneratingItinerary(true);
        setGenerationProgress(event.detail.progress || 0);
      } else if (event.detail.status === "complete") {
        // Itinerary generation complete
        setIsGeneratingItinerary(false);
        setGenerationProgress(100);
        setActiveTab("schedule"); // Ensure we're on the schedule tab

        // If the event contains an itinerary directly, use it
        if (event.detail.itinerary) {
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
          // Use the function directly instead of the reference
          const loadStoredItinerary = async () => {
            try {
              const storedItinerary =
                localStorage.getItem("generatedItinerary");
              if (storedItinerary) {
                const parsedItinerary = JSON.parse(storedItinerary);
                console.log("Found stored itinerary:", parsedItinerary);

                // Store all days from the itinerary
                if (parsedItinerary.days && parsedItinerary.days.length > 0) {
                  setItineraryDays(parsedItinerary.days);

                  // Import location service
                  const locationServiceModule = await import(
                    "../lib/locationService"
                  );

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
                }
              }
            } catch (error) {
              console.error(
                "Error loading itinerary from localStorage:",
                error,
              );
            }
          };
          loadStoredItinerary();
        }
      } else if (event.detail.status === "error") {
        // Error in itinerary generation
        setIsGeneratingItinerary(false);
      } else if (event.detail.status === "clear") {
        // Clear the itinerary
        setActivitiesList([]);
        setItineraryDays([]);
      } else if (event.detail.itinerary) {
        // If the event contains an itinerary directly, use it
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
                const locationServiceModule = await import(
                  "../lib/locationService"
                );

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
              }
            }
          } catch (error) {
            console.error("Error loading itinerary from localStorage:", error);
          }
        };
        loadStoredItinerary();
      }
    };

    window.addEventListener(
      "itineraryUpdated",
      handleItineraryUpdate as EventListener,
    );

    // Clean up event listener
    return () => {
      window.removeEventListener(
        "itineraryUpdated",
        handleItineraryUpdate as EventListener,
      );
    };
  }, []);

  // This useEffect is for initial load and URL changes
  React.useEffect(() => {
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
            const locationServiceModule = await import(
              "../lib/locationService"
            );

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
          }
        }
      } catch (error) {
        console.error("Error loading itinerary from localStorage:", error);
      }
    };
    loadStoredItinerary();
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
    <div className="h-[calc(100vh-120px)] w-full bg-gray-50 p-6 flex flex-col overflow-hidden">
      <Card className="p-4 bg-white mb-6 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold">
              {itineraryDays.length > 0 && itineraryDays[selectedDay]
                ? itineraryDays[selectedDay].date
                : selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {itineraryDays.length > 0 && (
              <ScrollArea className="w-full">
                <div className="flex gap-1 p-1">
                  {itineraryDays.map((day, index) => (
                    <Button
                      key={index}
                      variant={selectedDay === index ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleDayChange(index)}
                      className="whitespace-nowrap"
                    >
                      Day {index + 1}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            )}
            <div className="flex-shrink-0">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
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
        <TabsList className="flex-shrink-0 mb-4 p-1 self-start">
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Map
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="flex-1 h-full overflow-hidden">
          {isGeneratingItinerary ? (
            <div className="flex flex-col items-center justify-center h-full p-8 space-y-4">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium">
                  Generating your itinerary...
                </h3>
                <p className="text-sm text-muted-foreground">
                  This may take a minute or two
                </p>
              </div>
              <div className="w-full max-w-md">
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 ease-in-out"
                    style={{ width: `${generationProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-center mt-2 text-muted-foreground">
                  {generationProgress}% complete
                </p>
              </div>
            </div>
          ) : (
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
            />
          )}
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
