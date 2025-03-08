import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user || null);
        console.log(
          "Initial auth session:",
          data.session?.user ? "User found" : "No user",
        );

        // Check if user needs to complete onboarding
        if (data.session?.user) {
          try {
            // Check localStorage for onboarding status
            const localOnboardingCompleted = localStorage.getItem(
              "onboardingCompleted",
            );

            if (localOnboardingCompleted === "true") {
              console.log(
                "User has completed onboarding according to localStorage",
              );
              return; // Skip database check if we know from localStorage
            }

            // Check if user has a profile
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("travel_interests, travel_styles")
              .eq("id", data.session.user.id)
              .single();

            // If user doesn't have a profile or has an empty profile, redirect to onboarding
            if (
              profileError?.code === "PGRST116" ||
              !profileData ||
              !profileData.travel_interests ||
              (profileData.travel_interests &&
                Object.keys(profileData.travel_interests).length === 0)
            ) {
              window.location.href = "/onboarding";
            }
          } catch (error) {
            console.error("Error checking onboarding status:", error);
          }
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(
          `Auth state changed: ${event}`,
          session?.user ? "User present" : "No user",
        );
        setSession(session);
        setUser(session?.user || null);

        // Check if user needs to complete onboarding after sign-in
        if (event === "SIGNED_IN" && session?.user) {
          try {
            // Check localStorage first for onboarding status
            const localOnboardingCompleted = localStorage.getItem(
              "onboardingCompleted",
            );

            if (localOnboardingCompleted === "true") {
              // User has completed onboarding according to localStorage
              return;
            }

            // Check if user has a profile with preferences
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("travel_interests, travel_styles")
              .eq("id", session.user.id)
              .single();

            // If user doesn't have a profile or has an empty profile, redirect to onboarding
            if (
              profileError?.code === "PGRST116" ||
              !profileData ||
              !profileData.travel_interests ||
              (profileData.travel_interests &&
                Object.keys(profileData.travel_interests).length === 0)
            ) {
              window.location.href = "/onboarding";
            }
          } catch (error) {
            console.error("Error checking onboarding status:", error);
          }
        }

        setIsLoading(false);
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const signOut = () => {
    try {
      // First clear React state
      setUser(null);
      setSession(null);
      setIsLoading(false);

      // Clear localStorage items
      localStorage.clear();

      // Sign out from Supabase (don't await)
      supabase.auth.signOut();

      // Force a complete page reload
      window.location.href = window.location.origin;
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  const value = {
    session,
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export { AuthProvider, useAuth };
