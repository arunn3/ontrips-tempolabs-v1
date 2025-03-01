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
    title: "Breakfast at Cafe Central",
    duration: "1h",
    location: "Downtown",
    coordinates: { lat: 48.8584, lng: 2.2945 },
  },
  {
    id: "2",
    time: "10:30",
    title: "City Museum Tour",
    duration: "2h",
    location: "Museum District",
    coordinates: { lat: 48.8606, lng: 2.3376 },
  },
  {
    id: "3",
    time: "13:00",
    title: "Lunch at Local Market",
    duration: "1.5h",
    location: "Market Square",
    coordinates: { lat: 48.8566, lng: 2.3522 },
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
                lat: 48.8584 + index * 0.002,
                lng: 2.2945 + index * 0.005,
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

  // Function to change the selected day
  const handleDayChange = (dayIndex: number) => {
    if (itineraryDays.length > dayIndex) {
      setSelectedDay(dayIndex);
      const dayData = itineraryDays[dayIndex];
      const convertedActivities = dayData.activities.map((activity, index) => ({
        id: index.toString(),
        time: activity.time,
        title: activity.title,
        duration: activity.duration,
        location: activity.location,
        description: activity.description,
        type: activity.type,
        coordinates: {
          lat: 48.8584 + index * 0.002,
          lng: 2.2945 + index * 0.005,
        },
      }));
      setActivitiesList(convertedActivities);
    }
  };

  const [activitiesList, setActivitiesList] = React.useState(activities);
  const [selectedActivity, setSelectedActivity] = React.useState<string>(
    activitiesList[0]?.id,
  );

  const locations: Location[] = activitiesList.map((activity) => ({
    id: activity.id,
    name: activity.title,
    lat: activity.coordinates.lat,
    lng: activity.coordinates.lng,
    type: "attraction",
  }));

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
        <TabsList className="mb-4 flex-shrink-0">
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Map
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="schedule"
          className="flex-1 h-[calc(100%-60px)] overflow-hidden"
        >
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

        <TabsContent
          value="map"
          className="flex-1 h-[calc(100%-60px)] overflow-hidden"
        >
          <MapView
            locations={locations}
            selectedLocation={selectedActivity}
            onLocationSelect={setSelectedActivity}
            center={{
              lat: activitiesList[0]?.coordinates.lat || 48.8584,
              lng: activitiesList[0]?.coordinates.lng || 2.2945,
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScheduleView;
