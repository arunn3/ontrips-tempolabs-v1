import React from "react";
import DailySchedule from "./DailySchedule";
import MapView from "./MapView";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Calendar, Filter } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

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
  const [selectedActivity, setSelectedActivity] = React.useState<string>(
    activities[0]?.id,
  );

  const locations: Location[] = activities.map((activity) => ({
    id: activity.id,
    name: activity.title,
    lat: activity.coordinates.lat,
    lng: activity.coordinates.lng,
    type: "attraction",
  }));

  return (
    <div className="flex h-full w-full gap-6 bg-gray-50 p-6">
      <div className="w-[600px] flex flex-col gap-6">
        <Card className="p-4 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h2>
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </Card>

        <ScrollArea className="flex-1">
          <DailySchedule
            activities={activities}
            onReorder={(newActivities) =>
              console.log("Reordered:", newActivities)
            }
            onDelete={(id) => console.log("Delete:", id)}
            onAdd={() => console.log("Add new activity")}
          />
        </ScrollArea>
      </div>

      <div className="flex-1">
        <MapView
          locations={locations}
          selectedLocation={selectedActivity}
          onLocationSelect={setSelectedActivity}
          center={{
            lat: activities[0]?.coordinates.lat || 48.8584,
            lng: activities[0]?.coordinates.lng || 2.2945,
          }}
        />
      </div>
    </div>
  );
};

export default ScheduleView;
