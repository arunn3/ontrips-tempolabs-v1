import React, { useEffect, useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { supabase } from "@/lib/supabase";
import { useToast } from "../ui/use-toast";
import { LogOut, User, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface UserProfileProps {
  onSignOut?: () => void;
}

interface UserData {
  id: string;
  email: string;
  name?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ onSignOut = () => {} }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user: authUser } = useAuth();

  // Use the user from AuthContext directly
  useEffect(() => {
    // Set a timeout to prevent infinite loading state
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.log("Loading timeout reached, forcing state update");
        setIsLoading(false);
      }
    }, 1000); // Reduced timeout to 1 second

    if (authUser) {
      setUserData({
        id: authUser.id,
        email: authUser.email || "",
        name: authUser.user_metadata?.name || "",
      });
      setIsLoading(false);
    } else {
      // If no user is found in context, try to fetch directly
      const fetchUser = async () => {
        try {
          const { data } = await supabase.auth.getUser();
          const user = data?.user;

          if (user) {
            setUserData({
              id: user.id,
              email: user.email || "",
              name: user.user_metadata?.name || "",
            });
          } else {
            console.log("No user found in auth.getUser()");
            setUserData(null);
          }
        } catch (error) {
          console.error("Error fetching user:", error);
          setUserData(null);
        } finally {
          setIsLoading(false);
        }
      };

      fetchUser();
    }

    return () => {
      clearTimeout(loadingTimeout);
    };
  }, [authUser]);

  const { signOut } = useAuth();

  const handleSignOut = () => {
    try {
      console.log("Sign out button clicked");

      // Call the onSignOut callback to close the modal
      onSignOut();

      // Use the signOut method from AuthContext
      signOut();
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto p-6 flex justify-center items-center">
        <div className="animate-pulse">Loading profile...</div>
      </Card>
    );
  }

  // If we have authUser from context but no userData, it's still loading
  if (authUser && !userData) {
    return (
      <Card className="w-full max-w-md mx-auto p-6 flex justify-center items-center">
        <div className="animate-pulse">Loading profile...</div>
      </Card>
    );
  }

  // If no user data and not loading, show error
  if (!userData && !isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto p-6 flex justify-center items-center">
        <div className="text-center">
          <p className="text-red-500 mb-2">Unable to load profile</p>
          <Button onClick={handleSignOut}>Sign Out</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto p-6 shadow-lg">
      <div className="flex flex-col items-center space-y-4">
        <Avatar className="h-20 w-20">
          <AvatarImage
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.id}`}
          />
          <AvatarFallback>
            <User className="h-10 w-10" />
          </AvatarFallback>
        </Avatar>

        <div className="text-center">
          <h2 className="text-xl font-semibold">{userData.name || "User"}</h2>
          <p className="text-sm text-muted-foreground">{userData.email}</p>
        </div>

        <div className="w-full pt-4 flex flex-col gap-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => (window.location.href = "/settings")}
          >
            <Settings className="mr-2 h-4 w-4" />
            Account Settings
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default UserProfile;
