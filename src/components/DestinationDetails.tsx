import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  ArrowLeft,
  Calendar as CalendarIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "./ui/use-toast";
import { format } from "date-fns";

interface Destination {
  id: string;
  title: string;
  description: string;
  image: string;
  match_percentage: number;
  rating: number;
  price_range: string;
  created_at: string;
  preferences?: Record<string, string[]>;
}

interface DestinationDetailsData {
  cities: Array<{
    name: string;
    description: string;
    image: string;
    activities: Array<{
      name: string;
      description: string;
      duration: string;
      image: string;
      bestTime: string;
      price: string;
    }>;
    events: Array<{
      name: string;
      description: string;
      date: string;
      image: string;
    }>;
  }>;
  weather: {
    temperature: string;
    conditions: string;
    rainfall: string;
  };
  transportation: {
    options: string[];
    costs: string;
  };
  accommodation: {
    types: string[];
    priceRanges: string;
    recommendations: string[];
  };
}

interface DestinationDetails {
  id: string;
  user_id: string;
  title: string;
  details: DestinationDetailsData;
  preferences: Record<string, string[]>;
  created_at: string;
}

interface Itinerary {
  id: string;
  user_id: string;
  destination: string;
  summary: string;
  total_activities: number;
  estimated_cost: string;
  created_at: string;
  itinerary_data: {
    days: Array<{
      date: string;
      activities: Array<{
        time: string;
        title: string;
        duration: string;
        location: string;
        description?: string;
        type?: string;
      }>;
    }>;
  };
}

const DestinationDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [destination, setDestination] = useState<Destination | null>(null);
  const [detailsEntries, setDetailsEntries] = useState<DestinationDetails[]>(
    [],
  );
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [relatedDestinations, setRelatedDestinations] = useState<Destination[]>(
    [],
  );
  const [selectedDestinationId, setSelectedDestinationId] = useState<
    string | null
  >(null);
  const [selectedDetailsId, setSelectedDetailsId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const fetchDestinationData = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        // Fetch destination
        const { data: destinationData, error: destinationError } =
          await supabase.from("destinations").select("*").eq("id", id).single();

        if (destinationError) throw destinationError;
        setDestination(destinationData);
        setSelectedDestinationId(destinationData.id);

        // Fetch all related destinations with the same title but different search criteria
        const { data: relatedData, error: relatedError } = await supabase
          .from("destinations")
          .select("*")
          .eq("title", destinationData.title)
          .order("match_percentage", { ascending: false });

        if (relatedError) throw relatedError;
        setRelatedDestinations(relatedData || []);

        // Fetch all destination details entries for this destination
        const { data: detailsData, error: detailsError } = await supabase
          .from("destination_details")
          .select("*")
          .eq("title", destinationData.title)
          .order("created_at", { ascending: false });

        if (!detailsError && detailsData && detailsData.length > 0) {
          setDetailsEntries(detailsData);
          setSelectedDetailsId(detailsData[0].id);
        }

        // Fetch public itineraries for this destination
        const { data: itinerariesData, error: itinerariesError } =
          await supabase
            .from("itineraries")
            .select("*")
            .eq("destination", destinationData.title)
            .eq("is_public", true)
            .order("created_at", { ascending: false });

        if (itinerariesError) throw itinerariesError;
        setItineraries(itinerariesData || []);
      } catch (error) {
        console.error("Error fetching destination data:", error);
        toast({
          title: "Error",
          description: "Failed to load destination details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDestinationData();
  }, [id, toast]);

  const handleUseItinerary = (itinerary: Itinerary) => {
    // Store the itinerary in localStorage
    localStorage.setItem(
      "generatedItinerary",
      JSON.stringify(itinerary.itinerary_data),
    );

    // Store the destination in localStorage
    if (destination) {
      localStorage.setItem(
        "selectedDestination",
        JSON.stringify({
          title: destination.title,
          description: destination.description,
          image: destination.image,
          matchPercentage: destination.match_percentage,
          rating: destination.rating,
          priceRange: destination.price_range,
          itinerary: itinerary.itinerary_data,
        }),
      );
    }

    // Set a flag in localStorage to trigger a reload in ScheduleView
    localStorage.setItem("itineraryUpdate", Date.now().toString());

    // Navigate to the planner page
    navigate("/planner");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Destination not found</h2>
        <Button onClick={() => navigate("/")}>Back to Destinations</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Button
        variant="ghost"
        className="mb-6 flex items-center gap-2"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Destinations
      </Button>

      {/* Hero Section */}
      <div className="relative h-96 rounded-xl overflow-hidden mb-8">
        <img
          src={destination.image}
          alt={destination.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = `https://source.unsplash.com/featured/?${encodeURIComponent(destination.title)},travel&w=800&q=80`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-8">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {destination.match_percentage}% Match
            </Badge>
            <div className="flex items-center text-yellow-400">
              <Star className="fill-yellow-400 h-4 w-4 mr-1" />
              <span className="text-white">
                {destination.rating.toFixed(1)}
              </span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            {destination.title}
          </h1>
          <p className="text-white/80 max-w-2xl">{destination.description}</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      {/* Related Destinations Selector */}
      {relatedDestinations.length > 1 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">
            Search Criteria Variations
          </h3>
          <div className="flex flex-wrap gap-3">
            {relatedDestinations.map((relDest) => (
              <Button
                key={relDest.id}
                variant={
                  selectedDestinationId === relDest.id ? "default" : "outline"
                }
                size="sm"
                onClick={() => {
                  setSelectedDestinationId(relDest.id);
                  setDestination(relDest);
                }}
                className="flex flex-col items-start h-auto py-2 px-3"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {relDest.match_percentage}% Match
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({new Date(relDest.created_at).toLocaleDateString()})
                  </span>
                </div>
                {relDest.preferences && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(relDest.preferences).flatMap(
                      ([category, values]) =>
                        values.slice(0, 2).map((value) => (
                          <Badge
                            key={`${category}-${value}`}
                            variant="secondary"
                            className="text-xs"
                          >
                            {value}
                          </Badge>
                        )),
                    )}
                    {Object.values(relDest.preferences).flat().length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{Object.values(relDest.preferences).flat().length - 2}{" "}
                        more
                      </Badge>
                    )}
                  </div>
                )}
              </Button>
            ))}
          </div>
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-8"
      >
        <TabsList className="w-full justify-start border-b rounded-none p-0 h-auto">
          <TabsTrigger
            value="overview"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-3"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="itineraries"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-3"
          >
            Public Itineraries ({itineraries.length})
          </TabsTrigger>
          {destination?.preferences &&
            Object.keys(destination.preferences).length > 0 && (
              <TabsTrigger
                value="preferences"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-3"
              >
                Search Criteria
              </TabsTrigger>
            )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8">
          {detailsEntries.length > 0 ? (
            <>
              {/* Details Entry Selector */}
              {detailsEntries.length > 1 && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium mb-3">
                    Destination Details Variations
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {detailsEntries.map((entry) => (
                      <Button
                        key={entry.id}
                        variant={
                          selectedDetailsId === entry.id ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setSelectedDetailsId(entry.id)}
                        className="flex flex-col items-start h-auto py-2 px-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            Details #{detailsEntries.indexOf(entry) + 1}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({new Date(entry.created_at).toLocaleDateString()})
                          </span>
                        </div>
                        {entry.preferences && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(entry.preferences).flatMap(
                              ([category, values]) =>
                                values.slice(0, 2).map((value) => (
                                  <Badge
                                    key={`${category}-${value}`}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {value}
                                  </Badge>
                                )),
                            )}
                            {Object.values(entry.preferences).flat().length >
                              2 && (
                              <Badge variant="outline" className="text-xs">
                                +
                                {Object.values(entry.preferences).flat()
                                  .length - 2}{" "}
                                more
                              </Badge>
                            )}
                          </div>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Display the selected details entry */}
              {detailsEntries.map(
                (entry) =>
                  entry.id === selectedDetailsId && (
                    <div key={entry.id} className="space-y-8">
                      {/* Preferences Summary */}
                      <Card className="p-4 bg-muted/50 border-primary/20">
                        <h3 className="font-medium mb-2">
                          Search Criteria for This View
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(entry.preferences).flatMap(
                            ([category, values]) =>
                              values.map((value) => (
                                <Badge
                                  key={`${category}-${value}`}
                                  variant="outline"
                                >
                                  {value}
                                </Badge>
                              )),
                          )}
                        </div>
                      </Card>

                      {/* Cities Section */}
                      <section>
                        <h2 className="text-2xl font-semibold mb-6">
                          Top Cities to Visit
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {entry.details.cities.map((city, index) => (
                            <Card key={index} className="overflow-hidden">
                              <div className="h-48 relative">
                                <img
                                  src={city.image}
                                  alt={city.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="p-4">
                                <h3 className="text-xl font-semibold mb-2">
                                  {city.name}
                                </h3>
                                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                                  {city.description}
                                </p>

                                <h4 className="font-medium text-sm mb-2">
                                  Top Activities:
                                </h4>
                                <ul className="space-y-2">
                                  {city.activities
                                    .slice(0, 3)
                                    .map((activity, idx) => (
                                      <li
                                        key={idx}
                                        className="flex items-start gap-2"
                                      >
                                        <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                                        <div>
                                          <span className="text-sm font-medium">
                                            {activity.name}
                                          </span>
                                          <div className="text-xs text-gray-500">
                                            {activity.duration} •{" "}
                                            {activity.price}
                                          </div>
                                        </div>
                                      </li>
                                    ))}
                                </ul>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </section>

                      {/* Travel Info Section */}
                      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Weather */}
                        <Card className="p-6">
                          <h3 className="text-lg font-semibold mb-4">
                            Weather
                          </h3>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Temperature</span>
                              <span className="font-medium">
                                {entry.details.weather.temperature}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Conditions</span>
                              <span className="font-medium">
                                {entry.details.weather.conditions}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Rainfall</span>
                              <span className="font-medium">
                                {entry.details.weather.rainfall}
                              </span>
                            </div>
                          </div>
                        </Card>

                        {/* Transportation */}
                        <Card className="p-6">
                          <h3 className="text-lg font-semibold mb-4">
                            Transportation
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <span className="text-gray-600 block mb-2">
                                Options
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {entry.details.transportation.options.map(
                                  (option, idx) => (
                                    <Badge key={idx} variant="outline">
                                      {option}
                                    </Badge>
                                  ),
                                )}
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Estimated Costs
                              </span>
                              <span className="font-medium">
                                {entry.details.transportation.costs}
                              </span>
                            </div>
                          </div>
                        </Card>

                        {/* Accommodation */}
                        <Card className="p-6">
                          <h3 className="text-lg font-semibold mb-4">
                            Accommodation
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <span className="text-gray-600 block mb-2">
                                Types
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {entry.details.accommodation.types.map(
                                  (type, idx) => (
                                    <Badge key={idx} variant="outline">
                                      {type}
                                    </Badge>
                                  ),
                                )}
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Price Ranges
                              </span>
                              <span className="font-medium">
                                {entry.details.accommodation.priceRanges}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600 block mb-2">
                                Recommended Areas
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {entry.details.accommodation.recommendations.map(
                                  (rec, idx) => (
                                    <Badge key={idx} variant="outline">
                                      {rec}
                                    </Badge>
                                  ),
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      </section>
                    </div>
                  ),
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No detailed information available for this destination.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Itineraries Tab */}
        <TabsContent value="itineraries" className="space-y-8">
          <h2 className="text-2xl font-semibold mb-6">
            Public Itineraries for {destination.title}
          </h2>

          {itineraries.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4">
                No public itineraries available for this destination yet.
              </p>
              <Button onClick={() => navigate("/planner")}>
                Create Your Own Itinerary
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {itineraries.map((itinerary) => (
                <Card key={itinerary.id} className="overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {itinerary.summary}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            <span>
                              {itinerary.itinerary_data.days.length} days
                            </span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{itinerary.total_activities} activities</span>
                          </div>
                          <div>
                            <span className="font-medium">
                              {itinerary.estimated_cost}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button onClick={() => handleUseItinerary(itinerary)}>
                        Use This Itinerary
                      </Button>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Itinerary Preview</h4>
                          <span className="text-sm text-gray-500">
                            Created{" "}
                            {format(
                              new Date(itinerary.created_at),
                              "MMM d, yyyy",
                            )}
                          </span>
                        </div>
                      </div>

                      <ScrollArea className="h-64">
                        <div className="p-4">
                          {itinerary.itinerary_data.days.map(
                            (day, dayIndex) => (
                              <div key={dayIndex} className="mb-6 last:mb-0">
                                <h5 className="font-medium mb-3">
                                  Day {dayIndex + 1}: {day.date}
                                </h5>
                                <div className="space-y-3 pl-4 border-l border-gray-200">
                                  {day.activities.map((activity, actIndex) => (
                                    <div
                                      key={actIndex}
                                      className="relative pl-6"
                                    >
                                      <div className="absolute left-[-13px] top-1.5 w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                                        <span className="text-xs text-primary font-medium">
                                          {actIndex + 1}
                                        </span>
                                      </div>
                                      <div className="flex items-start">
                                        <span className="text-sm font-medium min-w-[60px]">
                                          {activity.time}
                                        </span>
                                        <div>
                                          <div className="text-sm font-medium">
                                            {activity.title}
                                          </div>
                                          <div className="text-xs text-gray-500 flex items-center gap-2">
                                            <span>{activity.duration}</span>
                                            {activity.location && (
                                              <>
                                                <span>•</span>
                                                <span className="flex items-center">
                                                  <MapPin className="h-3 w-3 mr-1" />
                                                  {activity.location}
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Preferences Tab */}
        {destination?.preferences && (
          <TabsContent value="preferences" className="space-y-8">
            <h2 className="text-2xl font-semibold mb-6">
              Search Criteria for This Result
            </h2>

            <Card className="p-6">
              <div className="space-y-6">
                {Object.entries(destination.preferences).map(
                  ([category, values]) => (
                    <div
                      key={category}
                      className="border-b pb-4 last:border-0 last:pb-0"
                    >
                      <h3 className="font-medium mb-3 capitalize">
                        {category.replace(/([A-Z])/g, " $1").trim()}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {values.map((value) => (
                          <Badge key={value}>{value}</Badge>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </Card>

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">
                Match Score: {destination.match_percentage}%
              </h3>
              <p className="text-sm text-muted-foreground">
                This destination was matched to your search criteria with a{" "}
                {destination.match_percentage}% confidence score. The match is
                based on how well the destination's features align with your
                selected preferences.
              </p>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default DestinationDetails;
