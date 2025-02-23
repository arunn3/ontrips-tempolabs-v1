import React, { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Bot, Calendar, Edit2, MapPin, Users, Heart } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";

interface Message {
  id: string;
  type: "bot" | "user";
  content: string | React.ReactNode;
  timestamp: Date;
}

interface PreferenceOption {
  category: string;
  question: string;
  options: string[];
}

interface ChatInterfaceProps {
  messages?: Message[];
  onSendMessage?: (selections: Record<string, string[]>) => void;
  isLoading?: boolean;
}

const preferenceOptions: PreferenceOption[] = [
  {
    category: "travelMonth",
    question: "When are you planning to travel?",
    options: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
  },
  {
    category: "travelType",
    question: "What type of travel are you interested in?",
    options: [
      "Family with kids",
      "Solo",
      "Couples",
      "Honeymoon",
      "Business",
      "With pets",
    ],
  },
  {
    category: "travelStyle",
    question: "What's your preferred travel style?",
    options: ["Budget", "Luxury", "Adventure", "Relaxed", "Fast-paced"],
  },
  {
    category: "interests",
    question: "What are your main interests?",
    options: [
      "Beaches",
      "History",
      "Food",
      "Art",
      "Nature",
      "Nightlife",
      "Shopping",
    ],
  },
  {
    category: "budget",
    question: "What's your budget range?",
    options: ["Budget", "Mid-range", "Luxury", "Ultra-luxury"],
  },
  {
    category: "duration",
    question: "How long would you like to travel?",
    options: ["Weekend", "1 week", "2 weeks", "1 month", "More than 1 month"],
  },
];

const PreferenceSelector = ({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string[];
  onSelect: (option: string) => void;
}) => {
  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      {options.map((option) => (
        <div key={option} className="flex items-center space-x-2">
          <Checkbox
            id={option}
            checked={selected.includes(option)}
            onCheckedChange={() => onSelect(option)}
          />
          <label
            htmlFor={option}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {option}
          </label>
        </div>
      ))}
    </div>
  );
};

interface Activity {
  name: string;
  description: string;
  duration: string;
  image: string;
  bestTime: string;
  price: string;
}

interface Event {
  name: string;
  description: string;
  date: string;
  image: string;
}

interface Attraction {
  name: string;
  description: string;
  image: string;
  visitDuration: string;
  bestTime: string;
  price: string;
}

interface Weather {
  temperature: string;
  conditions: string;
  rainfall: string;
}

interface Transportation {
  options: string[];
  costs: string;
}

interface Accommodation {
  types: string[];
  priceRanges: string;
  recommendations: string[];
}

interface DestinationDetailsType {
  // Renamed to avoid conflict with component name
  activities: Activity[];
  events: Event[];
  attractions: Attraction[];
  weather: Weather;
  transportation: Transportation;
  accommodation: Accommodation;
}

interface Destination {
  title: string;
  description: string;
  image: string;
  matchPercentage: number;
  rating: number;
  priceRange: string;
  details?: DestinationDetailsType; // Using the renamed interface
}

const DestinationCardComponent = ({
  // Renamed to avoid conflict with component name
  destination,
  onClick,
}: {
  destination: Destination;
  onClick?: () => void;
}) => (
  <div
    className="bg-white rounded-lg shadow-md overflow-hidden mb-4 cursor-pointer transition-all hover:shadow-lg"
    onClick={onClick}
  >
    <div className="relative h-48">
      <img
        src={destination.image}
        alt={destination.title}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.src =
            "https://images.unsplash.com/photo-1589395937772-f67cc0e347e3";
        }}
      />
      <div className="absolute top-3 right-3">
        <Button
          variant="ghost"
          size="icon"
          className="bg-white/90 hover:bg-white"
        >
          <Heart className="h-4 w-4" />
        </Button>
      </div>
    </div>
    <div className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg">{destination.title}</h3>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {destination.matchPercentage}% Match
          </Badge>
          <span className="text-yellow-500 flex items-center gap-1">
            ★{" "}
            {typeof destination.rating === "number"
              ? destination.rating.toFixed(1)
              : destination.rating}
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-2">{destination.description}</p>
      <p className="text-sm font-medium text-gray-900">
        {destination.priceRange}
      </p>
    </div>
  </div>
);

