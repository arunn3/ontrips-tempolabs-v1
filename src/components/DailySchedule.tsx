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
  Globe,
  Users,
  Share2,
  Copy,
  Mail,
  Check,
  Edit,
  Lock,
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
import { supabase } from "@/lib/supabase";

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
  isGenerating?: boolean;
  generationProgress?: number;
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
  isGenerating = false,
  generationProgress = 0,
}: DailyScheduleProps) => {
  const [items, setItems] = React.useState(activities);
  const [expandedItems, setExpandedItems] = React.useState<
    Record<string, boolean>
  >({});
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [showNearbyAttractionsDialog, setShowNearbyAttractionsDialog] =
    React.useState(false);
  const [showPublicPrivateDialog, setShowPublicPrivateDialog] =
    React.useState(false);
  const [showShareDialog, setShowShareDialog] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState("");
  const [recipientEmail, setRecipientEmail] = React.useState("");
  const [isCopied, setIsCopied] = React.useState(false);
  const [isSendingEmail, setIsSendingEmail] = React.useState(false);
  const [nearbyAttractions, setNearbyAttractions] = React.useState<any[]>([]);
  const [isLoadingAttractions, setIsLoadingAttractions] = React.useState(false);
  const [currentLocation, setCurrentLocation] = React.useState<{
    lat: number;
    lng: number;
  }>({ lat: 0, lng: 0 });
  const [hasChanges, setHasChanges] = React.useState(false);
  const [originalActivities, setOriginalActivities] = React.useState<
    Activity[]
  >([]);
  const [isEditable, setIsEditable] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    setItems(activities);
    // Store original activities for comparison to detect changes
    if (activities.length > 0 && originalActivities.length === 0) {
      setOriginalActivities([...activities]);
    }
  }, [activities]);

  // Check for changes whenever items are updated
  React.useEffect(() => {
    if (originalActivities.length === 0) return;

    // Compare current items with original activities
    const hasChanged = () => {
      if (items.length !== originalActivities.length) return true;

      return items.some((item, index) => {
        const original = originalActivities[index];
        if (!original) return true;

        return (
          item.time !== original.time ||
          item.title !== original.title ||
          item.duration !== original.duration ||
          item.location !== original.location
        );
      });
    };

    setHasChanges(hasChanged());
  }, [items, originalActivities]);

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
    <Card className="w-full h-full bg-white p-2 sm:p-4 md:p-6 flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-2 sm:mb-4 flex-shrink-0">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">
          Daily Schedule
        </h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowPublicPrivateDialog(true)}
            size="sm"
            className="text-xs sm:text-sm"
            disabled={!hasChanges}
            variant="default"
          >
            Save Itinerary
          </Button>
          <Button
            onClick={() => setShowShareDialog(true)}
            size="sm"
            className="text-xs sm:text-sm"
            variant="outline"
          >
            <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Share
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <TooltipProvider>
          <Reorder.Group
            values={items}
            onReorder={handleReorder}
            className="space-y-1 pb-1"
          >
            {sortedActivities.map((activity, index) => (
              <div key={activity.id} className="space-y-1">
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
                    <Card className="p-3 sm:p-4 cursor-move bg-white border hover:border-blue-200 transition-colors">
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
              </div>
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

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Itinerary</DialogTitle>
          </DialogHeader>
          {!shareUrl ? (
            <div className="py-4">
              <p className="mb-4">
                How would you like to share this itinerary?
              </p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <h3 className="text-sm font-medium col-span-2">Share Type</h3>
                <Button
                  variant="outline"
                  className="p-4 h-auto flex flex-col items-center justify-center gap-2 text-center"
                  onClick={async () => {
                    try {
                      // Get current user
                      const { data: userData } = await supabase.auth.getUser();
                      if (!userData?.user) {
                        toast({
                          title: "Error",
                          description:
                            "You must be signed in to share an itinerary",
                          variant: "destructive",
                        });
                        setShowShareDialog(false);
                        return;
                      }

                      // Get the current destination from localStorage
                      const storedDestination = localStorage.getItem(
                        "selectedDestination",
                      );
                      if (!storedDestination) {
                        toast({
                          title: "Error",
                          description: "No destination found",
                          variant: "destructive",
                        });
                        setShowShareDialog(false);
                        return;
                      }

                      const destination = JSON.parse(storedDestination);

                      // Get the current itinerary data from localStorage
                      const storedItinerary =
                        localStorage.getItem("generatedItinerary");
                      let itineraryData;

                      if (storedItinerary) {
                        // Use the full multi-day itinerary if available
                        itineraryData = JSON.parse(storedItinerary);

                        // Update the current day's activities
                        if (
                          itineraryData.days &&
                          itineraryData.days.length > 0
                        ) {
                          itineraryData.days[0].activities = items.map(
                            (item) => ({
                              time: item.time,
                              title: item.title,
                              duration: item.duration,
                              location: item.location,
                              description: item.description || "",
                              type: item.type || "attraction",
                            }),
                          );
                        }
                      } else {
                        // Create a new single-day itinerary if none exists
                        itineraryData = {
                          days: [
                            {
                              date: new Date().toISOString().split("T")[0],
                              activities: items.map((item) => ({
                                time: item.time,
                                title: item.title,
                                duration: item.duration,
                                location: item.location,
                                description: item.description || "",
                                type: item.type || "attraction",
                              })),
                            },
                          ],
                        };
                      }

                      // Generate a unique ID for the share URL
                      const shareId = crypto.randomUUID();

                      // Save to database as private with share ID
                      const { data, error } = await supabase
                        .from("itineraries")
                        .insert({
                          user_id: userData.user.id,
                          destination: destination.title,
                          summary: `${items.length} activities in ${destination.title}`,
                          total_activities: items.length,
                          estimated_cost: destination.priceRange || "Varies",
                          is_public: false,
                          itinerary_data: itineraryData,
                          criteria_id: null,
                          share_id: shareId,
                          share_status: "shared",
                          is_editable: false,
                        });

                      if (error) throw error;

                      // Wait a moment to ensure the data is saved
                      await new Promise((resolve) => setTimeout(resolve, 500));

                      // Verify the itinerary was saved
                      const { data: verifyData, error: verifyError } =
                        await supabase
                          .from("itineraries")
                          .select("id")
                          .eq("share_id", shareId)
                          .single();

                      if (verifyError || !verifyData) {
                        throw new Error("Failed to verify itinerary was saved");
                      }

                      // Create share URL
                      const shareUrl = `${window.location.origin}/shared-itinerary/${shareId}`;
                      setShareUrl(shareUrl);

                      toast({
                        title: "Success",
                        description: "Read-only share link created",
                      });
                    } catch (error) {
                      console.error("Error creating share link:", error);
                      toast({
                        title: "Error",
                        description: "Failed to create share link",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Lock className="h-8 w-8 text-gray-500" />
                  <span className="font-medium">Read-Only Link</span>
                  <span className="text-xs text-muted-foreground truncate w-full">
                    Viewers can't edit the itinerary
                  </span>
                </Button>

                <Button
                  variant="outline"
                  className="p-4 h-auto flex flex-col items-center justify-center gap-2 text-center"
                  onClick={async () => {
                    try {
                      // Get current user
                      const { data: userData } = await supabase.auth.getUser();
                      if (!userData?.user) {
                        toast({
                          title: "Error",
                          description:
                            "You must be signed in to share an itinerary",
                          variant: "destructive",
                        });
                        setShowShareDialog(false);
                        return;
                      }

                      // Get the current destination from localStorage
                      const storedDestination = localStorage.getItem(
                        "selectedDestination",
                      );
                      if (!storedDestination) {
                        toast({
                          title: "Error",
                          description: "No destination found",
                          variant: "destructive",
                        });
                        setShowShareDialog(false);
                        return;
                      }

                      const destination = JSON.parse(storedDestination);

                      // Get the current itinerary data from localStorage
                      const storedItinerary =
                        localStorage.getItem("generatedItinerary");
                      let itineraryData;

                      if (storedItinerary) {
                        // Use the full multi-day itinerary if available
                        itineraryData = JSON.parse(storedItinerary);

                        // Update the current day's activities
                        if (
                          itineraryData.days &&
                          itineraryData.days.length > 0
                        ) {
                          itineraryData.days[0].activities = items.map(
                            (item) => ({
                              time: item.time,
                              title: item.title,
                              duration: item.duration,
                              location: item.location,
                              description: item.description || "",
                              type: item.type || "attraction",
                            }),
                          );
                        }
                      } else {
                        // Create a new single-day itinerary if none exists
                        itineraryData = {
                          days: [
                            {
                              date: new Date().toISOString().split("T")[0],
                              activities: items.map((item) => ({
                                time: item.time,
                                title: item.title,
                                duration: item.duration,
                                location: item.location,
                                description: item.description || "",
                                type: item.type || "attraction",
                              })),
                            },
                          ],
                        };
                      }

                      // Generate a unique ID for the share URL
                      const shareId = crypto.randomUUID();

                      // Save to database as shared with share ID
                      const { data, error } = await supabase
                        .from("itineraries")
                        .insert({
                          user_id: userData.user.id,
                          destination: destination.title,
                          summary: `${items.length} activities in ${destination.title}`,
                          total_activities: items.length,
                          estimated_cost: destination.priceRange || "Varies",
                          is_public: false,
                          itinerary_data: itineraryData,
                          criteria_id: null,
                          share_id: shareId,
                          share_status: "shared",
                          is_editable: true,
                        });

                      if (error) throw error;

                      // Wait a moment to ensure the data is saved
                      await new Promise((resolve) => setTimeout(resolve, 500));

                      // Verify the itinerary was saved
                      const { data: verifyData, error: verifyError } =
                        await supabase
                          .from("itineraries")
                          .select("id")
                          .eq("share_id", shareId)
                          .single();

                      if (verifyError || !verifyData) {
                        throw new Error("Failed to verify itinerary was saved");
                      }

                      // Create share URL
                      const shareUrl = `${window.location.origin}/shared-itinerary/${shareId}`;
                      setShareUrl(shareUrl);

                      toast({
                        title: "Success",
                        description: "Collaborative editing link created",
                      });
                    } catch (error) {
                      console.error("Error creating share link:", error);
                      toast({
                        title: "Error",
                        description: "Failed to create share link",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Edit className="h-8 w-8 text-gray-500" />
                  <span className="font-medium">Editable Link</span>
                  <span className="text-xs text-muted-foreground truncate w-full">
                    Collaborators can edit in realtime
                  </span>
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <h3 className="text-sm font-medium">Visibility</h3>
                <Button
                  variant="outline"
                  className="p-4 h-auto flex flex-col items-center justify-center gap-2 text-center"
                  onClick={async () => {
                    try {
                      // Get current user
                      const { data: userData } = await supabase.auth.getUser();
                      if (!userData?.user) {
                        toast({
                          title: "Error",
                          description:
                            "You must be signed in to share an itinerary",
                          variant: "destructive",
                        });
                        setShowShareDialog(false);
                        return;
                      }

                      // Get the current destination from localStorage
                      const storedDestination = localStorage.getItem(
                        "selectedDestination",
                      );
                      if (!storedDestination) {
                        toast({
                          title: "Error",
                          description: "No destination found",
                          variant: "destructive",
                        });
                        setShowShareDialog(false);
                        return;
                      }

                      const destination = JSON.parse(storedDestination);

                      // Get the current itinerary data from localStorage
                      const storedItinerary =
                        localStorage.getItem("generatedItinerary");
                      let itineraryData;

                      if (storedItinerary) {
                        // Use the full multi-day itinerary if available
                        itineraryData = JSON.parse(storedItinerary);

                        // Update the current day's activities
                        if (
                          itineraryData.days &&
                          itineraryData.days.length > 0
                        ) {
                          itineraryData.days[0].activities = items.map(
                            (item) => ({
                              time: item.time,
                              title: item.title,
                              duration: item.duration,
                              location: item.location,
                              description: item.description || "",
                              type: item.type || "attraction",
                            }),
                          );
                        }
                      } else {
                        // Create a new single-day itinerary if none exists
                        itineraryData = {
                          days: [
                            {
                              date: new Date().toISOString().split("T")[0],
                              activities: items.map((item) => ({
                                time: item.time,
                                title: item.title,
                                duration: item.duration,
                                location: item.location,
                                description: item.description || "",
                                type: item.type || "attraction",
                              })),
                            },
                          ],
                        };
                      }

                      // Save to database as public
                      const { data, error } = await supabase
                        .from("itineraries")
                        .insert({
                          user_id: userData.user.id,
                          destination: destination.title,
                          summary: `${items.length} activities in ${destination.title}`,
                          total_activities: items.length,
                          estimated_cost: destination.priceRange || "Varies",
                          is_public: true,
                          itinerary_data: itineraryData,
                          criteria_id: null,
                          share_status: "public",
                        });

                      if (error) throw error;

                      toast({
                        title: "Success",
                        description: "Itinerary shared publicly",
                      });

                      setShowShareDialog(false);
                    } catch (error) {
                      console.error("Error sharing itinerary publicly:", error);
                      toast({
                        title: "Error",
                        description: "Failed to share itinerary",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Globe className="h-8 w-8 text-gray-500" />
                  <span className="font-medium">Public</span>
                  <span className="text-xs text-muted-foreground truncate w-full">
                    Visible to everyone
                  </span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Share this link with others:
                </p>
                <div className="flex items-center gap-2">
                  <Input value={shareUrl} readOnly className="flex-1" />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Or send via email:</p>
                <div className="flex items-center gap-2">
                  <Input
                    type="email"
                    placeholder="recipient@example.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    disabled={!recipientEmail || isSendingEmail}
                    onClick={async () => {
                      if (!recipientEmail) return;

                      setIsSendingEmail(true);
                      try {
                        // In a real app, you would call an API endpoint to send the email
                        // For now, we'll just simulate it with a delay
                        await new Promise((resolve) =>
                          setTimeout(resolve, 1000),
                        );

                        toast({
                          title: "Email Sent",
                          description: `Itinerary link sent to ${recipientEmail}`,
                        });

                        setRecipientEmail("");
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to send email",
                          variant: "destructive",
                        });
                      } finally {
                        setIsSendingEmail(false);
                      }
                    }}
                  >
                    {isSendingEmail ? (
                      <span className="flex items-center gap-1">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        Send
                      </span>
                    )}
                  </Button>
                </div>
              </div>

              <Button
                variant="ghost"
                className="w-full mt-4"
                onClick={() => {
                  setShareUrl("");
                  setRecipientEmail("");
                  setIsCopied(false);
                }}
              >
                Create Another Link
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Public/Private Dialog */}
      <Dialog
        open={showPublicPrivateDialog}
        onOpenChange={setShowPublicPrivateDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Itinerary</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              Would you like to make this itinerary public, shared, or private?
            </p>
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="p-4 h-auto flex flex-col items-center justify-center gap-2 text-center"
                onClick={async () => {
                  try {
                    // Get current user
                    const { data: userData } = await supabase.auth.getUser();
                    if (!userData?.user) {
                      toast({
                        title: "Error",
                        description:
                          "You must be signed in to save an itinerary",
                        variant: "destructive",
                      });
                      setShowPublicPrivateDialog(false);
                      return;
                    }

                    // Get the current destination from localStorage
                    const storedDestination = localStorage.getItem(
                      "selectedDestination",
                    );
                    if (!storedDestination) {
                      toast({
                        title: "Error",
                        description: "No destination found",
                        variant: "destructive",
                      });
                      setShowPublicPrivateDialog(false);
                      return;
                    }

                    const destination = JSON.parse(storedDestination);

                    // Get the current itinerary data from localStorage
                    const storedItinerary =
                      localStorage.getItem("generatedItinerary");
                    let itineraryData;

                    if (storedItinerary) {
                      // Use the full multi-day itinerary if available
                      itineraryData = JSON.parse(storedItinerary);

                      // Update the current day's activities
                      if (itineraryData.days && itineraryData.days.length > 0) {
                        itineraryData.days[0].activities = items.map(
                          (item) => ({
                            time: item.time,
                            title: item.title,
                            duration: item.duration,
                            location: item.location,
                            description: item.description || "",
                            type: item.type || "attraction",
                          }),
                        );
                      }
                    } else {
                      // Create a new single-day itinerary if none exists
                      itineraryData = {
                        days: [
                          {
                            date: new Date().toISOString().split("T")[0],
                            activities: items.map((item) => ({
                              time: item.time,
                              title: item.title,
                              duration: item.duration,
                              location: item.location,
                              description: item.description || "",
                              type: item.type || "attraction",
                            })),
                          },
                        ],
                      };
                    }

                    // Save to database
                    const { data, error } = await supabase
                      .from("itineraries")
                      .insert({
                        user_id: userData.user.id,
                        destination: destination.title,
                        summary: `${items.length} activities in ${destination.title}`,
                        total_activities: items.length,
                        estimated_cost: destination.priceRange || "Varies",
                        is_public: false,
                        itinerary_data: itineraryData,
                        criteria_id: null,
                        share_status: "private",
                      });

                    if (error) throw error;

                    toast({
                      title: "Success",
                      description: "Itinerary saved as private",
                    });

                    // Reset change tracking
                    setOriginalActivities([...items]);
                    setHasChanges(false);
                    setShowPublicPrivateDialog(false);
                  } catch (error) {
                    console.error("Error saving itinerary:", error);
                    toast({
                      title: "Error",
                      description: "Failed to save itinerary",
                      variant: "destructive",
                    });
                    setShowPublicPrivateDialog(false);
                  }
                }}
              >
                <Users className="h-8 w-8 text-gray-500" />
                <span className="font-medium">Private</span>
                <span className="text-xs text-muted-foreground truncate w-full">
                  Only visible to you
                </span>
              </Button>

              <Button
                variant="outline"
                className="p-4 h-auto flex flex-col items-center justify-center gap-2 text-center"
                onClick={async () => {
                  try {
                    // Get current user
                    const { data: userData } = await supabase.auth.getUser();
                    if (!userData?.user) {
                      toast({
                        title: "Error",
                        description:
                          "You must be signed in to save an itinerary",
                        variant: "destructive",
                      });
                      setShowPublicPrivateDialog(false);
                      return;
                    }

                    // Get the current destination from localStorage
                    const storedDestination = localStorage.getItem(
                      "selectedDestination",
                    );
                    if (!storedDestination) {
                      toast({
                        title: "Error",
                        description: "No destination found",
                        variant: "destructive",
                      });
                      setShowPublicPrivateDialog(false);
                      return;
                    }

                    const destination = JSON.parse(storedDestination);

                    // Get the current itinerary data from localStorage
                    const storedItinerary =
                      localStorage.getItem("generatedItinerary");
                    let itineraryData;

                    if (storedItinerary) {
                      // Use the full multi-day itinerary if available
                      itineraryData = JSON.parse(storedItinerary);

                      // Update the current day's activities
                      if (itineraryData.days && itineraryData.days.length > 0) {
                        itineraryData.days[0].activities = items.map(
                          (item) => ({
                            time: item.time,
                            title: item.title,
                            duration: item.duration,
                            location: item.location,
                            description: item.description || "",
                            type: item.type || "attraction",
                          }),
                        );
                      }
                    } else {
                      // Create a new single-day itinerary if none exists
                      itineraryData = {
                        days: [
                          {
                            date: new Date().toISOString().split("T")[0],
                            activities: items.map((item) => ({
                              time: item.time,
                              title: item.title,
                              duration: item.duration,
                              location: item.location,
                              description: item.description || "",
                              type: item.type || "attraction",
                            })),
                          },
                        ],
                      };
                    }

                    // Generate a unique ID for the share URL
                    const shareId = crypto.randomUUID();

                    // Save to database
                    const { data, error } = await supabase
                      .from("itineraries")
                      .insert({
                        user_id: userData.user.id,
                        destination: destination.title,
                        summary: `${items.length} activities in ${destination.title}`,
                        total_activities: items.length,
                        estimated_cost: destination.priceRange || "Varies",
                        is_public: false,
                        itinerary_data: itineraryData,
                        criteria_id: null,
                        share_id: shareId,
                        share_status: "shared",
                      });

                    if (error) throw error;

                    toast({
                      title: "Success",
                      description: "Itinerary saved as shared with link",
                    });

                    // Reset change tracking
                    setOriginalActivities([...items]);
                    setHasChanges(false);
                    setShowPublicPrivateDialog(false);
                  } catch (error) {
                    console.error("Error saving itinerary:", error);
                    toast({
                      title: "Error",
                      description: "Failed to save itinerary",
                      variant: "destructive",
                    });
                    setShowPublicPrivateDialog(false);
                  }
                }}
              >
                <Share2 className="h-8 w-8 text-gray-500" />
                <span className="font-medium">Shared</span>
                <span className="text-xs text-muted-foreground truncate w-full">
                  Accessible with link only
                </span>
              </Button>

              <Button
                variant="outline"
                className="p-4 h-auto flex flex-col items-center justify-center gap-2 text-center"
                onClick={async () => {
                  try {
                    // Get current user
                    const { data: userData } = await supabase.auth.getUser();
                    if (!userData?.user) {
                      toast({
                        title: "Error",
                        description:
                          "You must be signed in to save an itinerary",
                        variant: "destructive",
                      });
                      setShowPublicPrivateDialog(false);
                      return;
                    }

                    // Get the current destination from localStorage
                    const storedDestination = localStorage.getItem(
                      "selectedDestination",
                    );
                    if (!storedDestination) {
                      toast({
                        title: "Error",
                        description: "No destination found",
                        variant: "destructive",
                      });
                      setShowPublicPrivateDialog(false);
                      return;
                    }

                    const destination = JSON.parse(storedDestination);

                    // Get the current itinerary data from localStorage
                    const storedItinerary =
                      localStorage.getItem("generatedItinerary");
                    let itineraryData;

                    if (storedItinerary) {
                      // Use the full multi-day itinerary if available
                      itineraryData = JSON.parse(storedItinerary);

                      // Update the current day's activities
                      if (itineraryData.days && itineraryData.days.length > 0) {
                        itineraryData.days[0].activities = items.map(
                          (item) => ({
                            time: item.time,
                            title: item.title,
                            duration: item.duration,
                            location: item.location,
                            description: item.description || "",
                            type: item.type || "attraction",
                          }),
                        );
                      }
                    } else {
                      // Create a new single-day itinerary if none exists
                      itineraryData = {
                        days: [
                          {
                            date: new Date().toISOString().split("T")[0],
                            activities: items.map((item) => ({
                              time: item.time,
                              title: item.title,
                              duration: item.duration,
                              location: item.location,
                              description: item.description || "",
                              type: item.type || "attraction",
                            })),
                          },
                        ],
                      };
                    }

                    // Save to database
                    const { data, error } = await supabase
                      .from("itineraries")
                      .insert({
                        user_id: userData.user.id,
                        destination: destination.title,
                        summary: `${items.length} activities in ${destination.title}`,
                        total_activities: items.length,
                        estimated_cost: destination.priceRange || "Varies",
                        is_public: true,
                        itinerary_data: itineraryData,
                        criteria_id: null,
                        share_status: "public",
                      });

                    if (error) throw error;

                    toast({
                      title: "Success",
                      description: "Itinerary saved as public",
                    });

                    // Reset change tracking
                    setOriginalActivities([...items]);
                    setHasChanges(false);
                    setShowPublicPrivateDialog(false);
                  } catch (error) {
                    console.error("Error saving itinerary:", error);
                    toast({
                      title: "Error",
                      description: "Failed to save itinerary",
                      variant: "destructive",
                    });
                    setShowPublicPrivateDialog(false);
                  }
                }}
              >
                <Globe className="h-8 w-8 text-gray-500" />
                <span className="font-medium">Public</span>
                <span className="text-xs text-muted-foreground truncate w-full">
                  Visible to everyone
                </span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Generation Progress Overlay */}
      {isGenerating && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          <div className="relative w-24 h-24 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
            >
              <circle
                className="text-primary"
                strokeWidth="4"
                stroke="currentColor"
                fill="transparent"
                r="48"
                cx="50"
                cy="50"
                strokeLinecap="round"
                style={{
                  strokeDasharray: 301.59,
                  strokeDashoffset:
                    301.59 - (301.59 * generationProgress) / 100,
                  transformOrigin: "center",
                  transform: "rotate(-90deg)",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-primary">
              {Math.round(generationProgress)}%
            </div>
          </div>
          <h3 className="text-lg font-medium mb-2">Generating Itinerary</h3>
          <p className="text-sm text-muted-foreground max-w-xs text-center">
            Creating your perfect travel schedule with activities tailored to
            your preferences...
          </p>
        </div>
      )}
    </Card>
  );
};

export default DailySchedule;
