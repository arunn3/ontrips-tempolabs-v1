import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { travelInterests, travelStyles } from "./onboarding/onboardingData";
import { supabase } from "@/lib/supabase";

interface PreferencesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPreferences: Record<string, string[]>;
  onSave: (preferences: Record<string, string[]>) => void;
}

const PreferencesModal: React.FC<PreferencesModalProps> = ({
  open,
  onOpenChange,
  initialPreferences,
  onSave,
}) => {
  const [preferences, setPreferences] = useState<Record<string, string[]>>({
    ...initialPreferences,
    budget: initialPreferences.budget || [],
    accommodation: initialPreferences.accommodation || [],
    transportation: initialPreferences.transportation || [],
  });
  const [activeTab, setActiveTab] = useState("travelType");
  const [profilePreferences, setProfilePreferences] = useState<{
    travelInterests: Record<string, string[]>;
    travelStyles: Record<string, string[]>;
  } | null>(null);

  // Fetch user's profile preferences when modal opens
  useEffect(() => {
    const fetchProfilePreferences = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { data: profileData, error } = await supabase
            .from("profiles")
            .select("travel_interests, travel_styles")
            .eq("id", userData.user.id)
            .single();

          if (!error && profileData) {
            setProfilePreferences({
              travelInterests: profileData.travel_interests || {},
              travelStyles: profileData.travel_styles || {},
            });
          }
        }
      } catch (error) {
        console.error("Error fetching profile preferences:", error);
      }
    };

    if (open) {
      fetchProfilePreferences();
    }
  }, [open]);

  // Travel type options from the Travel Type & Group category in travelStyles
  const travelTypeOptions = travelStyles["Travel Type & Group"] || [];

  // Travel style options from the Pace & Detail Level category in travelStyles
  const travelStyleOptions = travelStyles["Pace & Detail Level"] || [];

  // We'll use the categorized interests directly from travelInterests

  const handleToggle = (category: string, option: string) => {
    setPreferences((prev) => {
      const currentSelections = prev[category] || [];
      const updatedSelections = currentSelections.includes(option)
        ? currentSelections.filter((item) => item !== option)
        : [...currentSelections, option];

      return {
        ...prev,
        [category]: updatedSelections,
      };
    });
  };

  const handleSave = () => {
    onSave(preferences);
    onOpenChange(false);
  };

  // Helper function to get all selected interests from profile
  const getAllProfileInterests = () => {
    if (!profilePreferences?.travelInterests) return [];
    return Object.values(profilePreferences.travelInterests).flat();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Customize Trip Preferences</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="travelType">Travel Type</TabsTrigger>
            <TabsTrigger value="travelStyle">Travel Style</TabsTrigger>
            <TabsTrigger value="interests">Interests</TabsTrigger>
          </TabsList>

          <TabsContent value="travelType" className="mt-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="grid grid-cols-2 gap-3">
                {travelTypeOptions.map((option) => (
                  <div
                    key={option}
                    className="flex items-start space-x-2 p-3 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={`type-${option}`}
                      checked={
                        preferences.travelType?.includes(option) || false
                      }
                      onCheckedChange={() => handleToggle("travelType", option)}
                    />
                    <Label
                      htmlFor={`type-${option}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="travelStyle" className="mt-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="grid grid-cols-2 gap-3">
                {travelStyleOptions.map((option) => (
                  <div
                    key={option}
                    className="flex items-start space-x-2 p-3 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={`style-${option}`}
                      checked={
                        preferences.travelStyle?.includes(option) || false
                      }
                      onCheckedChange={() =>
                        handleToggle("travelStyle", option)
                      }
                    />
                    <Label
                      htmlFor={`style-${option}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="interests" className="mt-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-6">
                {Object.entries(travelInterests).map(
                  ([category, interests]) => (
                    <div key={category} className="space-y-2">
                      <h3 className="text-sm font-semibold">{category}</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {interests.map((option) => (
                          <div
                            key={option}
                            className="flex items-start space-x-2 p-3 rounded-md hover:bg-muted/50 transition-colors"
                          >
                            <Checkbox
                              id={`interest-${option}`}
                              checked={
                                preferences.interests?.includes(option) || false
                              }
                              onCheckedChange={() =>
                                handleToggle("interests", option)
                              }
                            />
                            <Label
                              htmlFor={`interest-${option}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {option}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Preferences</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PreferencesModal;
