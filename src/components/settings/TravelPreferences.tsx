import React, { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useToast } from "../ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { travelInterests, travelStyles } from "../onboarding/onboardingData";
import { Loader2 } from "lucide-react";

const TravelPreferences = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedInterests, setSelectedInterests] = useState<
    Record<string, string[]>
  >({});
  const [selectedStyles, setSelectedStyles] = useState<
    Record<string, string[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [interestsTab, setInterestsTab] = useState<string>(
    Object.keys(travelInterests)[0],
  );
  const [stylesTab, setStylesTab] = useState<string>(
    Object.keys(travelStyles)[0],
  );

  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("travel_interests, travel_styles")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (data) {
          setSelectedInterests(data.travel_interests || {});
          setSelectedStyles(data.travel_styles || {});
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
        // Try to load from localStorage as fallback
        const savedInterests = localStorage.getItem("userInterests");
        const savedStyles = localStorage.getItem("userStyles");

        if (savedInterests) setSelectedInterests(JSON.parse(savedInterests));
        if (savedStyles) setSelectedStyles(JSON.parse(savedStyles));
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

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

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      // Save to localStorage as backup
      localStorage.setItem("userInterests", JSON.stringify(selectedInterests));
      localStorage.setItem("userStyles", JSON.stringify(selectedStyles));

      // Save to database
      const { error } = await supabase
        .from("profiles")
        .update({
          travel_interests: selectedInterests,
          travel_styles: selectedStyles,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Preferences updated",
        description: "Your travel preferences have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update preferences",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getTotalSelectedCount = (selections: Record<string, string[]>) => {
    return Object.values(selections).reduce(
      (total, categorySelections) => total + categorySelections.length,
      0,
    );
  };

  if (isLoading) {
    return (
      <Card className="p-6 flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading your preferences...</span>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6">Travel Interests</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Select the travel interests that excite you the most.
        </p>

        <Tabs
          value={interestsTab}
          onValueChange={setInterestsTab}
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
              <ScrollArea className="h-[300px] pr-4">
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

        <div className="mt-4 text-sm text-muted-foreground">
          {getTotalSelectedCount(selectedInterests)} interests selected
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6">Travel Styles</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Select the travel styles that match your preferences.
        </p>

        <Tabs value={stylesTab} onValueChange={setStylesTab} className="w-full">
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
              <ScrollArea className="h-[300px] pr-4">
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

        <div className="mt-4 text-sm text-muted-foreground">
          {getTotalSelectedCount(selectedStyles)} styles selected
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </div>
    </div>
  );
};

export default TravelPreferences;
