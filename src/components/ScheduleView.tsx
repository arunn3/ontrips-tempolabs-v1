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

  React.useEffect(() => {
    try {
      const storedItinerary = localStorage.getItem("generatedItinerary");
      if (storedItinerary) {
        const parsedItinerary = JSON.parse(storedItinerary);
        console.log("Found stored itinerary:", parsedItinerary);

        // Store all days from the itinerary
        if (parsedItinerary.days && parsedItinerary.days.length > 0) {
          setItineraryDays(parsedItinerary.days);

          // Convert the first day's activities to the format expected by DailySchedule
          const firstDay = parsedItinerary.days[0];
          const convertedActivities = firstDay.activities.map(
            (activity, index) => ({
              id: index.toString(),
              time: activity.time,
              title: activity.title,
              duration: activity.duration,
              location: activity.location,
              description: activity.description,
              type: activity.type,
              coordinates: {
                lat: 35.6612 + index * 0.002,
                lng: 139.704 + index * 0.005,
              },
            }),
          );
          setActivitiesList(convertedActivities);
        }
      }
    } catch (error) {
      console.error("Error loading itinerary from localStorage:", error);
    }
  }, []);

  // Function to get coordinates based on location name
  const getCoordinatesForLocation = (locationText: string) => {
    const locationLower = locationText.toLowerCase();

    // City coordinates mapping
    const cityCoordinates: Record<string, { lat: number; lng: number }> = {
      tokyo: { lat: 35.6762, lng: 139.6503 },
      kyoto: { lat: 35.0116, lng: 135.7681 },
      osaka: { lat: 34.6937, lng: 135.5023 },
      "new york": { lat: 40.7128, lng: -74.006 },
      london: { lat: 51.5074, lng: -0.1278 },
      paris: { lat: 48.8566, lng: 2.3522 },
      rome: { lat: 41.9028, lng: 12.4964 },
      sydney: { lat: -33.8688, lng: 151.2093 },
      barcelona: { lat: 41.3851, lng: 2.1734 },
      amsterdam: { lat: 52.3676, lng: 4.9041 },
      berlin: { lat: 52.52, lng: 13.405 },
      venice: { lat: 45.4408, lng: 12.3155 },
      florence: { lat: 43.7696, lng: 11.2558 },
      milan: { lat: 45.4642, lng: 9.19 },
    };

    // Check if any city name is in the location text
    for (const [city, coords] of Object.entries(cityCoordinates)) {
      if (locationLower.includes(city)) {
        // Add a small random offset to prevent markers from stacking exactly
        return {
          lat: coords.lat + (Math.random() - 0.5) * 0.01,
          lng: coords.lng + (Math.random() - 0.5) * 0.01,
        };
      }
    }

    // Default to Tokyo with random offset if no match
    return {
      lat: 35.6762 + (Math.random() - 0.5) * 0.02,
      lng: 139.6503 + (Math.random() - 0.5) * 0.02,
    };
  };

  // Function to change the selected day
  const handleDayChange = (dayIndex: number) => {
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

      const convertedActivities = dayData.activities.map((activity, index) => {
        // Get coordinates based on the activity location or title
        const locationText = activity.location || activity.title || "";
        const coordinates = getCoordinatesForLocation(locationText);

        return {
          id: index.toString(),
          time: activity.time,
          title: activity.title,
          duration: activity.duration,
          location: activity.location,
          description: activity.description,
          type: activity.type,
          coordinates: {
            lat: activity.coordinates?.lat || coordinates.lat,
            lng: activity.coordinates?.lng || coordinates.lng,
          },
        };
      });

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
      activity.title.toLowerCase().includes("rest") ||
      activity.title.toLowerCase().includes("accommodation")
    ) {
      type = "hotel";
    }

    return {
      id: activity.id,
      name: activity.title,
      lat: activity.coordinates.lat,
      lng: activity.coordinates.lng,
      type,
    };
  });

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
        className="w-full flex-1 flex flex-row overflow-hidden"
      >
        <TabsList className="flex-shrink-0 flex-col h-auto mr-4 p-1">
          <TabsTrigger
            value="schedule"
            className="flex items-center gap-2 justify-start w-full mb-1"
          >
            <List className="h-4 w-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger
            value="map"
            className="flex items-center gap-2 justify-start w-full"
          >
            <Map className="h-4 w-4" />
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
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScheduleView;
