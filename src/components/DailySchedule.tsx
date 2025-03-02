import React from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  Clock,
  GripVertical,
  Plus,
  Trash2,
  MapPin,
  Calendar,
} from "lucide-react";
import { motion, Reorder } from "framer-motion";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

interface Activity {
  id: string;
  time: string;
  title: string;
  duration: string;
  location: string;
  description?: string;
  type?: "attraction" | "meal" | "transport" | "rest";
  coordinates?: {
    lat: number;
    lng: number;
  };
  city?: string;
}

interface DailyScheduleProps {
  activities?: Activity[];
  onReorder?: (activities: Activity[]) => void;
  onDelete?: (id: string) => void;
  onAdd?: () => void;
}

const defaultActivities: Activity[] = [
  {
    id: "1",
    time: "09:00",
    title: "Breakfast at Cafe Central",
    duration: "1h",
    location: "Downtown",
    type: "meal",
    city: "Vienna",
  },
  {
    id: "2",
    time: "10:30",
    title: "City Museum Tour",
    duration: "2h",
    location: "Museum District",
    type: "attraction",
    city: "Vienna",
  },
  {
    id: "3",
    time: "13:00",
    title: "Lunch at Local Market",
    duration: "1.5h",
    location: "Market Square",
    type: "meal",
    city: "Vienna",
  },
];