const DestinationDetailsComponent = ({
  destination,
}: {
  destination: Destination;
}) => {
  // Renamed to avoid conflict with component name
  if (!destination.details) return null;

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Activities Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Activities</h3>
          <div className="space-y-3">
            {destination.details.activities.map((activity, index) => (
              <div className="flex gap-3 items-start">
                {" "}
                {/* Changed gap-4 to gap-3 */}
                <img
                  src={activity.image}
                  alt={activity.name}
                  className="w-12 h-12 rounded-md object-cover"
                />
                <div>
                  <h4 className="font-medium">{activity.name}</h4>
                  <p className="text-sm text-gray-600">
                    {activity.description}
                  </p>
                  <div className="flex gap-1 mt-0 text-xs text-gray-500">
                    {" "}
                    {/* Changed gap-2 to gap-1 and mt-1 to mt-0 */}
                    <span>{activity.duration}</span>
                    <span>•</span>
                    <span>{activity.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Events Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Events</h3>
          <div className="space-y-3">
            {destination.details.events.map((event, index) => (
              <div className="flex gap-3 items-start">
                {" "}
                {/* Changed gap-4 to gap-3 */}
                <img
                  src={event.image}
                  alt={event.name}
                  className="w-12 h-12 rounded-md object-cover"
                />
                <div>
                  <h4 className="font-medium">{event.name}</h4>
                  <p className="text-sm text-gray-600">{event.description}</p>
                  <div className="text-xs text-gray-500 mt-0">
                    {event.date}
                  </div>{" "}
                  {/* Changed mt-1 to mt-0 */}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weather & Transportation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Weather</h3>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm">
              <span className="font-medium">Temperature:</span>{" "}
              {destination.details.weather.temperature}
            </p>
            <p className="text-sm mt-2">
              <span className="font-medium">Conditions:</span>{" "}
              {destination.details.weather.conditions}
            </p>
            <p className="text-sm mt-2">
              <span className="font-medium">Rainfall:</span>{" "}
              {destination.details.weather.rainfall}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Transportation</h3>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm">
              <span className="font-medium">Options:</span>{" "}
              {destination.details.transportation.options.join(", ")}
            </div>
            <div className="text-sm mt-2">
              <span className="font-medium">Costs:</span>{" "}
              {destination.details.transportation.costs}
            </div>
          </div>
        </div>
      </div>

      {/* Accommodation */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Accommodation</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm">
            <span className="font-medium">Types:</span>{" "}
            {destination.details.accommodation.types.join(", ")}
          </p>
          <p className="text-sm mt-2">
            <span className="font-medium">Price Ranges:</span>{" "}
            {destination.details.accommodation.priceRanges}
          </p>
          <p className="text-sm mt-2">
            <span className="font-medium">Recommended Areas:</span>{" "}
            {destination.details.accommodation.recommendations.join(", ")}
          </p>
        </div>
      </div>
    </div>
  );
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages: initialMessages = [],
  onSendMessage = () => {},
  isLoading = false,
}: ChatInterfaceProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [destinations, setDestinations] = useState<Destination[]>([]); // State to hold destinations
  const [selectedDestination, setSelectedDestination] =
    useState<Destination | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content:
        "Hi! Let's help you discover your perfect destination. I'll ask you a few questions about your preferences.",
      timestamp: new Date(),
    },
  ]);

  // useEffect to fetch destination details when a destination is selected
  useEffect(() => {
    const fetchDetails = async () => {
      if (!selectedDestination) return;
      if (selectedDestination.details) return; // Skip if details already exist

      setIsLoadingDetails(true);
      try {
        const { getDestinationDetails } = await import("../lib/gemini");
        const details: DestinationDetailsType = await getDestinationDetails(
          // Use renamed interface
          selectedDestination.title,
          selections,
        );
        setSelectedDestination((prev) => (prev ? { ...prev, details } : null));
      } catch (error) {
        console.error("Error fetching destination details:", error);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [selectedDestination?.title, selections]);

  const handleOptionSelect = (option: string) => {
    const currentCategory = preferenceOptions[currentQuestionIndex].category;
    const currentSelections = selections[currentCategory] || [];

    const updatedSelections = currentSelections.includes(option)
      ? currentSelections.filter((item) => item !== option)
      : [...currentSelections, option];

    setSelections({
      ...selections,
      [currentCategory]: updatedSelections,
    });
  };

  const handleNext = async () => {
    const currentCategory = preferenceOptions[currentQuestionIndex].category;
    const currentSelections = selections[currentCategory] || [];

    if (currentSelections.length === 0) {
      return; // Don't proceed if no selection is made
    }

    // Add user's selections as a message
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: "user",
        content: (
          <div className="flex flex-col gap-1">
            {currentSelections.map((selection) => (
              <span key={selection} className="text-sm">
                {selection}
              </span>
            ))}
          </div>
        ),
        timestamp: new Date(),
      },
    ]);

    if (currentQuestionIndex < preferenceOptions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      // Add next question as a message
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: preferenceOptions[nextIndex].question,
          timestamp: new Date(),
        },
      ]);
    } else {
      // Move past the last question
      setCurrentQuestionIndex(preferenceOptions.length);

      // All questions answered, search for destinations
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content:
            "Thanks! Let me find the perfect destinations based on your preferences...",
          timestamp: new Date(),
        },
      ]);

      try {
        const { searchDestinations } = await import("../lib/gemini");
        const fetchedDestinations = await searchDestinations(selections);
        setDestinations(fetchedDestinations); // Store destinations in state

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: "bot",
            content: (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Recommended Destinations</h3>
                  <Badge variant="outline">
                    {fetchedDestinations.length} results found
                  </Badge>
                </div>
                {/* Destinations will be rendered conditionally below based on selectedDestination state */}
              </div>
            ),
            timestamp: new Date(),
          },
        ]);
      } catch (error) {
        console.error("Error calling Gemini:", error);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: "bot",
            content:
              "Sorry, I encountered an error while searching for destinations. Please try again.",
            timestamp: new Date(),
          },
        ]);
      }
    }
  };

  const showingResults = currentQuestionIndex >= preferenceOptions.length;

  return (
    <Card className="w-full h-full bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span>AI Travel Assistant</span>
            <Badge variant="secondary" className="text-xs font-normal">
              NEW
            </Badge>
          </h2>
          <Button variant="ghost" size="icon">
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Current Trip Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="font-medium text-foreground">
              {showingResults
                ? "Finding your perfect destinations"
                : "Discovering your preferences..."}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Planning your dates...</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Customizing for you</span>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 flex-wrap">
          {[
            "Preferences",
            "Activities",
            "Accommodation",
            "Transport",
            "Budget",
          ].map((category) => (
            <Badge
              key={category}
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1 p-4">
        {showingResults ? (
          <div className="space-y-6">
            {/* Selected Preferences Summary */}
            <div className="bg-muted rounded-lg p-4">
              <h3 className="font-medium mb-3">Your Travel Preferences</h3>
              <div className="space-y-2">
                {Object.entries(selections).map(([category, values]) => (
                  <div key={category} className="flex flex-wrap gap-2">
                    <span className="text-sm font-medium text-muted-foreground capitalize">
                      {category.replace(/([A-Z])/g, " $1").trim()}:
                    </span>
                    {values.map((value) => (
                      <Badge
                        key={value}
                        variant="secondary"
                        className="text-xs"
                      >
                        {value}
                      </Badge>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Destination Results - Display Destinations or DestinationDetails conditionally */}
            <div className="space-y-4">
              {!selectedDestination ? (
                // Display list of DestinationCards when no destination is selected
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Recommended Destinations</h3>
                    <Badge variant="outline">
                      {destinations.length} results found
                    </Badge>
                  </div>
                  {destinations.map((destination, index) => (
                    <DestinationCardComponent
                      key={index}
                      destination={destination}
                      onClick={() => setSelectedDestination(destination)}
                    />
                  ))}
                </div>
              ) : (
                // Display DestinationDetails when a destination is selected
                <div>
                  <Button
                    variant="outline"
                    className="mb-4"
                    onClick={() => setSelectedDestination(null)}
                  >
                    ← Back to destinations
                  </Button>
                  <DestinationDetailsComponent
                    destination={selectedDestination}
                  />{" "}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${message.type === "user" ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={
                      message.type === "bot"
                        ? "https://api.dicebear.com/7.x/bottts/svg?seed=travel-bot"
                        : "https://api.dicebear.com/7.x/avataaars/svg?seed=user"
                    }
                  />
                  <AvatarFallback>
                    {message.type === "bot" ? <Bot /> : "U"}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`rounded-lg p-3 max-w-[80%] ${message.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                >
                  {typeof message.content === "string" ? (
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                  ) : (
                    message.content
                  )}
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
            {currentQuestionIndex < preferenceOptions.length && (
              <div className="mt-4">
                <PreferenceSelector
                  options={preferenceOptions[currentQuestionIndex].options}
                  selected={
                    selections[
                      preferenceOptions[currentQuestionIndex].category
                    ] || []
                  }
                  onSelect={handleOptionSelect}
                />
                <Button
                  onClick={handleNext}
                  className="mt-4"
                  disabled={
                    isLoading ||
                    !(
                      selections[
                        preferenceOptions[currentQuestionIndex].category
                      ]?.length > 0
                    )
                  }
                >
                  {currentQuestionIndex === preferenceOptions.length - 1
                    ? "Find Destinations"
                    : "Next"}
                </Button>
              </div>
            )}
          </div>
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Bot className="w-4 h-4 animate-spin" />
            <span>Thinking...</span>
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};

export default ChatInterface;
