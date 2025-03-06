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
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import NearbyAttractionsDialog from "./NearbyAttractionsDialog";
import { useToast } from "./ui/use-toast";

interface Activity {
  id: string;
  time: string;
  title: string;
  duration: string;
  location: string;
  description?: string;
  type?: "attraction" | "meal" | "transport" | "rest" | "accommodation";
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

interface DurationEditorProps {
  duration: string;
  activityId: string;
  activityTime: string;
  onUpdate: (newDuration: string) => void;
}

const DurationEditor: React.FC<DurationEditorProps> = ({
  duration,
  activityId,
  activityTime,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [value, setValue] = React.useState(duration);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleUpdate = () => {
    // Validate the input format
    const isValid = /^\d+(\.\d+)?[hm]$/.test(value);
    if (!isValid) {
      toast({
        title: "Invalid format",
        description: "Please use formats like 1h, 30m, or 1.5h",
        variant: "destructive",
      });
      setValue(duration); // Reset to original value
      return;
    }

    if (value !== duration) {
      onUpdate(value);
    }
    setIsEditing(false);
  };

  return (
    <Popover open={isEditing} onOpenChange={setIsEditing}>
      <PopoverTrigger asChild>
        <span
          className="text-sm text-gray-400 cursor-pointer hover:text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          ({duration})
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-48" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Edit Duration</h4>
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleUpdate();
              } else if (e.key === "Escape") {
                setValue(duration);
                setIsEditing(false);
              }
            }}
            onBlur={handleUpdate}
            placeholder="e.g. 1h, 30m, 1.5h"
            className="h-8"
          />
          <p className="text-xs text-muted-foreground">Format: 1h, 30m, 1.5h</p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

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
  const [showNearbyAttractionsDialog, setShowNearbyAttractionsDialog] =
    React.useState(false);
  const [nearbyAttractions, setNearbyAttractions] = React.useState<any[]>([]);
  const [isLoadingAttractions, setIsLoadingAttractions] = React.useState(false);
  const [currentLocation, setCurrentLocation] = React.useState<{
    lat: number;
    lng: number;
  }>({ lat: 0, lng: 0 });
  const { toast } = useToast();

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

  const fetchNearbyAttractions = async (
    coordinates: { lat: number; lng: number },
    city: string,
  ) => {
    setIsLoadingAttractions(true);
    try {
      // Import the getNearbyAttractions function from gemini.ts
      const { getNearbyAttractions } = await import("../lib/gemini");

      // Call the function to get nearby attractions
      const attractions = await getNearbyAttractions(coordinates, city);
      setNearbyAttractions(attractions);
    } catch (error) {
      console.error("Error fetching nearby attractions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch nearby attractions",
        variant: "destructive",
      });
      setNearbyAttractions([]);
    } finally {
      setIsLoadingAttractions(false);
    }
  };

  const handleAddActivity = (
    type: "attraction" | "meal" | "rest" | "accommodation",
  ) => {
    console.log(`Adding new ${type} activity`);

    if (type === "attraction" && clickedButtonIndex !== null) {
      // Get the activities before and after the clicked button to determine location
      const prevActivityIndex =
        clickedButtonIndex > 0 ? clickedButtonIndex - 1 : 0;
      const nextActivityIndex =
        clickedButtonIndex < sortedActivities.length
          ? clickedButtonIndex
          : sortedActivities.length - 1;

      const prevActivity = sortedActivities[prevActivityIndex];
      const nextActivity = sortedActivities[nextActivityIndex];

      // Use the coordinates from the previous activity as a reference point
      if (prevActivity?.coordinates) {
        setCurrentLocation(prevActivity.coordinates);
        fetchNearbyAttractions(
          prevActivity.coordinates,
          prevActivity.city || "",
        );
      } else if (nextActivity?.coordinates) {
        setCurrentLocation(nextActivity.coordinates);
        fetchNearbyAttractions(
          nextActivity.coordinates,
          nextActivity.city || "",
        );
      } else {
        // If no coordinates available, show error
        toast({
          title: "Error",
          description: "Could not determine location for nearby attractions",
          variant: "destructive",
        });
        return;
      }

      setShowAddDialog(false);
      setShowNearbyAttractionsDialog(true);
      return;
    }

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
      case "accommodation":
        return "bg-indigo-100 text-indigo-800";
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
                            <DurationEditor
                              duration={activity.duration}
                              activityId={activity.id}
                              activityTime={activity.time}
                              onUpdate={(newDuration) => {
                                // Update the activity duration
                                const updatedItems = items.map((item) =>
                                  item.id === activity.id
                                    ? { ...item, duration: newDuration }
                                    : item,
                                );

                                // Recalculate times for all activities after this one
                                const sortedUpdatedItems = [
                                  ...updatedItems,
                                ].sort((a, b) => {
                                  const timeA = parseInt(
                                    a.time.replace(":", ""),
                                  );
                                  const timeB = parseInt(
                                    b.time.replace(":", ""),
                                  );
                                  return timeA - timeB;
                                });

                                const activityIndex =
                                  sortedUpdatedItems.findIndex(
                                    (item) => item.id === activity.id,
                                  );

                                if (activityIndex !== -1) {
                                  let currentTime = activity.time;
                                  let currentDuration =
                                    getDurationInMinutes(newDuration);

                                  // Calculate the end time of the current activity
                                  let nextStartTime = addTimeToString(
                                    currentTime,
                                    currentDuration,
                                  );

                                  // Update all subsequent activities
                                  for (
                                    let i = activityIndex + 1;
                                    i < sortedUpdatedItems.length;
                                    i++
                                  ) {
                                    sortedUpdatedItems[i] = {
                                      ...sortedUpdatedItems[i],
                                      time: nextStartTime,
                                    };

                                    // Calculate the end time of this activity for the next one
                                    nextStartTime = addTimeToString(
                                      nextStartTime,
                                      getDurationInMinutes(
                                        sortedUpdatedItems[i].duration,
                                      ),
                                    );
                                  }
                                }

                                setItems(sortedUpdatedItems);
                                onReorder(sortedUpdatedItems);
                              }}
                            />
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
            <Button
              variant="outline"
              className="w-full justify-start p-4 h-auto"
              onClick={() => handleAddActivity("accommodation")}
            >
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-indigo-500 mr-3"></span>
                <span>Accommodation</span>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nearby Attractions Dialog */}
      <NearbyAttractionsDialog
        open={showNearbyAttractionsDialog}
        onOpenChange={setShowNearbyAttractionsDialog}
        location={currentLocation}
        isLoading={isLoadingAttractions}
        attractions={nearbyAttractions}
        onSelectAttraction={(attraction) => {
          if (clickedButtonIndex === null) return;

          // Get the activity directly above the clicked button for time calculation
          const prevActivityIndex =
            clickedButtonIndex > 0 ? clickedButtonIndex - 1 : 0;
          const prevActivity = sortedActivities[prevActivityIndex];

          // Create a new activity from the selected attraction
          const newActivity: Activity = {
            id: Date.now().toString(),
            time: calculateTimeForNewActivity(clickedButtonIndex),
            title: attraction.name,
            duration: attraction.duration || "1h",
            location: attraction.location,
            type: "attraction",
            description: attraction.description,
            coordinates: currentLocation,
            city: prevActivity.city || "",
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
          setShowNearbyAttractionsDialog(false);
          setClickedButtonIndex(null);
        }}
      />
    </Card>
  );
};

export default DailySchedule;
