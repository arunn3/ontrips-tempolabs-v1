import React, { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Bot, Calendar, Edit2, MapPin, Users, Heart } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { useToast } from "./ui/use-toast";
import { supabase } from "@/lib/supabase";
import DatePickerDialog from "./DatePickerDialog";
import PublicPrivateDialog from "./PublicPrivateDialog";

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
  details?: DestinationDetailsType;
  itinerary?: GeneratedItinerary;
}

const DestinationCardComponent = ({
  destination,
  onClick,
  onGenerateItinerary,
  setShowDatePickerDialog,
}: {
  destination: Destination;
  onClick?: () => void;
  onGenerateItinerary?: () => void;
  setShowDatePickerDialog: (show: boolean) => void;
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
      <div className="flex items-center justify-between mt-2">
        <p className="text-sm font-medium text-gray-900">
          {destination.priceRange}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setShowDatePickerDialog(true);
          }}
        >
          Generate Itinerary
        </Button>
      </div>
    </div>
  </div>
);

const DestinationDetailsComponent = ({
  destination,
}: {
  destination: Destination;
}) => {
  if (!destination.details) return null;

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg">
      <div className="grid grid-cols-1 gap-6">
        {destination.details.cities.map((city, cityIndex) => (
          <Card key={cityIndex} className="p-4">
            <div className="relative h-48 mb-4">
              <img
                src={city.image}
                alt={city.name}
                className="w-full h-full object-cover rounded-md"
              />
            </div>
            <h3 className="text-xl font-semibold mb-2">{city.name}</h3>
            <p className="text-gray-600 mb-4">{city.description}</p>

            {/* Activities Section */}
            <div className="space-y-4 mb-6">
              <h4 className="text-lg font-semibold">Activities</h4>
              <div className="space-y-3">
                {city.activities.map((activity, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <img
                      src={activity.image}
                      alt={activity.name}
                      className="w-12 h-12 rounded-md object-cover"
                    />
                    <div>
                      <h5 className="font-medium">{activity.name}</h5>
                      <p className="text-sm text-gray-600">
                        {activity.description}
                      </p>
                      <div className="flex gap-1 mt-1 text-xs text-gray-500">
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
              <h4 className="text-lg font-semibold">Events</h4>
              <div className="space-y-3">
                {city.events.map((event, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <img
                      src={event.image}
                      alt={event.name}
                      className="w-12 h-12 rounded-md object-cover"
                    />
                    <div>
                      <h5 className="font-medium">{event.name}</h5>
                      <p className="text-sm text-gray-600">
                        {event.description}
                      </p>
                      <div className="text-xs text-gray-500 mt-1">
                        {event.date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
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
  const [showDatePickerDialog, setShowDatePickerDialog] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [destinations, setDestinations] = useState<Destination[]>([]); // State to hold destinations
  const [selectedDestination, setSelectedDestination] =
    useState<Destination | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);
  const [showPublicPrivateDialog, setShowPublicPrivateDialog] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<{
    userId: string;
    destination: string;
    selections: Record<string, string[]>;
    itinerary: any;
  } | null>(null);
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content:
        "Hi! Let's help you discover your perfect destination. I'll ask you a few questions about your preferences.",
      timestamp: new Date(),
    },
  ]);

  // Load selected destination and preferences from localStorage on initial render
  useEffect(() => {
    const storedDestination = localStorage.getItem("selectedDestination");
    const storedSelections = localStorage.getItem("selectedPreferences");

    if (storedDestination) {
      try {
        const parsedDestination = JSON.parse(storedDestination);
        setSelectedDestination(parsedDestination);
        setCurrentQuestionIndex(preferenceOptions.length); // Set to show results
      } catch (error) {
        console.error("Error parsing stored destination:", error);
      }
    }

    if (storedSelections) {
      try {
        const parsedSelections = JSON.parse(storedSelections);
        setSelections(parsedSelections);
      } catch (error) {
        console.error("Error parsing stored preferences:", error);
      }
    }
  }, []);

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
        setDetailsError("Failed to load destination details");
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
        setIsSearching(true);
        const { searchDestinations } = await import("../lib/gemini");
        const fetchedDestinations = await searchDestinations(selections);
        setDestinations(fetchedDestinations); // Store destinations in state

        // If we were in edit mode, clear the previous itinerary now
        if (selectedDestination?.itinerary) {
          setSelectedDestination(null);
          localStorage.removeItem("selectedDestination");
          localStorage.removeItem("generatedItinerary");

          // Dispatch event to clear the schedule view
          const itineraryUpdatedEvent = new CustomEvent("itineraryUpdated", {
            detail: { itinerary: null },
          });
          window.dispatchEvent(itineraryUpdatedEvent);
        }

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
      } finally {
        setIsSearching(false);
      }
    }
  };

  const showingResults = currentQuestionIndex >= preferenceOptions.length;

  return (
    <Card className="w-full h-full bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b space-y-4 sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span>AI Travel Assistant</span>
            <Badge variant="secondary" className="text-xs font-normal">
              NEW
            </Badge>
          </h2>
          {selectedDestination?.itinerary && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                // Reset the chat but keep the current selections and destination
                setCurrentQuestionIndex(0);
                // Reset messages to initial state
                setMessages([
                  {
                    id: "1",
                    type: "bot",
                    content:
                      "Hi! Let's help you discover your perfect destination. I'll ask you a few questions about your preferences.",
                    timestamp: new Date(),
                  },
                ]);
              }}
              title="Edit preferences"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        {/* Current Trip Details */}
        <div className="space-y-2 bg-muted p-3 rounded-lg">
          <h3 className="font-medium text-sm mb-2">Current Itinerary</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="font-medium text-foreground">
              {isGeneratingItinerary && selectedDestination
                ? `Generating itinerary for ${selectedDestination.title}`
                : selectedDestination?.itinerary
                  ? `Itinerary for ${selectedDestination.title}`
                  : showingResults
                    ? "Finding your perfect destinations"
                    : "Discovering your preferences..."}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {showDatePickerDialog
                ? "Selecting start date..."
                : selectedDestination?.itinerary?.days?.[0]?.date
                  ? `Starting ${selectedDestination.itinerary.days[0].date}`
                  : "Planning your dates..."}
            </span>
          </div>
          {selectedDestination?.itinerary && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                Duration: {selectedDestination.itinerary.days.length} days
              </span>
            </div>
          )}

          {/* Selected Preferences Summary */}
          {Object.keys(selections).length > 0 && (
            <div className="mt-2 pt-2 border-t border-border">
              <h4 className="text-xs font-medium mb-1">
                Selected Preferences:
              </h4>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(selections).flatMap(([category, values]) =>
                  values.map((value) => (
                    <Badge
                      key={`${category}-${value}`}
                      variant="secondary"
                      className="text-xs"
                    >
                      {value}
                    </Badge>
                  )),
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1 p-4">
        {showingResults ? (
          <div className="space-y-6">
            {/* Selected Preferences Summary 
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
            </div>*/}

            {/* Destination Results - Display Destinations or DestinationDetails conditionally */}
            <div className="space-y-4">
              {!selectedDestination ? (
                // Display list of DestinationCards when no destination is selected
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Recommended Destinations</h3>
                    {!isLoading && (
                      <Badge variant="outline">
                        {destinations.length} results found
                      </Badge>
                    )}
                  </div>
                  {isSearching ? (
                    <div className="flex items-center justify-center gap-2 py-4">
                      <Bot className="w-5 h-5 animate-spin" />
                      <span>Searching for destinations...</span>
                    </div>
                  ) : (
                    destinations.map((destination, index) => (
                      <DestinationCardComponent
                        key={index}
                        destination={destination}
                        onClick={() => setSelectedDestination(destination)}
                        setShowDatePickerDialog={() => {
                          setSelectedDestination(destination);
                          setShowDatePickerDialog(true);
                        }}
                        onGenerateItinerary={async (
                          startDate: Date = new Date(),
                        ) => {
                          try {
                            setIsGeneratingItinerary(true);
                            // Store the selected destination before generating itinerary
                            const currentDestination = destination;
                            setSelectedDestination(currentDestination);
                            console.log(
                              "Current Destination: %s",
                              currentDestination,
                            );
                            const { generateItinerary } = await import(
                              "../lib/gemini"
                            );
                            const duration = selections.duration?.[0]
                              ?.toLowerCase()
                              .includes("week")
                              ? 7
                              : 3;
                            const itinerary = await generateItinerary(
                              currentDestination.title,
                              selections,
                              startDate,
                              duration,
                            );
                            console.log("Generated itinerary:", itinerary);

                            // Store the itinerary in localStorage
                            localStorage.setItem(
                              "generatedItinerary",
                              JSON.stringify(itinerary),
                            );

                            // Store location data for each activity
                            try {
                              const { saveLocation } = await import(
                                "../lib/locationService"
                              );

                              // Process each day's activities
                              for (const day of itinerary.days) {
                                for (const activity of day.activities) {
                                  if (activity.lat && activity.long) {
                                    // Save location data to database
                                    const locationName =
                                      activity.location || activity.title;
                                    if (locationName) {
                                      await saveLocation(
                                        locationName,
                                        parseFloat(activity.lat),
                                        parseFloat(activity.long),
                                      );

                                      // If there's a city mentioned, save that too
                                      const locationParts =
                                        locationName.split(",");
                                      if (locationParts.length > 1) {
                                        const cityName =
                                          locationParts[
                                            locationParts.length - 1
                                          ].trim();
                                        if (cityName) {
                                          await saveLocation(
                                            cityName,
                                            parseFloat(activity.lat),
                                            parseFloat(activity.long),
                                          );
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            } catch (error) {
                              console.error(
                                "Error saving location data:",
                                error,
                              );
                            }

                            // Save to Supabase if user is logged in
                            try {
                              const { saveItinerary } = await import(
                                "../lib/itineraryStorage"
                              );
                              const { data } = await supabase.auth.getUser();

                              if (data.user) {
                                // Set pending save data and show dialog
                                setPendingSaveData({
                                  userId: data.user.id,
                                  destination: currentDestination.title,
                                  selections,
                                  itinerary,
                                });
                                setShowPublicPrivateDialog(true);
                              }
                            } catch (saveError) {
                              console.error(
                                "Error saving itinerary to database:",
                                saveError,
                              );
                            }

                            setDestinations((prev) =>
                              prev.map((d) =>
                                d.title === currentDestination.title
                                  ? { ...d, itinerary }
                                  : d,
                              ),
                            );
                            // Update the selected destination with the itinerary
                            const updatedDestination = {
                              ...currentDestination,
                              itinerary,
                            };
                            setSelectedDestination(updatedDestination);

                            // Clear destinations array since we now have an itinerary
                            setDestinations([]);

                            // Store the selected destination and preferences in localStorage for persistence
                            localStorage.setItem(
                              "selectedDestination",
                              JSON.stringify(updatedDestination),
                            );

                            // Also store the selections/preferences
                            localStorage.setItem(
                              "selectedPreferences",
                              JSON.stringify(selections),
                            );

                            // Force a refresh of the schedule view by dispatching a custom event
                            const itineraryUpdatedEvent = new CustomEvent(
                              "itineraryUpdated",
                              {
                                detail: { itinerary },
                              },
                            );
                            window.dispatchEvent(itineraryUpdatedEvent);

                            // Small delay to ensure the event is processed
                            setTimeout(() => {
                              // Manually trigger a re-render by updating a URL parameter
                              const url = new URL(window.location.href);
                              url.searchParams.set(
                                "itineraryUpdate",
                                Date.now().toString(),
                              );
                              window.history.replaceState({}, "", url);
                            }, 100);
                          } catch (error) {
                            console.error("Error generating itinerary:", error);
                          } finally {
                            setIsGeneratingItinerary(false);
                          }
                        }}
                      />
                    ))
                  )}
                </div>
              ) : (
                // Display DestinationDetails when a destination is selected
                <div>
                  {selectedDestination?.itinerary ? (
                    // Don't show back button if itinerary is generated
                    <div className="mb-4"></div>
                  ) : (
                    <Button
                      variant="outline"
                      className="mb-4"
                      onClick={() => setSelectedDestination(null)}
                    >
                      ← Back to destinations
                    </Button>
                  )}
                  {isLoadingDetails ? (
                    <div className="flex items-center justify-center gap-2 py-8">
                      <Bot className="w-5 h-5 animate-spin" />
                      <span>Loading destination details...</span>
                    </div>
                  ) : detailsError ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-8">
                      <div className="text-red-500">{detailsError}</div>
                      <Button
                        onClick={() => {
                          setDetailsError(null);
                          setIsLoadingDetails(true);
                          setSelectedDestination({ ...selectedDestination });
                        }}
                      >
                        Retry
                      </Button>
                    </div>
                  ) : (
                    <DestinationDetailsComponent
                      destination={selectedDestination}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Only show current question */}
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://api.dicebear.com/9.x/thumbs/svg?seed=Jack&scale=70&translateX=5" />
                <AvatarFallback>
                  <Bot />
                </AvatarFallback>
              </Avatar>
              <div className="rounded-lg p-3 max-w-[80%] bg-muted">
                <p className="text-sm whitespace-pre-wrap">
                  {currentQuestionIndex < preferenceOptions.length
                    ? preferenceOptions[currentQuestionIndex].question
                    : "Thanks! Let me find the perfect destinations based on your preferences..."}
                </p>
              </div>
            </div>
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
                <div className="flex gap-2 mt-4">
                  {currentQuestionIndex > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Go back to previous question
                        const prevIndex = currentQuestionIndex - 1;
                        setCurrentQuestionIndex(prevIndex);
                        // Update messages to show previous question
                        setMessages((prev) => [
                          ...prev.slice(0, -2), // Remove last user response and current question
                          {
                            id: Date.now().toString(),
                            type: "bot",
                            content: preferenceOptions[prevIndex].question,
                            timestamp: new Date(),
                          },
                        ]);
                      }}
                    >
                      Back
                    </Button>
                  )}
                  <Button
                    onClick={handleNext}
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
                  {selectedDestination?.itinerary && (
                    <Button
                      variant="outline"
                      className="ml-auto"
                      onClick={() => {
                        // Cancel editing and restore previous state
                        setCurrentQuestionIndex(preferenceOptions.length);
                        // Reset messages to show destination details
                        setMessages([
                          {
                            id: "1",
                            type: "bot",
                            content: (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="font-medium">
                                    Your Selected Destination
                                  </h3>
                                </div>
                                <DestinationDetailsComponent
                                  destination={selectedDestination}
                                />
                              </div>
                            ),
                            timestamp: new Date(),
                          },
                        ]);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
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

      {/* Date Picker Dialog */}
      <DatePickerDialog
        open={showDatePickerDialog}
        onOpenChange={setShowDatePickerDialog}
        onDateSelect={(date) => {
          // Find the currently selected destination
          // Make sure we're using the correct destination that was clicked on
          const selectedDest = selectedDestination || destinations[0];
          if (selectedDest) {
            // Call the generate itinerary function with the selected date
            const generateFn = async () => {
              try {
                setIsGeneratingItinerary(true);
                const { generateItinerary } = await import("../lib/gemini");
                const duration = selections.duration?.[0]
                  ?.toLowerCase()
                  .includes("week")
                  ? 7
                  : 3;
                const itinerary = await generateItinerary(
                  selectedDest.title,
                  selections,
                  date,
                  duration,
                );
                console.log("Generated itinerary:", itinerary);

                // Store the itinerary in localStorage
                localStorage.setItem(
                  "generatedItinerary",
                  JSON.stringify(itinerary),
                );

                // Store location data for each activity
                try {
                  const { saveLocation } = await import(
                    "../lib/locationService"
                  );

                  // Process each day's activities
                  for (const day of itinerary.days) {
                    for (const activity of day.activities) {
                      if (activity.lat && activity.long) {
                        // Save location data to database
                        const locationName =
                          activity.location || activity.title;
                        if (locationName) {
                          await saveLocation(
                            locationName,
                            parseFloat(activity.lat),
                            parseFloat(activity.long),
                          );

                          // If there's a city mentioned, save that too
                          const locationParts = locationName.split(",");
                          if (locationParts.length > 1) {
                            const cityName =
                              locationParts[locationParts.length - 1].trim();
                            if (cityName) {
                              await saveLocation(
                                cityName,
                                parseFloat(activity.lat),
                                parseFloat(activity.long),
                              );
                            }
                          }
                        }
                      }
                    }
                  }
                } catch (error) {
                  console.error("Error saving location data:", error);
                }

                // Save to Supabase if user is logged in
                try {
                  const { saveItinerary } = await import(
                    "../lib/itineraryStorage"
                  );
                  const { data } = await supabase.auth.getUser();

                  if (data.user) {
                    // Set pending save data and show dialog
                    setPendingSaveData({
                      userId: data.user.id,
                      destination: selectedDest.title,
                      selections,
                      itinerary,
                    });
                    setShowPublicPrivateDialog(true);
                  }
                } catch (saveError) {
                  console.error(
                    "Error saving itinerary to database:",
                    saveError,
                  );
                }

                setDestinations((prev) =>
                  prev.map((d) =>
                    d.title === selectedDest.title ? { ...d, itinerary } : d,
                  ),
                );
                // Update the selected destination with the itinerary
                const updatedDestination = { ...selectedDest, itinerary };
                setSelectedDestination(updatedDestination);

                // Clear destinations array since we now have an itinerary
                setDestinations([]);

                // Store the selected destination and preferences in localStorage for persistence
                localStorage.setItem(
                  "selectedDestination",
                  JSON.stringify(updatedDestination),
                );

                // Also store the selections/preferences
                localStorage.setItem(
                  "selectedPreferences",
                  JSON.stringify(selections),
                );

                // Force a refresh of the schedule view by dispatching a custom event
                const itineraryUpdatedEvent = new CustomEvent(
                  "itineraryUpdated",
                  {
                    detail: { itinerary },
                  },
                );
                window.dispatchEvent(itineraryUpdatedEvent);

                // Small delay to ensure the event is processed
                setTimeout(() => {
                  // Manually trigger a re-render by updating a URL parameter
                  const url = new URL(window.location.href);
                  url.searchParams.set(
                    "itineraryUpdate",
                    Date.now().toString(),
                  );
                  window.history.replaceState({}, "", url);
                }, 100);
              } catch (error) {
                console.error("Error generating itinerary:", error);
                toast({
                  title: "Error",
                  description:
                    "Failed to generate itinerary. Please try again.",
                  variant: "destructive",
                });
              } finally {
                setIsGeneratingItinerary(false);
              }
            };

            generateFn();
          }
        }}
      />

      {/* Public/Private Dialog */}
      <PublicPrivateDialog
        open={showPublicPrivateDialog}
        onOpenChange={setShowPublicPrivateDialog}
        onConfirm={async (isPublic) => {
          if (pendingSaveData) {
            try {
              const { saveItinerary } = await import("../lib/itineraryStorage");
              const result = await saveItinerary(
                pendingSaveData.userId,
                pendingSaveData.destination,
                pendingSaveData.selections,
                pendingSaveData.itinerary,
                isPublic,
              );

              if (result) {
                console.log("Itinerary saved to database with ID:", result.id);
                toast({
                  title: "Itinerary Saved",
                  description: `Your itinerary has been saved ${isPublic ? "and is public" : "as private"}.`,
                });
              }
            } catch (error) {
              console.error("Error saving itinerary:", error);
              toast({
                title: "Error",
                description: "Failed to save itinerary. Please try again.",
                variant: "destructive",
              });
            } finally {
              setPendingSaveData(null);
            }
          }
        }}
      />
    </Card>
  );
};

export default ChatInterface;
