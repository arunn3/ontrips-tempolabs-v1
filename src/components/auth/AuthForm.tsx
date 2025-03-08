import React, { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { supabase } from "@/lib/supabase";
import { useToast } from "../ui/use-toast";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AuthFormProps {
  onSuccess?: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onSuccess = () => {} }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // Create user profile with onboarding_completed = false
      if (data.user) {
        try {
          // Use upsert to handle both insert and update cases
          const { error: upsertError } = await supabase.from("profiles").upsert(
            {
              id: data.user.id,
              onboarding_completed: false,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" },
          );

          if (upsertError) {
            console.error("Error creating/updating user profile:", upsertError);
          } else {
            console.log(
              "Successfully created/updated user profile",
              data.user.id,
            );
          }
        } catch (prefError) {
          console.error("Error creating user profile:", prefError);
        }
      }

      toast({
        title: "Success!",
        description: data.user
          ? "Account created successfully! You can now sign in."
          : "Check your email for the confirmation link.",
      });

      // Reset form state
      setEmail("");
      setPassword("");
      setName("");
      setIsLoading(false);

      // If user was created successfully, redirect to onboarding
      if (data.user) {
        // Close the modal first
        onSuccess();
        // Then redirect to onboarding immediately
        window.location.href = "/onboarding";
      } else {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

      // Check if user needs to complete onboarding
      if (data.user) {
        try {
          // Check if user has onboarding_completed in their profile
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("onboarding_completed")
            .eq("id", data.user.id)
            .single();

          // Close the modal first
          onSuccess();

          // Check localStorage first for onboarding status
          const localOnboardingCompleted = localStorage.getItem(
            "onboardingCompleted",
          );

          if (localOnboardingCompleted === "true") {
            // User has already completed onboarding according to localStorage
            return;
          }

          // If user doesn't have a profile or has an empty profile, redirect to onboarding
          if (
            profileError?.code === "PGRST116" ||
            !profileData ||
            !profileData.travel_interests ||
            Object.keys(profileData.travel_interests || {}).length === 0
          ) {
            window.location.href = "/onboarding";
          }
        } catch (profileError) {
          console.error("Error checking onboarding status:", profileError);
          onSuccess();
        }
      } else {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Invalid login credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6 shadow-lg">
      <Tabs defaultValue="signin" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        <TabsContent value="signin">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Password must be at least 6 characters long
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default AuthForm;
