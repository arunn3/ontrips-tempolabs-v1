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
import { Clock, GripVertical, Plus, Trash2 } from "lucide-react";
import { motion, Reorder } from "framer-motion";

interface Activity {
  id: string;
  time: string;
  title: string;
  duration: string;
  location: string;
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
  },
  {
    id: "2",
    time: "10:30",
    title: "City Museum Tour",
    duration: "2h",
    location: "Museum District",
  },
  {
    id: "3",
    time: "13:00",
    title: "Lunch at Local Market",
    duration: "1.5h",
    location: "Market Square",
  },
];

const DailySchedule = ({
  activities = defaultActivities,
  onReorder = () => {},
  onDelete = () => {},
  onAdd = () => {},
}: DailyScheduleProps) => {
  const [items, setItems] = React.useState(activities);

  const handleReorder = (newOrder: Activity[]) => {
    setItems(newOrder);
    onReorder(newOrder);
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
          <motion.div className="space-y-4">
            {items.map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
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
                      </div>
                      <h3 className="font-medium">{activity.title}</h3>
                      <p className="text-sm text-gray-500">
                        {activity.location}
                      </p>
                    </div>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(activity.id)}
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
            ))}
          </motion.div>
        </TooltipProvider>
      </ScrollArea>
    </Card>
  );
};

export default DailySchedule;
