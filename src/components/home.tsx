import React, { useState, useEffect } from "react";
import ChatInterface from "./ChatInterface";
import ScheduleView from "./ScheduleView";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Calendar, Menu, User, MessageSquare, X } from "lucide-react";
import AuthModal from "./auth/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

interface HomeProps {
  onMenuClick?: () => void;
}

const Home = ({ onMenuClick = () => {} }: HomeProps) => {
  const [showChat, setShowChat] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<"schedule" | "chat">("schedule");
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if the screen is mobile size
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);

    // Set up listener for shared itinerary updates
    const handleSharedItineraryUpdate = (event: any) => {
      if (event.detail && event.detail.itinerary) {
        console.log(
          "Home received shared itinerary update:",
          event.detail.itinerary,
        );

        // Update localStorage to ensure consistency
        localStorage.setItem(
          "generatedItinerary",
          JSON.stringify(event.detail.itinerary),
        );
        localStorage.setItem("itineraryUpdate", Date.now().toString());

        // Dispatch an itineraryUpdated event to notify ScheduleView
        const updateEvent = new CustomEvent("itineraryUpdated", {
          detail: {
            status: "complete",
            itinerary: event.detail.itinerary,
            timestamp: event.detail.timestamp || Date.now(),
          },
        });
        window.dispatchEvent(updateEvent);

        // Force a reload of the schedule view
        const reloadEvent = new CustomEvent("itineraryChanged", {
          detail: { timestamp: Date.now() },
        });
        document.dispatchEvent(reloadEvent);
      }
    };

    window.addEventListener(
      "sharedItineraryUpdate",
      handleSharedItineraryUpdate,
    );

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkIfMobile);
      window.removeEventListener(
        "sharedItineraryUpdate",
        handleSharedItineraryUpdate,
      );
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onMenuClick}>
              <Menu className="h-5 w-5" />
            </Button>
            <Link to="/" className="text-xl font-semibold">
              SagaScout
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {isMobile ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setMobileView(mobileView === "schedule" ? "chat" : "schedule")
                }
              >
                {mobileView === "schedule" ? (
                  <>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChat(!showChat)}
              >
                {showChat ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Hide Chat
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Show Chat
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
              className="hidden sm:flex"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Explore Destinations
            </Button>
            <AuthModal
              trigger={
                <Button variant="outline" size="sm">
                  <User className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">
                    {user ? "Profile" : "Sign In"}
                  </span>
                </Button>
              }
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-1 sm:px-4 py-2 sm:py-6">
        {isMobile ? (
          // Mobile layout - stack views and show only one at a time
          <div className="h-[calc(100vh-100px)]">
            {mobileView === "schedule" ? (
              <ScrollArea className="h-full overflow-hidden">
                <ScheduleView />
              </ScrollArea>
            ) : (
              <ScrollArea className="h-full overflow-hidden">
                <ChatInterface />
              </ScrollArea>
            )}
          </div>
        ) : (
          // Desktop layout - side by side views
          <div className="flex flex-col lg:flex-row gap-2 lg:gap-6 h-[calc(100vh-100px)]">
            {/* Schedule View */}
            <div className="flex-1">
              <ScrollArea className="h-full overflow-hidden">
                <ScheduleView />
              </ScrollArea>
            </div>

            {/* Chat Interface */}
            {showChat && (
              <div className="lg:w-[400px] h-full">
                <ScrollArea className="h-full overflow-hidden">
                  <ChatInterface />
                </ScrollArea>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
