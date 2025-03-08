import React, { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useToast } from "../ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import ProfileSettings from "./ProfileSettings";
import TravelPreferences from "./TravelPreferences";
import SecuritySettings from "./SecuritySettings";

const AccountSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Please sign in</h2>
        <p className="text-muted-foreground mb-6">
          You need to be signed in to access account settings.
        </p>
        <Button onClick={() => (window.location.href = "/")}>Go to Home</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <Card className="p-4 lg:col-span-1">
          <div className="flex flex-col items-start h-auto w-full space-y-1">
            <Button
              variant={activeTab === "profile" ? "default" : "ghost"}
              className="w-full justify-start px-4 py-3 text-left"
              onClick={() => setActiveTab("profile")}
            >
              Profile Information
            </Button>
            <Button
              variant={activeTab === "preferences" ? "default" : "ghost"}
              className="w-full justify-start px-4 py-3 text-left"
              onClick={() => setActiveTab("preferences")}
            >
              Travel Preferences
            </Button>
            <Button
              variant={activeTab === "security" ? "default" : "ghost"}
              className="w-full justify-start px-4 py-3 text-left"
              onClick={() => setActiveTab("security")}
            >
              Security
            </Button>
          </div>
        </Card>

        <div className="lg:col-span-3">
          {activeTab === "profile" && <ProfileSettings />}
          {activeTab === "preferences" && <TravelPreferences />}
          {activeTab === "security" && <SecuritySettings />}
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
