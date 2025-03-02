import React, { useEffect, useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { supabase } from "@/lib/supabase";
import { useToast } from "../ui/use-toast";
import { LogOut, User, Settings } from "lucide-react";

interface UserProfileProps {
  onSignOut?: () => void;
}

interface UserData {
  id: string;
  email: string;
  name?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ onSignOut = () => {} }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUser({
            id: user.id,
            email: user.email || "",
            name: user.user_metadata?.name || "",
          });
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            name: session.user.user_metadata?.name || "",
          });
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      onSignOut();
    } catch (error: any) {
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

  if (!user) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto p-6 shadow-lg">
      <div className="flex flex-col items-center space-y-4">
        <Avatar className="h-20 w-20">
          <AvatarImage
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
          />
          <AvatarFallback>
            <User className="h-10 w-10" />
          </AvatarFallback>
        </Avatar>

        <div className="text-center">
          <h2 className="text-xl font-semibold">{user.name || "User"}</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>

        <div className="w-full pt-4 flex flex-col gap-2">
          <Button variant="outline" className="w-full justify-start">
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
