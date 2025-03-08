import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useToast } from "../ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { travelInterests, travelStyles } from "./onboardingData";

const OnboardingFlow = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<
    Record<string, string[]>
  >({});
  const [selectedStyles, setSelectedStyles] = useState<
    Record<string, string[]>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(
    Object.keys(travelInterests)[0],
  );
  const [styleActiveTab, setStyleActiveTab] = useState<string>(
    Object.keys(travelStyles)[0],
  );

  // Check if user has already completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        // Get current user session
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUser = sessionData.session?.user;

        if (!currentUser) {
          console.log("No user found, creating guest session");
          // Load preferences from localStorage if available
          const savedInterests = localStorage.getItem("guestInterests");
          const savedStyles = localStorage.getItem("guestStyles");
          if (savedInterests) setSelectedInterests(JSON.parse(savedInterests));
          if (savedStyles) setSelectedStyles(JSON.parse(savedStyles));
          return; // Allow guest to view onboarding
        }

        // Check if user has completed onboarding
        const { data, error } = await supabase
          .from("profiles")
          .select("travel_interests, travel_styles")
          .eq("id", currentUser.id)
          .single();

        if (error) {
          if (error.code !== "PGRST116") {
            // PGRST116 is "no rows returned" error
            console.error("Error checking onboarding status:", error);
          }
          // Create profile if it doesn't exist
          const { error: insertError } = await supabase
            .from("profiles")
            .upsert({
              id: currentUser.id,
              updated_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error("Error creating profile:", insertError);
          } else {
            console.log("Successfully created profile for", currentUser.id);
          }
          return;
        }

        // Check localStorage for onboarding status
        const localOnboardingCompleted = localStorage.getItem(
          "onboardingCompleted",
        );

        if (localOnboardingCompleted === "true") {
          // User has already completed onboarding according to localStorage
          navigate("/");
        } else if (data) {
          // User has started but not completed onboarding, load their preferences
          setSelectedInterests(data.travel_interests || {});
          setSelectedStyles(data.travel_styles || {});
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      }
    };

    checkOnboardingStatus();
  }, [navigate]);

  const handleInterestToggle = (category: string, interest: string) => {
    setSelectedInterests((prev) => {
      const currentCategorySelections = prev[category] || [];
      const updatedCategorySelections = currentCategorySelections.includes(
        interest,
      )
        ? currentCategorySelections.filter((item) => item !== interest)
        : [...currentCategorySelections, interest];

      return {
        ...prev,
        [category]: updatedCategorySelections,
      };
    });
  };

  const handleStyleToggle = (category: string, style: string) => {
    setSelectedStyles((prev) => {
      const currentCategorySelections = prev[category] || [];
      const updatedCategorySelections = currentCategorySelections.includes(
        style,
      )
        ? currentCategorySelections.filter((item) => item !== style)
        : [...currentCategorySelections, style];

      return {
        ...prev,
        [category]: updatedCategorySelections,
      };
    });
  };

  const getTotalSelectedCount = (selections: Record<string, string[]>) => {
    return Object.values(selections).reduce(
      (total, categorySelections) => total + categorySelections.length,
      0,
    );
  };

  const handleNext = () => {
    if (step === 1) {
      // Check if at least 3 interests are selected
      const totalInterests = getTotalSelectedCount(selectedInterests);
      if (totalInterests < 3) {
        toast({
          title: "Please select more interests",
          description: "Select at least 3 travel interests to continue",
          variant: "destructive",
        });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // Check if at least 2 travel styles are selected
      const totalStyles = getTotalSelectedCount(selectedStyles);
      if (totalStyles < 2) {
        toast({
          title: "Please select more travel styles",
          description: "Select at least 2 travel styles to continue",
          variant: "destructive",
        });
        return;
      }
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);

    try {
      // Use the user from AuthContext instead of fetching again
      const currentUser = user;

      if (!currentUser) {
        // If no user, create a guest profile
        toast({
          title: "Preferences saved locally",
          description: "Sign in to save your preferences across devices.",
        });

        // Store preferences in localStorage for now
        localStorage.setItem(
          "guestInterests",
          JSON.stringify(selectedInterests),
        );
        localStorage.setItem("guestStyles", JSON.stringify(selectedStyles));

        // Redirect to planner
        navigate("/planner");
        return;
      }
      // Store in localStorage as a backup
      localStorage.setItem("userInterests", JSON.stringify(selectedInterests));
      localStorage.setItem("userStyles", JSON.stringify(selectedStyles));
      localStorage.setItem("onboardingCompleted", "true");

      // Try direct upsert approach
      try {
        console.log("Using direct upsert approach");

        // First try to upsert the profile
        const { error: upsertError } = await supabase.from("profiles").upsert({
          id: currentUser.id,
          travel_interests: selectedInterests,
          travel_styles: selectedStyles,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        });

        if (!upsertError) {
          console.log("Upsert succeeded");
          toast({
            title: "Onboarding complete!",
            description: "Your travel preferences have been saved.",
          });
          navigate("/planner");
          return;
        } else {
          console.error("Upsert error:", upsertError);

          // Try insert as fallback
          const { error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: currentUser.id,
              travel_interests: selectedInterests,
              travel_styles: selectedStyles,
              onboarding_completed: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (!insertError) {
            console.log("Insert succeeded");
            toast({
              title: "Onboarding complete!",
              description: "Your travel preferences have been saved.",
            });
            navigate("/planner");
            return;
          } else {
            console.error("Insert error:", insertError);

            // Last resort: try update
            const { error: updateError } = await supabase
              .from("profiles")
              .update({
                travel_interests: selectedInterests,
                travel_styles: selectedStyles,
                onboarding_completed: true,
                updated_at: new Date().toISOString(),
              })
              .eq("id", currentUser.id);

            if (!updateError) {
              console.log("Update succeeded");
              toast({
                title: "Onboarding complete!",
                description: "Your travel preferences have been saved.",
              });
              navigate("/planner");
              return;
            } else {
              console.error("Update error:", updateError);
            }
          }
        }
      } catch (error) {
        console.error("Database operation failed:", error);
      }

      // Show success message anyway since we saved to localStorage
      toast({
        title: "Preferences Saved",
        description:
          "Your preferences have been saved. You can now continue to the planner.",
      });

      // Redirect to planner
      navigate("/planner");
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error saving preferences",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressPercentage = () => {
    return step === 1 ? 50 : 100;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-4xl p-6 shadow-lg">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">
            Tell us about your travel preferences
          </h1>
          <p className="text-muted-foreground mb-4">
            {step === 1
              ? "Select your travel interests to help us personalize your experience."
              : "Select your preferred travel styles to help us tailor your itineraries."}
          </p>
          <Progress value={getProgressPercentage()} className="h-2" />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>Step {step} of 2</span>
            <span>{getProgressPercentage()}% Complete</span>
          </div>
        </div>

        {step === 1 ? (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">
              What do you want to see and do?
            </h2>
            <p className="text-sm text-muted-foreground">
              Select at least 3 interests that excite you the most.
            </p>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="w-full flex flex-wrap h-auto mb-4">
                {Object.keys(travelInterests).map((category) => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="flex-grow text-sm py-2"
                  >
                    {category}
                    {selectedInterests[category]?.length > 0 && (
                      <span className="ml-2 bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
                        {selectedInterests[category].length}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(travelInterests).map(([category, interests]) => (
                <TabsContent key={category} value={category} className="mt-0">
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {interests.map((interest) => (
                        <div
                          key={interest}
                          className="flex items-start space-x-2 p-3 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            id={`interest-${category}-${interest}`}
                            checked={
                              selectedInterests[category]?.includes(interest) ||
                              false
                            }
                            onCheckedChange={() =>
                              handleInterestToggle(category, interest)
                            }
                          />
                          <Label
                            htmlFor={`interest-${category}-${interest}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {interest}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">
              How do you prefer to travel?
            </h2>
            <p className="text-sm text-muted-foreground">
              Select at least 2 travel styles that match your preferences.
            </p>

            <Tabs
              value={styleActiveTab}
              onValueChange={setStyleActiveTab}
              className="w-full"
            >
              <TabsList className="w-full flex flex-wrap h-auto mb-4">
                {Object.keys(travelStyles).map((category) => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="flex-grow text-sm py-2"
                  >
                    {category}
                    {selectedStyles[category]?.length > 0 && (
                      <span className="ml-2 bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
                        {selectedStyles[category].length}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(travelStyles).map(([category, styles]) => (
                <TabsContent key={category} value={category} className="mt-0">
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {styles.map((style) => (
                        <div
                          key={style}
                          className="flex items-start space-x-2 p-3 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            id={`style-${category}-${style}`}
                            checked={
                              selectedStyles[category]?.includes(style) || false
                            }
                            onCheckedChange={() =>
                              handleStyleToggle(category, style)
                            }
                          />
                          <Label
                            htmlFor={`style-${category}-${style}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {style}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}

        <div className="flex justify-between mt-8">
          {step === 1 ? (
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              disabled={isLoading}
            >
              Skip for now
            </Button>
          ) : (
            <Button variant="outline" onClick={handleBack} disabled={isLoading}>
              Back
            </Button>
          )}
          <Button onClick={handleNext} disabled={isLoading}>
            {isLoading ? "Saving..." : step === 1 ? "Next" : "Complete"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default OnboardingFlow;
