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

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
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
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {isMobile ? (
          // Mobile layout - stack views and show only one at a time
          <div className="h-[calc(100vh-120px)]">
            {mobileView === "schedule" ? (
              <ScrollArea className="h-full">
                <ScheduleView />
              </ScrollArea>
            ) : (
              <ScrollArea className="h-full">
                <ChatInterface />
              </ScrollArea>
            )}
          </div>
        ) : (
          // Desktop layout - side by side views
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[calc(100vh-120px)]">
            {/* Schedule View */}
            <div className="flex-1">
              <ScrollArea className="h-full">
                <ScheduleView />
              </ScrollArea>
            </div>

            {/* Chat Interface */}
            {showChat && (
              <div className="lg:w-[400px]">
                <ScrollArea className="h-full">
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
