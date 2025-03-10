import React, { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Bot,
  Calendar,
  Edit2,
  MapPin,
  Users,
  Heart,
  RefreshCw,
} from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { useToast } from "./ui/use-toast";
import { supabase } from "@/lib/supabase";
import DatePickerDialog from "./DatePickerDialog";
import PublicPrivateDialog from "./PublicPrivateDialog";
import PreferencesModal from "./PreferencesModal";
import { useItinerary } from "@/context/ItineraryContext";

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
  activities: Activity[];
  events: Event[];
  attractions: Attraction[];
  weather: Weather;
  transportation: Transportation;
  accommodation: Accommodation;
  cities: any[];
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

interface GeneratedItinerary {
  days: any[];
}

const preferenceOptions: PreferenceOption[] = [
  {
    category: "destinationType",
    question: "Do you have a specific destination in mind?",
    options: [
      "I have a specific country in mind",
      "Help me discover destinations",
    ],
  },
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
    category: "tripPreferences",
    question: "Trip Preferences",
    options: [
      "Use my profile preferences",
      "Customize preferences for this trip",
    ],
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
  category,
}: {
  options: string[];
  selected: string[];
  onSelect: (option: string) => void;
  category: string;
}) => {
  // Special handling for specific country input
  if (category === "specificCountry") {
    return (
      <div className="flex flex-col gap-4 mt-2">
        <div className="space-y-2">
          <Input
            placeholder="Enter country name (e.g., Japan, Italy, etc.)"
            value={selected[0] || ""}
            onChange={(e) => onSelect(e.target.value)}
            className="w-full"
          />
        </div>
        <Button
          variant="outline"
          className="w-full justify-center"
          onClick={() => onSelect("confirm")}
          disabled={!selected[0] || selected[0].trim() === ""}
        >
          Confirm Country
        </Button>
      </div>
    );
  }

  // Special handling for destinationType category
  if (category === "destinationType") {
    return (
      <div className="flex flex-col gap-4 mt-2">
        {options.map((option) => (
          <Button
            key={option}
            variant={selected.includes(option) ? "default" : "outline"}
            className="w-full justify-start px-4 py-6 text-left"
            onClick={() => onSelect(option)}
          >
            <div className="flex flex-col items-start">
              <span className="font-medium">{option}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {option === "I have a specific country in mind"
                  ? "Enter the name of the country you want to visit"
                  : "Let me suggest destinations based on your preferences"}
              </span>
            </div>
          </Button>
        ))}
      </div>
    );
  }

  // Special handling for tripPreferences category
  if (category === "tripPreferences") {
    return (
      <div className="flex flex-col gap-4 mt-2">
        {options.map((option) => (
          <Button
            key={option}
            variant={selected.includes(option) ? "default" : "outline"}
            className="w-full justify-start px-4 py-6 text-left"
            onClick={() => onSelect(option)}
          >
            <div className="flex flex-col items-start">
              <span className="font-medium">{option}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {option === "Use my profile preferences"
                  ? "Use your saved travel interests and styles from your profile"
                  : "Select custom preferences just for this trip"}
              </span>
            </div>
          </Button>
        ))}
      </div>
    );
  }

  // Default rendering for other categories
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
          e.currentTarget.src = `https://source.unsplash.com/featured/?${encodeURIComponent(destination.title)},travel`;
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
                onError={(e) => {
                  console.log(
                    `Image error for city ${city.name}, using fallback`,
                  );
                  e.currentTarget.src = `https://source.unsplash.com/featured/?${encodeURIComponent(`${city.name} ${destination.title} city`)}`;
                }}
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
                      onError={(e) => {
                        console.log(
                          `Image error for activity ${activity.name}, using fallback`,
                        );
                        e.currentTarget.src = `https://source.unsplash.com/featured/?${encodeURIComponent(`${activity.name} ${city.name}`)}`;
                      }}
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
                      onError={(e) => {
                        console.log(
                          `Image error for event ${event.name}, using fallback`,
                        );
                        e.currentTarget.src = `https://source.unsplash.com/featured/?${encodeURIComponent(`${event.name} ${city.name} event`)}`;
                      }}
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
}) => {
  const { setItinerary, setIsGenerating, setGenerationProgress } =
    useItinerary();
  const [showDatePickerDialog, setShowDatePickerDialog] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedDestination, setSelectedDestination] =
    useState<Destination | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);
  const [localGenerationProgress, setLocalGenerationProgress] = useState(0);
  const [showPublicPrivateDialog, setShowPublicPrivateDialog] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<{
    userId: string;
    destination: string;
    selections: Record<string, string[]>;
    itinerary: any;
  } | null>(null);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
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
        // First check if destination details exist in the database
        let details: DestinationDetailsType;
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            // Query for destination details with matching title
            const { data: dbDestinationDetails } = await supabase
              .from("destination_details")
              .select("*")
              .eq("title", selectedDestination.title)
              .limit(1);

            if (dbDestinationDetails && dbDestinationDetails.length > 0) {
              console.log(
                "Found destination details in database:",
                dbDestinationDetails[0],
              );
              details = dbDestinationDetails[0].details;
            }
          }
        } catch (dbError) {
          console.error(
            "Error checking for destination details in database:",
            dbError,
          );
        }

        // If no details found in database, use Gemini API
        if (!details) {
          const { getDestinationDetails } = await import("../lib/gemini");
          details = await getDestinationDetails(
            // Use renamed interface
            selectedDestination.title,
            selections,
          );

          // Add Pexels images for cities
          if (details.cities && details.cities.length > 0) {
            const { getImageFromPexels } = await import("../lib/pexels");

            // Process each city to get better images
            for (const city of details.cities) {
              try {
                // Get a high-quality image for the city
                const cityImage = await getImageFromPexels(
                  `${city.name} ${selectedDestination.title} city skyline`,
                  "landscape",
                );
                city.image =
                  cityImage ||
                  `https://source.unsplash.com/featured/?${encodeURIComponent(`${city.name} ${selectedDestination.title} city`)}`;
                console.log(`Set city image for ${city.name} to ${city.image}`);

                // Also update activity images if they exist
                if (city.activities && Array.isArray(city.activities)) {
                  for (const activity of city.activities) {
                    try {
                      const activityImage = await getImageFromPexels(
                        `${activity.name} ${city.name} ${selectedDestination.title}`,
                        "landscape",
                      );
                      activity.image =
                        activityImage ||
                        `https://source.unsplash.com/featured/?${encodeURIComponent(`${activity.name} ${city.name}`)}`;
                      console.log(
                        `Set activity image for ${activity.name} to ${activity.image}`,
                      );
                    } catch (imgError) {
                      console.error(
                        `Error fetching image for activity ${activity.name}:`,
                        imgError,
                      );
                      activity.image = `https://source.unsplash.com/featured/?${encodeURIComponent(`${activity.name} ${city.name}`)}`;
                    }
                  }
                }

                // Update event images if they exist
                if (city.events && Array.isArray(city.events)) {
                  for (const event of city.events) {
                    try {
                      const eventImage = await getImageFromPexels(
                        `${event.name} ${city.name} event`,
                        "landscape",
                      );
                      event.image =
                        eventImage ||
                        `https://source.unsplash.com/featured/?${encodeURIComponent(`${event.name} ${city.name} event`)}`;
                      console.log(
                        `Set event image for ${event.name} to ${event.image}`,
                      );
                    } catch (imgError) {
                      console.error(
                        `Error fetching image for event ${event.name}:`,
                        imgError,
                      );
                      event.image = `https://source.unsplash.com/featured/?${encodeURIComponent(`${event.name} ${city.name} event`)}`;
                    }
                  }
                }
              } catch (cityImgError) {
                console.error(
                  `Error fetching image for city ${city.name}:`,
                  cityImgError,
                );
                city.image = `https://source.unsplash.com/featured/?${encodeURIComponent(`${city.name} ${selectedDestination.title} city`)}`;
              }
            }
          }

          // Save the destination details to the database for future use
          try {
            const { data: userData } = await supabase.auth.getUser();
            if (userData.user) {
              await supabase.from("destination_details").insert({
                user_id: userData.user.id,
                title: selectedDestination.title,
                details: details,
                preferences: selections,
              });
              console.log("Saved destination details to database");
            }
          } catch (saveError) {
            console.error(
              "Error saving destination details to database:",
              saveError,
            );
          }
        }

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

  const handleOptionSelect = async (option: string) => {
    // Special handling for specific country input when currentQuestionIndex is -1
    if (currentQuestionIndex === -1) {
      if (option === "confirm" && selections.specificCountry?.[0]) {
        const countryName = selections.specificCountry[0];

        // Add user's country selection as a message
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: "user",
            content: countryName,
            timestamp: new Date(),
          },
        ]);

        // Move to the next regular question (travelMonth)
        setCurrentQuestionIndex(1);

        // Add next question as a message
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            type: "bot",
            content: preferenceOptions[1].question,
            timestamp: new Date(),
          },
        ]);

        return;
      } else {
        // Update the specific country selection
        setSelections({
          ...selections,
          specificCountry: [option],
        });
        return;
      }
    }

    const currentCategory = preferenceOptions[currentQuestionIndex].category;
    const currentSelections = selections[currentCategory] || [];

    // Special handling for destinationType category
    if (currentCategory === "destinationType") {
      // Clear any previous selections in this category
      const updatedSelections = [option];

      setSelections({
        ...selections,
        [currentCategory]: updatedSelections,
      });

      // If user chose specific country, add a new question for country input
      if (option === "I have a specific country in mind") {
        // Add a new question for specific country input
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: "user",
            content: option,
            timestamp: new Date(),
          },
          {
            id: (Date.now() + 1).toString(),
            type: "bot",
            content: "What country would you like to visit?",
            timestamp: new Date(),
          },
        ]);

        // Add a temporary category for specific country input
        setCurrentQuestionIndex(-1); // Special index to handle country input
        return;
      }

      return;
    }

    // Special handling for tripPreferences category
    if (currentCategory === "tripPreferences") {
      // Clear any previous selections in this category
      const updatedSelections = [option];

      setSelections({
        ...selections,
        [currentCategory]: updatedSelections,
      });

      // If user chose to use profile preferences, load them
      if (option === "Use my profile preferences") {
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            const { data: profileData, error } = await supabase
              .from("profiles")
              .select("travel_interests, travel_styles")
              .eq("id", userData.user.id)
              .single();

            if (!error && profileData) {
              // Convert profile preferences to the format expected by the chat interface
              const profilePreferences: Record<string, string[]> = {};

              // Add travel types and styles from travel_styles
              if (profileData.travel_styles) {
                // Add travel types from Travel Type & Group category
                if (profileData.travel_styles["Travel Type & Group"]) {
                  profilePreferences.travelType =
                    profileData.travel_styles["Travel Type & Group"];
                }

                // Add travel styles from Pace & Detail Level category
                if (profileData.travel_styles["Pace & Detail Level"]) {
                  profilePreferences.travelStyle =
                    profileData.travel_styles["Pace & Detail Level"];
                }

                // Add budget preferences from Budget category
                if (profileData.travel_styles["Budget"]) {
                  profilePreferences.budget =
                    profileData.travel_styles["Budget"];
                }

                // Add accommodation preferences
                if (profileData.travel_styles["Accommodation Style"]) {
                  profilePreferences.accommodation =
                    profileData.travel_styles["Accommodation Style"];
                }

                // Add transportation preferences
                if (profileData.travel_styles["Transportation Preference"]) {
                  profilePreferences.transportation =
                    profileData.travel_styles["Transportation Preference"];
                }
              }

              // Add interests from travel_interests
              if (profileData.travel_interests) {
                const allInterests: string[] = [];
                Object.values(profileData.travel_interests).forEach(
                  (categoryInterests) => {
                    if (Array.isArray(categoryInterests)) {
                      allInterests.push(...categoryInterests.slice(0, 5)); // Limit to 5 interests per category
                    }
                  },
                );
                profilePreferences.interests = allInterests.slice(0, 10); // Limit to 10 total interests
              }

              // Merge with current selections
              setSelections((prev) => ({
                ...prev,
                ...profilePreferences,
              }));

              toast({
                title: "Profile preferences loaded",
                description:
                  "Your saved preferences have been applied to this trip.",
              });
            } else {
              toast({
                title: "No preferences found",
                description:
                  "We couldn't find any saved preferences in your profile.",
                variant: "destructive",
              });
            }
          }
        } catch (error) {
          console.error("Error loading profile preferences:", error);
          toast({
            title: "Error",
            description: "Failed to load your profile preferences.",
            variant: "destructive",
          });
        }
      } else if (option === "Customize preferences for this trip") {
        // Show the preferences modal with pre-filled preferences from profile if available
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            const { data: profileData, error } = await supabase
              .from("profiles")
              .select("travel_interests, travel_styles")
              .eq("id", userData.user.id)
              .single();

            if (!error && profileData) {
              // Pre-fill with profile preferences
              const profilePreferences: Record<string, string[]> = {};

              // Add travel types and styles from travel_styles
              if (profileData.travel_styles) {
                // Add travel types from Travel Type & Group category
                if (profileData.travel_styles["Travel Type & Group"]) {
                  profilePreferences.travelType =
                    profileData.travel_styles["Travel Type & Group"];
                }

                // Add travel styles from Pace & Detail Level category
                if (profileData.travel_styles["Pace & Detail Level"]) {
                  profilePreferences.travelStyle =
                    profileData.travel_styles["Pace & Detail Level"];
                }

                // Add budget preferences from Budget category
                if (profileData.travel_styles["Budget"]) {
                  profilePreferences.budget =
                    profileData.travel_styles["Budget"];
                }

                // Add accommodation preferences
                if (profileData.travel_styles["Accommodation Style"]) {
                  profilePreferences.accommodation =
                    profileData.travel_styles["Accommodation Style"];
                }

                // Add transportation preferences
                if (profileData.travel_styles["Transportation Preference"]) {
                  profilePreferences.transportation =
                    profileData.travel_styles["Transportation Preference"];
                }
              }

              // Add interests from travel_interests
              if (profileData.travel_interests) {
                const allInterests: string[] = [];
                Object.values(profileData.travel_interests).forEach(
                  (categoryInterests) => {
                    if (Array.isArray(categoryInterests)) {
                      allInterests.push(...categoryInterests);
                    }
                  },
                );
                profilePreferences.interests = allInterests;
              }

              // Update selections with profile preferences
              setSelections((prev) => ({
                ...prev,
                ...profilePreferences,
              }));
            }
          }
        } catch (error) {
          console.error("Error pre-filling preferences:", error);
        }

        // Show the preferences modal
        setShowPreferencesModal(true);

        // Add the PreferencesModal component to the render tree
        return;
      }
      return;
    }

    // Normal handling for other categories
    const updatedSelections = currentSelections.includes(option)
      ? currentSelections.filter((item) => item !== option)
      : [...currentSelections, option];

    setSelections({
      ...selections,
      [currentCategory]: updatedSelections,
    });
  };

  const handleNext = async () => {
    // Special handling for specific country input
    if (currentQuestionIndex === -1) {
      if (selections.specificCountry?.[0]) {
        const countryName = selections.specificCountry[0];

        // Add user's country selection as a message
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: "user",
            content: countryName,
            timestamp: new Date(),
          },
        ]);

        // Move to the next regular question (travelMonth)
        setCurrentQuestionIndex(1);

        // Add next question as a message
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            type: "bot",
            content: preferenceOptions[1].question,
            timestamp: new Date(),
          },
        ]);

        return;
      } else {
        toast({
          title: "Country required",
          description: "Please enter a country name",
          variant: "destructive",
        });
        return;
      }
    }

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

    // No special handling needed here anymore since we're using a modal
    // Just proceed with the normal flow

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

        // Use the searchService to find destinations
        let fetchedDestinations = [];
        try {
          // Import the searchService
          const { searchDestinations } = await import("../lib/searchService");

          // Check if user specified a country directly
          if (
            selections.destinationType?.[0] ===
              "I have a specific country in mind" &&
            selections.specificCountry?.[0]
          ) {
            // Create a destination directly from the specified country
            const countryName = selections.specificCountry[0];

            // Import the Pexels image function
            const { getImageFromPexels } = await import("../lib/pexels");

            // Get image from Pexels API
            let imageUrl;
            try {
              imageUrl = await getImageFromPexels(
                `${countryName} travel`,
                "landscape",
              );
            } catch (error) {
              console.error(`Error fetching image for ${countryName}:`, error);
              imageUrl = `https://source.unsplash.com/featured/?${encodeURIComponent(countryName)},travel`;
            }

            // Create a single destination for the specified country
            fetchedDestinations = [
              {
                title: countryName,
                description: `Explore the beauty and culture of ${countryName}. This destination was selected based on your specific request.`,
                image: imageUrl,
                matchPercentage: 100,
                rating: 4.8,
                priceRange: "Varies by region",
              },
            ];

            // Skip the rest of the function and directly show this destination
            setDestinations(fetchedDestinations);

            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                type: "bot",
                content: (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">Your Selected Destination</h3>
                    </div>
                    {/* Destinations will be rendered conditionally below based on selectedDestination state */}
                  </div>
                ),
                timestamp: new Date(),
              },
            ]);

            setIsSearching(false);
            return;
          } else {
            // This will check the search_criteria table first, then fall back to Gemini API if needed
            fetchedDestinations = await searchDestinations(selections);
          }

          console.log("Fetched destinations:", fetchedDestinations);
        } catch (searchError) {
          console.error("Error searching for destinations:", searchError);
        }

        setDestinations(fetchedDestinations); // Store destinations in state

        // If we were in edit mode, clear the previous itinerary now
        if (selectedDestination?.itinerary) {
          setSelectedDestination(null);
          localStorage.removeItem("selectedDestination");
          localStorage.removeItem("generatedItinerary");

          // Dispatch event to clear the schedule view
          const itineraryUpdatedEvent = new CustomEvent("itineraryUpdated", {
            detail: { itinerary: null, status: "clear" },
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
    <Card className="w-full h-full bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-2 sm:p-4 border-b space-y-2 sm:space-y-4 sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span>SagaScout</span>
            <Badge variant="secondary" className="text-xs font-normal">
              NEW
            </Badge>
          </h2>
          <div className="flex items-center gap-2">
            {selectedDestination?.itinerary && (
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  if (!selectedDestination) return;

                  try {
                    setIsGeneratingItinerary(true);
                    setLocalGenerationProgress(0);

                    // Dispatch event to show progress
                    const startEvent = new CustomEvent("itineraryUpdated", {
                      detail: { status: "generating", progress: 0 },
                    });
                    window.dispatchEvent(startEvent);

                    // Set the context state
                    setIsGenerating(true);
                    setGenerationProgress(0);

                    // Update progress periodically
                    const progressInterval = setInterval(() => {
                      setLocalGenerationProgress((prev) => {
                        const increment = 5 + Math.floor(Math.random() * 10);
                        const newProgress = Math.min(95, prev + increment);
                        setGenerationProgress(newProgress);
                        window.dispatchEvent(
                          new CustomEvent("itineraryUpdated", {
                            detail: {
                              status: "generating",
                              progress: newProgress,
                            },
                          }),
                        );
                        return newProgress;
                      });
                    }, 2000);

                    // Extract start date from existing itinerary
                    const startDateStr =
                      selectedDestination.itinerary.days[0].date;
                    let startDate;
                    try {
                      startDate = new Date(startDateStr);
                      // Check if date is valid
                      if (isNaN(startDate.getTime())) {
                        console.error("Invalid date string:", startDateStr);
                        startDate = new Date(); // Fallback to current date
                      }
                    } catch (error) {
                      console.error("Error parsing date:", error);
                      startDate = new Date(); // Fallback to current date
                    }

                    // Extract duration from existing itinerary
                    const duration =
                      selectedDestination.itinerary.days.length || 3; // Fallback to 3 days if length is 0

                    // Generate new itinerary
                    const { generateItinerary } = await import("../lib/gemini");

                    // Add a small delay to ensure API rate limits aren't hit
                    await new Promise((resolve) => setTimeout(resolve, 1000));

                    const newItinerary = await generateItinerary(
                      selectedDestination.title,
                      selections,
                      startDate,
                      duration,
                    );

                    // Store the itinerary in localStorage
                    localStorage.setItem(
                      "generatedItinerary",
                      JSON.stringify(newItinerary),
                    );

                    // Update the selected destination with the new itinerary
                    const updatedDestination = {
                      ...selectedDestination,
                      itinerary: newItinerary,
                    };
                    setSelectedDestination(updatedDestination);
                    setDestinations([updatedDestination]);
                    localStorage.setItem(
                      "selectedDestination",
                      JSON.stringify(updatedDestination),
                    );

                    // Clear the progress interval
                    clearInterval(progressInterval);

                    // Update the itinerary in the context and reset generation state
                    setItinerary(newItinerary);
                    setIsGenerating(false);
                    setGenerationProgress(100);

                    // Dispatch event to notify ScheduleView that generation is complete
                    const completeEvent = new CustomEvent("itineraryUpdated", {
                      detail: { status: "complete", itinerary: newItinerary },
                    });
                    window.dispatchEvent(completeEvent);

                    // Set a flag in localStorage to trigger a reload in ScheduleView
                    localStorage.setItem(
                      "itineraryUpdate",
                      Date.now().toString(),
                    );

                    // Force a re-render by updating URL parameter
                    const url = new URL(window.location.href);
                    url.searchParams.set(
                      "itineraryUpdate",
                      Date.now().toString(),
                    );
                    window.history.replaceState({}, "", url);

                    // Dispatch a custom event to notify ScheduleView
                    const customEvent = new CustomEvent("itineraryChanged", {
                      detail: { timestamp: Date.now() },
                    });
                    document.dispatchEvent(customEvent);

                    toast({
                      title: "Itinerary Regenerated",
                      description:
                        "Your itinerary has been regenerated with new activities.",
                    });
                  } catch (error) {
                    console.error("Error regenerating itinerary:", error);
                    toast({
                      title: "Error",
                      description:
                        "Failed to regenerate itinerary. Please try again.",
                      variant: "destructive",
                    });

                    // Notify schedule view of the error
                    const errorEvent = new CustomEvent("itineraryUpdated", {
                      detail: { status: "error" },
                    });
                    window.dispatchEvent(errorEvent);
                  } finally {
                    setIsGeneratingItinerary(false);
                  }
                }}
                title="Regenerate itinerary"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                // Reset the chat and clear all selections and destination
                setCurrentQuestionIndex(0);
                // Clear the selected destination and itinerary
                setSelectedDestination(null);
                setSelections({});
                localStorage.removeItem("selectedDestination");
                localStorage.removeItem("generatedItinerary");
                localStorage.removeItem("selectedPreferences");

                // Dispatch event to clear the schedule view
                const itineraryUpdatedEvent = new CustomEvent(
                  "itineraryUpdated",
                  {
                    detail: { itinerary: null, status: "clear" },
                  },
                );
                window.dispatchEvent(itineraryUpdatedEvent);

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
          </div>
        </div>
        {/* Current Trip Details */}
        <div className="space-y-1 sm:space-y-2 bg-muted p-2 sm:p-3 rounded-lg">
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
              <div className="flex gap-2 flex-wrap max-h-24 overflow-y-auto">
                {Object.entries(selections).flatMap(([category, values]) => {
                  // Skip certain categories
                  if (
                    category === "tripPreferences" ||
                    category === "customizing" ||
                    category === "specificCountry"
                  ) {
                    return [];
                  }

                  // Skip showing "I have a specific country in mind" if we have a specific country
                  if (
                    category === "destinationType" &&
                    values.includes("I have a specific country in mind")
                  ) {
                    return [];
                  }

                  // Only show specific country if destinationType is "I have a specific country in mind"
                  if (
                    category === "specificCountry" &&
                    !selections.destinationType?.includes(
                      "I have a specific country in mind",
                    )
                  ) {
                    return [];
                  }

                  return values.map((value) => (
                    <Badge
                      key={`${category}-${value}`}
                      variant="secondary"
                      className="text-xs"
                    >
                      {value}
                    </Badge>
                  ));
                })}

                {/* Show the specific country if entered and destinationType is appropriate */}
                {selections.specificCountry?.[0] &&
                  selections.destinationType?.includes(
                    "I have a specific country in mind",
                  ) && (
                    <Badge
                      key="specific-country"
                      variant="secondary"
                      className="text-xs"
                    >
                      {selections.specificCountry[0]}
                    </Badge>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1 p-2 sm:p-4">
        {showingResults ? (
          <div className="space-y-6">
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
                  {currentQuestionIndex === -1
                    ? "What country would you like to visit?"
                    : currentQuestionIndex < preferenceOptions.length
                      ? preferenceOptions[currentQuestionIndex].question
                      : "Thanks! Let me find the perfect destinations based on your preferences..."}
                </p>
              </div>
            </div>
            {(currentQuestionIndex < preferenceOptions.length ||
              currentQuestionIndex === -1) && (
              <div className="mt-4">
                {currentQuestionIndex === -1 ? (
                  <PreferenceSelector
                    options={[]}
                    selected={selections.specificCountry || []}
                    onSelect={handleOptionSelect}
                    category="specificCountry"
                  />
                ) : (
                  <PreferenceSelector
                    options={preferenceOptions[currentQuestionIndex].options}
                    selected={
                      selections[
                        preferenceOptions[currentQuestionIndex].category
                      ] || []
                    }
                    onSelect={handleOptionSelect}
                    category={preferenceOptions[currentQuestionIndex].category}
                  />
                )}
                <div className="flex gap-1 sm:gap-2 mt-2 sm:mt-4 sticky bottom-0 bg-white py-1 sm:py-2 z-10">
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
                      (currentQuestionIndex !== -1 &&
                        !(
                          selections[
                            preferenceOptions[currentQuestionIndex]?.category
                          ]?.length > 0
                        ))
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
          // Make sure we're using the correct destination that was clicked on
          const selectedDest = selectedDestination;
          if (selectedDest) {
            // Call the generate itinerary function with the selected date
            const generateFn = async () => {
              try {
                setIsGeneratingItinerary(true);
                setLocalGenerationProgress(0);

                // Dispatch event to clear the schedule view and show progress
                const startEvent = new CustomEvent("itineraryUpdated", {
                  detail: { status: "generating", progress: 0 },
                });
                window.dispatchEvent(startEvent);

                // Set the context state
                setIsGenerating(true);
                setGenerationProgress(0);

                // Update progress periodically with consistent forward progress
                const progressInterval = setInterval(() => {
                  setLocalGenerationProgress((prev) => {
                    // Ensure progress always increases by 5-15%
                    const increment = 5 + Math.floor(Math.random() * 10);
                    const newProgress = Math.min(95, prev + increment);

                    // Update both the context state and dispatch the event
                    setGenerationProgress(newProgress);
                    window.dispatchEvent(
                      new CustomEvent("itineraryUpdated", {
                        detail: { status: "generating", progress: newProgress },
                      }),
                    );

                    return newProgress;
                  });
                }, 2000);

                // First check if there's a matching public itinerary in the database
                let itinerary;
                try {
                  const { data: userData } = await supabase.auth.getUser();
                  if (userData.user) {
                    // Check for public itineraries matching the destination and preferences
                    const { data: matchingItineraries } = await supabase
                      .from("itineraries")
                      .select("*")
                      .eq("destination", selectedDest.title)
                      .eq("is_public", true)
                      .limit(1);

                    if (matchingItineraries && matchingItineraries.length > 0) {
                      // Found a matching public itinerary
                      console.log(
                        "Found matching public itinerary:",
                        matchingItineraries[0],
                      );
                      itinerary = matchingItineraries[0].itinerary_data;

                      // Adjust the dates to match the selected start date
                      if (itinerary.days && itinerary.days.length > 0) {
                        const newDays = [...itinerary.days];
                        const startDateObj = new Date(date);

                        for (let i = 0; i < newDays.length; i++) {
                          const dayDate = new Date(startDateObj);
                          dayDate.setDate(startDateObj.getDate() + i);
                          newDays[i].date = dayDate.toISOString().split("T")[0];
                        }

                        itinerary.days = newDays;
                      }
                    }
                  }
                } catch (dbError) {
                  console.error(
                    "Error checking for public itineraries:",
                    dbError,
                  );
                }

                // If no matching itinerary was found, generate a new one
                if (!itinerary) {
                  const { generateItinerary } = await import("../lib/gemini");
                  const duration = selections.duration?.[0]
                    ?.toLowerCase()
                    .includes("week")
                    ? 7
                    : 3;
                  itinerary = await generateItinerary(
                    selectedDest.title,
                    selections,
                    date,
                    duration,
                  );
                }
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

                // Update the selected destination with the new itinerary
                const updatedDestination = {
                  ...selectedDest,
                  itinerary: itinerary,
                };
                setSelectedDestination(updatedDestination);
                setDestinations([updatedDestination]);
                localStorage.setItem(
                  "selectedDestination",
                  JSON.stringify(updatedDestination),
                );

                // Save the destination to the destinations table
                try {
                  const { data: userData } = await supabase.auth.getUser();
                  if (userData.user) {
                    // Check if this destination already exists for this user
                    const { data: existingDestinations } = await supabase
                      .from("destinations")
                      .select("id")
                      .eq("user_id", userData.user.id)
                      .eq("title", selectedDest.title)
                      .limit(1);

                    if (
                      !existingDestinations ||
                      existingDestinations.length === 0
                    ) {
                      // Insert the destination if it doesn't exist
                      await supabase.from("destinations").insert({
                        user_id: userData.user.id,
                        title: selectedDest.title,
                        description: selectedDest.description,
                        image: selectedDest.image,
                        match_percentage: selectedDest.matchPercentage,
                        rating: selectedDest.rating,
                        price_range: selectedDest.priceRange,
                        preferences: selections,
                      });
                      console.log("Saved destination to destinations table");
                    } else {
                      console.log("Destination already exists in database");
                    }
                  }
                } catch (saveError) {
                  console.error(
                    "Error saving destination to database:",
                    saveError,
                  );
                }

                // Clear the progress interval
                clearInterval(progressInterval);

                // Update the itinerary in the context and reset generation state
                setItinerary(itinerary);
                setIsGenerating(false);
                setGenerationProgress(100);

                // Dispatch event to notify ScheduleView that generation is complete
                const completeEvent = new CustomEvent("itineraryUpdated", {
                  detail: { status: "complete", itinerary: itinerary },
                });
                window.dispatchEvent(completeEvent);

                // Set a flag in localStorage to trigger a reload in ScheduleView
                localStorage.setItem("itineraryUpdate", Date.now().toString());

                // Force a re-render by updating URL parameter
                const url = new URL(window.location.href);
                url.searchParams.set("itineraryUpdate", Date.now().toString());
                window.history.replaceState({}, "", url);

                // Dispatch a custom event to notify ScheduleView
                const customEvent = new CustomEvent("itineraryChanged", {
                  detail: { timestamp: Date.now() },
                });
                document.dispatchEvent(customEvent);

                toast({
                  title: "Itinerary Generated",
                  description: `Your ${itinerary.days.length}-day itinerary for ${selectedDest.title} has been created.`,
                });
              } catch (error) {
                console.error("Error generating itinerary:", error);
                toast({
                  title: "Error",
                  description:
                    "Failed to generate itinerary. Please try again.",
                  variant: "destructive",
                });

                // Notify schedule view of the error
                const errorEvent = new CustomEvent("itineraryUpdated", {
                  detail: { status: "error" },
                });
                window.dispatchEvent(errorEvent);
              } finally {
                setIsGeneratingItinerary(false);
                setShowDatePickerDialog(false);
              }
            };

            // Execute the generate function
            generateFn();
          }
        }}
      />

      {/* Preferences Modal */}
      {showPreferencesModal && (
        <PreferencesModal
          open={showPreferencesModal}
          onOpenChange={setShowPreferencesModal}
          initialPreferences={selections}
          onSave={(newPreferences) => {
            setSelections((prev) => ({
              ...prev,
              ...newPreferences,
            }));
            setShowPreferencesModal(false);
            toast({
              title: "Preferences Updated",
              description: "Your travel preferences have been updated.",
            });
          }}
        />
      )}
    </Card>
  );
};

export default ChatInterface;