const DailySchedule = ({
  activities = defaultActivities,
  onReorder = () => {},
  onDelete = () => {},
  onAdd = () => {},
}: DailyScheduleProps) => {
  const [items, setItems] = React.useState(activities);
  const [expandedItems, setExpandedItems] = React.useState<
    Record<string, boolean>
  >({});
  const [showAddDialog, setShowAddDialog] = React.useState(false);

  React.useEffect(() => {
    setItems(activities);
  }, [activities]);

  const handleReorder = (newOrder: Activity[]) => {
    setItems(newOrder);
    onReorder(newOrder);
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const [clickedButtonIndex, setClickedButtonIndex] = React.useState<
    number | null
  >(null);

  const handleAddActivity = (type: "attraction" | "meal" | "rest") => {
    console.log(`Adding new ${type} activity`);

    if (type === "rest" && clickedButtonIndex !== null) {
      // Get the activity directly above the clicked button
      const prevActivityIndex =
        clickedButtonIndex > 0 ? clickedButtonIndex - 1 : 0;
      const prevActivity = sortedActivities[prevActivityIndex];

      // Create a new rest activity
      const newActivity: Activity = {
        id: Date.now().toString(),
        time: calculateTimeForNewActivity(clickedButtonIndex),
        title: "Rest Break",
        duration: "1h",
        location: "Hotel or nearby area",
        type: "rest",
        description: "Take some time to rest and recharge",
        coordinates: prevActivity.coordinates, // Copy coordinates from previous activity
        city: prevActivity.city || "", // Copy city from previous activity
      };

      // Insert the new activity at the right position
      const newItems = [...items];
      newItems.splice(clickedButtonIndex, 0, newActivity);

      // Adjust times of subsequent activities
      const sortedNewItems = [...newItems].sort((a, b) => {
        const timeA = parseInt(a.time.replace(":", ""));
        const timeB = parseInt(b.time.replace(":", ""));
        return timeA - timeB;
      });

      const newActivityIndex = sortedNewItems.findIndex(
        (item) => item.id === newActivity.id,
      );
      const restDuration = getDurationInMinutes(newActivity.duration);

      // Recalculate all activity times after the new one
      let currentTime = newActivity.time;
      let currentDuration = getDurationInMinutes(newActivity.duration);

      // First update the new activity's end time
      let nextStartTime = addTimeToString(currentTime, currentDuration);

      // Then update all subsequent activities
      for (let i = 0; i < newItems.length; i++) {
        const item = newItems[i];

        // Skip activities that come before the new one in time
        if (
          parseInt(item.time.replace(":", "")) <
          parseInt(newActivity.time.replace(":", ""))
        ) {
          continue;
        }

        // Skip the new activity itself
        if (item.id === newActivity.id) {
          continue;
        }

        // Update this activity's start time to be the end time of the previous activity
        newItems[i] = {
          ...item,
          time: nextStartTime,
        };

        // Calculate the end time of this activity for the next one
        nextStartTime = addTimeToString(
          nextStartTime,
          getDurationInMinutes(item.duration),
        );
      }

      setItems(newItems);
      onReorder(newItems);
    } else {
      onAdd();
    }

    setShowAddDialog(false);
    setClickedButtonIndex(null);
  };

  const calculateTimeForNewActivity = (index: number) => {
    // If it's the first activity, use 08:00 as default time
    if (index === 0 || items.length === 0) return "08:00";

    // If it's after the last activity, add 1 hour to the last activity's end time
    if (index >= items.length) {
      const lastActivity = sortedActivities[sortedActivities.length - 1];
      return addTimeToString(
        lastActivity.time,
        getDurationInMinutes(lastActivity.duration),
      );
    }

    // Otherwise, find a time between the two activities
    const prevActivity = sortedActivities[index - 1];
    const nextActivity = sortedActivities[index];

    const prevEndTime = addTimeToString(
      prevActivity.time,
      getDurationInMinutes(prevActivity.duration),
    );
    return prevEndTime;
  };

  const getDurationInMinutes = (duration: string) => {
    // Parse durations like "1h", "1.5h", "30m", etc.
    if (duration.includes("h")) {
      const hours = parseFloat(duration.replace("h", ""));
      return Math.round(hours * 60);
    } else if (duration.includes("m")) {
      return parseInt(duration.replace("m", ""));
    }
    return 60; // Default to 1 hour
  };

  const addTimeToString = (timeStr: string, minutesToAdd: number) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    let totalMinutes = hours * 60 + minutes + minutesToAdd;

    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;

    return `${newHours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`;
  };

  // Sort activities by time
  const sortedActivities = React.useMemo(() => {
    return [...items].sort((a, b) => {
      // Convert time strings to comparable values (e.g., "09:00" to 900, "13:30" to 1330)
      const timeA = parseInt(a.time.replace(":", ""));
      const timeB = parseInt(b.time.replace(":", ""));
      return timeA - timeB;
    });
  }, [items]);

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
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="w-full h-full bg-white p-6 flex flex-col">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <h2 className="text-2xl font-semibold">Daily Schedule</h2>
        <Button
          onClick={() => {
            setClickedButtonIndex(0);
            setShowAddDialog(true);
          }}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Activity
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <TooltipProvider>
          <Reorder.Group
            values={items}
            onReorder={handleReorder}
            className="space-y-1 pb-1"
          >
            {sortedActivities.map((activity, index) => (
              <React.Fragment key={activity.id}>
                {index > 0 && (
                  <div
                    key={`add-button-${index}`}
                    className="flex justify-center"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary/80"
                      onClick={(e) => {
                        e.stopPropagation();
                        setClickedButtonIndex(index);
                        setShowAddDialog(true);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Activity
                    </Button>
                  </div>
                )}
                <Reorder.Item value={activity}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => toggleExpand(activity.id)}
                  >
                    <Card className="p-4 cursor-move bg-white border hover:border-blue-200 transition-colors">
                      <div className="flex items-center gap-4">
                        <Tooltip>
                          <TooltipTrigger>
                            <GripVertical className="w-5 h-5 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Drag to reorder</p>
                          </TooltipContent>
                        </Tooltip>

                        <div className="flex-1">
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
                          <h3 className="font-medium">{activity.title}</h3>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <MapPin className="h-3 w-3" />
                            <span>{activity.location}</span>
                          </div>

                          {expandedItems[activity.id] &&
                            activity.description && (
                              <div className="mt-2 pt-2 border-t text-sm text-gray-600">
                                {activity.description}
                              </div>
                            )}
                        </div>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(activity.id);
                              }}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete activity</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </Card>
                  </motion.div>
                </Reorder.Item>
              </React.Fragment>
            ))}

            {/* Add final button at the end */}
            <div className="flex justify-center mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80"
                onClick={(e) => {
                  e.stopPropagation();
                  setClickedButtonIndex(items.length);
                  setShowAddDialog(true);
                }}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add activity
              </Button>
            </div>
          </Reorder.Group>
        </TooltipProvider>
      </ScrollArea>

      {/* Add Activity Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Activity</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button
              variant="outline"
              className="w-full justify-start p-4 h-auto"
              onClick={() => handleAddActivity("attraction")}
            >
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-blue-500 mr-3"></span>
                <span>Attraction</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start p-4 h-auto"
              onClick={() => handleAddActivity("meal")}
            >
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-green-500 mr-3"></span>
                <span>Meal</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start p-4 h-auto"
              onClick={() => handleAddActivity("rest")}
            >
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-amber-500 mr-3"></span>
                <span>Rest</span>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default DailySchedule;
