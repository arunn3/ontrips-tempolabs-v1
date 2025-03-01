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

interface Activity {
  id: string;
  time: string;
  title: string;
  duration: string;
  location: string;
  description?: string;
  type?: "attraction" | "meal" | "transport" | "rest";
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
  },
  {
    id: "2",
    time: "10:30",
    title: "City Museum Tour",
    duration: "2h",
    location: "Museum District",
    type: "attraction",
  },
  {
    id: "3",
    time: "13:00",
    title: "Lunch at Local Market",
    duration: "1.5h",
    location: "Market Square",
    type: "meal",
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

  // Group activities by location
  const locationGroups = React.useMemo(() => {
    const groups: Record<string, Activity[]> = {};
    items.forEach((activity) => {
      if (!groups[activity.location]) {
        groups[activity.location] = [];
      }
      groups[activity.location].push(activity);
    });
    return groups;
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
    <Card className="w-full h-full bg-white p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Daily Schedule</h2>
        <Button onClick={onAdd} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Activity
        </Button>
      </div>

      <ScrollArea className="h-[calc(100%-80px)]">
        <TooltipProvider>
          <Reorder.Group
            values={items}
            onReorder={handleReorder}
            className="space-y-6"
          >
            {Object.entries(locationGroups).map(
              ([location, locationActivities]) => (
                <div key={location} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-lg">{location}</h3>
                  </div>

                  <div className="space-y-3 pl-6">
                    {locationActivities.map((activity) => (
                      <Reorder.Item
                        key={activity.id}
                        value={activity}
                        className="outline-none"
                      >
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
                                      className={getActivityTypeColor(
                                        activity.type,
                                      )}
                                    >
                                      {activity.type}
                                    </Badge>
                                  )}
                                </div>
                                <h3 className="font-medium">
                                  {activity.title}
                                </h3>

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
                    ))}
                  </div>
                </div>
              ),
            )}
          </Reorder.Group>
        </TooltipProvider>
      </ScrollArea>
    </Card>
  );
};

export default DailySchedule;
